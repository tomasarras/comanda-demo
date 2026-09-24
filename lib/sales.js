import { prisma } from "@/lib/prisma";
import { isCheckoutStatus } from "@/lib/orders";
import { getSettings } from "@/lib/settings";

export class SaleError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const ORDER_INCLUDE = { items: { include: { product: true } }, table: true, sale: true };

// Toma un pedido de salón (con mesa) o para retirar/con envío (con datos de
// contacto en vez de mesa). Si ya vino cobrado (pagado por adelantado, ej.
// transferencia al encargar), registra la venta y el movimiento de caja en
// la misma transacción, pero el estado sigue el circuito de cocina normal
// — "paid" y "status" son independientes hasta que la orden se cierra.
export async function createOrder({
  type,
  tableId,
  waiterName,
  customerName,
  customerPhone,
  address,
  deliveryMode,
  paid,
  paymentMethod,
  cashierName,
  items,
}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new SaleError("La orden no tiene productos", 400);
  }

  let openShift = null;
  if (paid) {
    openShift = await prisma.cashRegisterShift.findFirst({ where: { closedAt: null } });
    if (!openShift) {
      throw new SaleError("No hay una caja abierta. Abrí un turno para poder cobrar.", 409);
    }
  }

  if (type === "SALON") {
    if (!tableId) throw new SaleError("Falta seleccionar una mesa", 400);
    const table = await prisma.restaurantTable.findUnique({
      where: { id: tableId },
      // Una orden ENTREGADA no bloquea la mesa: se queda ahí esperando el
      // cobro combinado (ver checkoutTable) y no impide pedir otra ronda
      // (ej. postre después del plato principal). Solo bloquea si ya hay
      // una orden todavía en curso de cocina.
      include: { orders: { where: { status: { in: ["ABIERTA", "EN_COCINA", "LISTA"] } } } },
    });
    if (!table) throw new SaleError("La mesa no existe", 400);
    if (table.orders.length > 0) throw new SaleError("La mesa ya tiene una orden en curso", 409);
  } else {
    if (!customerName?.trim()) throw new SaleError("Falta el nombre de quien pide", 400);
    if (!customerPhone?.trim()) throw new SaleError("Falta el teléfono de contacto", 400);
    if (!["RETIRA", "ENVIO"].includes(deliveryMode)) {
      throw new SaleError("Falta indicar si es para retirar o con envío", 400);
    }
    if (deliveryMode === "ENVIO" && !address?.trim()) {
      throw new SaleError("Falta la dirección de entrega", 400);
    }
  }

  const products = await prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let total = 0;
  const itemsData = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new SaleError("Uno de los productos ya no existe", 400);
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new SaleError("Cantidad inválida", 400);
    const unitPrice = Number(product.price);
    total += unitPrice * quantity;
    return { product, quantity, unitPrice, notes: item.notes || null };
  });

  let deliveryFee = 0;
  if (type === "DELIVERY" && deliveryMode === "ENVIO") {
    deliveryFee = (await getSettings()).deliveryFee;
    total += deliveryFee;
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        type,
        status: "ABIERTA",
        table: type === "SALON" ? { connect: { id: tableId } } : undefined,
        waiterName: waiterName || null,
        customerName: type === "DELIVERY" ? customerName.trim() : null,
        customerPhone: type === "DELIVERY" ? customerPhone.trim() : null,
        address: deliveryMode === "ENVIO" ? address.trim() : null,
        deliveryMode: type === "DELIVERY" ? deliveryMode : null,
        paid: Boolean(paid),
        deliveryFee,
        total,
        items: {
          create: itemsData.map(({ product, quantity, unitPrice, notes }) => ({
            productId: product.id,
            quantity,
            unitPrice,
            notes,
          })),
        },
        sale: paid ? { create: { total, paymentMethod, cashierName } } : undefined,
      },
      include: ORDER_INCLUDE,
    });

    if (paid) {
      await tx.cashMovement.create({
        data: {
          shiftId: openShift.id,
          type: "VENTA",
          amount: total,
          description: `Venta ${deliveryMode === "ENVIO" ? "envío" : "retiro"} #${created.id.slice(-6)} (prepago)`,
        },
      });
    }

    for (const { product, quantity } of itemsData) {
      await tx.product.update({
        where: { id: product.id },
        data: { stock: Math.max(product.stock - quantity, 0) },
      });
    }

    return created;
  });

  return order;
}

// Shared checkout used by Mostrador today and by Órdenes later: opens an
// Order as already PAGADA, records the Sale, and drops a VENTA movement
// into the open Caja shift — all in one transaction, or none of it.
export async function completeSale({ items, paymentMethod, cashierName, orderType = "MOSTRADOR", tableId = null }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new SaleError("El pedido no tiene productos", 400);
  }

  const openShift = await prisma.cashRegisterShift.findFirst({ where: { closedAt: null } });
  if (!openShift) {
    throw new SaleError("No hay una caja abierta. Abrí un turno para poder cobrar.", 409);
  }

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let total = 0;
  const orderItemsData = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new SaleError("Uno de los productos ya no existe", 400);
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new SaleError("Cantidad inválida", 400);
    }
    const unitPrice = Number(product.price);
    total += unitPrice * quantity;
    return { product, quantity, unitPrice, notes: item.notes || null };
  });

  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        type: orderType,
        status: "PAGADA",
        paid: true,
        table: tableId ? { connect: { id: tableId } } : undefined,
        waiterName: cashierName,
        total,
        closedAt: new Date(),
        items: {
          create: orderItemsData.map(({ product, quantity, unitPrice, notes }) => ({
            productId: product.id,
            quantity,
            unitPrice,
            notes,
          })),
        },
        sale: { create: { total, paymentMethod, cashierName } },
      },
      include: { items: { include: { product: true } }, sale: true },
    });

    await tx.cashMovement.create({
      data: {
        shiftId: openShift.id,
        type: "VENTA",
        amount: total,
        description: `Venta ${orderType === "MOSTRADOR" ? "mostrador" : "salón"} #${order.id.slice(-6)}`,
      },
    });

    for (const { product, quantity } of orderItemsData) {
      await tx.product.update({
        where: { id: product.id },
        data: { stock: Math.max(product.stock - quantity, 0) },
      });
    }

    return order;
  });

  return { order, sale: order.sale };
}

// Cobra de una sola vez todas las órdenes ENTREGADA de una mesa (Órdenes de
// salón): puede ser una sola orden o varias (ej. plato + postre pedidos por
// separado). Genera una única Sale con el total combinado y un único
// movimiento de caja, y marca todas las órdenes involucradas como PAGADA.
export async function checkoutTable(tableId, { paymentMethod, cashierName }) {
  const openShift = await prisma.cashRegisterShift.findFirst({ where: { closedAt: null } });
  if (!openShift) {
    throw new SaleError("No hay una caja abierta. Abrí un turno para poder cobrar.", 409);
  }

  const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
  if (!table) throw new SaleError("La mesa no existe", 404);

  const orders = await prisma.order.findMany({
    where: { tableId, status: "ENTREGADA" },
    include: { items: true },
  });
  if (orders.length === 0) {
    throw new SaleError("La mesa no tiene órdenes entregadas para cobrar", 400);
  }

  const orderTotals = orders.map((order) => ({
    order,
    total: order.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0),
  }));
  const combinedTotal = orderTotals.reduce((sum, o) => sum + o.total, 0);

  const { updatedOrders, sale } = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: { total: combinedTotal, paymentMethod, cashierName },
    });

    const updatedOrders = [];
    for (const { order, total } of orderTotals) {
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: "PAGADA", paid: true, closedAt: new Date(), total, saleId: sale.id },
        include: { items: { include: { product: true } }, table: true },
      });
      updatedOrders.push(updated);
    }

    await tx.cashMovement.create({
      data: {
        shiftId: openShift.id,
        type: "VENTA",
        amount: combinedTotal,
        description: `Venta mesa ${table.number} (${orders.length} orden${orders.length === 1 ? "" : "es"})`,
      },
    });

    return { updatedOrders, sale };
  });

  return { orders: updatedOrders, sale };
}

// Cobra una orden individual "para retirar" o "con envío" (no está atada a
// una mesa, así que no se agrupa como checkoutTable). Si la orden ya vino
// pagada por adelantado, esto no debería llamarse — la UI cierra esas con
// la acción "close" del status route en su lugar.
export async function checkoutOrder(orderId, { paymentMethod, cashierName }) {
  const openShift = await prisma.cashRegisterShift.findFirst({ where: { closedAt: null } });
  if (!openShift) {
    throw new SaleError("No hay una caja abierta. Abrí un turno para poder cobrar.", 409);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new SaleError("La orden no existe", 404);
  if (order.status === "PAGADA" || order.status === "CANCELADA") {
    throw new SaleError("La orden ya está cerrada", 409);
  }
  if (order.paid) throw new SaleError("La orden ya fue pagada", 409);
  if (!isCheckoutStatus(order)) {
    throw new SaleError("La orden todavía no llegó al último paso", 400);
  }

  const total =
    order.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0) + Number(order.deliveryFee);

  const { updated, sale } = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({ data: { total, paymentMethod, cashierName } });
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: "PAGADA", paid: true, closedAt: new Date(), total, saleId: sale.id },
      include: { items: { include: { product: true } }, table: true },
    });

    await tx.cashMovement.create({
      data: {
        shiftId: openShift.id,
        type: "VENTA",
        amount: total,
        description: `Venta ${order.type === "DELIVERY" && order.deliveryMode === "ENVIO" ? "envío" : "retiro"} #${order.id.slice(-6)}`,
      },
    });

    return { updated, sale };
  });

  return { order: updated, sale };
}
