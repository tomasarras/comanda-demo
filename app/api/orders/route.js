import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/orders";

export async function GET() {
  const orders = await prisma.order.findMany({
    where: { status: { notIn: ["PAGADA", "CANCELADA"] } },
    include: { items: { include: { product: true } }, table: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(orders.map(serializeOrder));
}

export async function POST(request) {
  const body = await request.json();
  const tableId = body.tableId;
  const waiterName = (body.waiterName || "").trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!tableId) {
    return NextResponse.json({ error: "Falta seleccionar una mesa" }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "La orden no tiene productos" }, { status: 400 });
  }

  const table = await prisma.restaurantTable.findUnique({
    where: { id: tableId },
    include: { orders: { where: { status: { notIn: ["PAGADA", "CANCELADA"] } } } },
  });
  if (!table) {
    return NextResponse.json({ error: "La mesa no existe" }, { status: 400 });
  }
  if (table.orders.length > 0) {
    return NextResponse.json({ error: "La mesa ya tiene una orden abierta" }, { status: 409 });
  }

  const products = await prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let total = 0;
  const itemsData = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new Error("Uno de los productos ya no existe");
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Cantidad inválida");
    const unitPrice = Number(product.price);
    total += unitPrice * quantity;
    return { product, quantity, unitPrice, notes: item.notes || null };
  });

  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        type: "SALON",
        status: "ABIERTA",
        tableId,
        waiterName: waiterName || null,
        total,
        items: {
          create: itemsData.map(({ product, quantity, unitPrice, notes }) => ({
            productId: product.id,
            quantity,
            unitPrice,
            notes,
          })),
        },
      },
      include: { items: { include: { product: true } }, table: true },
    });

    for (const { product, quantity } of itemsData) {
      await tx.product.update({
        where: { id: product.id },
        data: { stock: Math.max(product.stock - quantity, 0) },
      });
    }

    return order;
  });

  return NextResponse.json(serializeOrder(order), { status: 201 });
}
