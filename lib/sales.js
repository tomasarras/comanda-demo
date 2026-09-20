import { prisma } from "@/lib/prisma";

export class SaleError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
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

  const { order, sale } = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        type: orderType,
        status: "PAGADA",
        tableId,
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
      },
      include: { items: { include: { product: true } } },
    });

    const sale = await tx.sale.create({
      data: { orderId: order.id, total, paymentMethod, cashierName },
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

    return { order, sale };
  });

  return { order, sale };
}

// Finalizes payment on an existing order (Órdenes de salón): the order was
// already created and walked through the kitchen statuses — this only
// records the Sale + VENTA movement and marks it PAGADA.
export async function checkoutOrder(orderId, { paymentMethod, cashierName }) {
  const openShift = await prisma.cashRegisterShift.findFirst({ where: { closedAt: null } });
  if (!openShift) {
    throw new SaleError("No hay una caja abierta. Abrí un turno para poder cobrar.", 409);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, table: true },
  });
  if (!order) throw new SaleError("La orden no existe", 404);
  if (order.status === "PAGADA") throw new SaleError("La orden ya fue cobrada", 409);
  if (order.status === "CANCELADA") throw new SaleError("La orden está cancelada", 409);

  const total = order.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

  const { updatedOrder, sale } = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "PAGADA", closedAt: new Date(), total },
      include: { items: { include: { product: true } }, table: true },
    });

    const sale = await tx.sale.create({
      data: { orderId: order.id, total, paymentMethod, cashierName },
    });

    await tx.cashMovement.create({
      data: {
        shiftId: openShift.id,
        type: "VENTA",
        amount: total,
        description: `Venta salón mesa ${order.table?.number ?? "-"} #${order.id.slice(-6)}`,
      },
    });

    return { updatedOrder, sale };
  });

  return { order: updatedOrder, sale };
}
