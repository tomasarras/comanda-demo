import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/orders";
import { createOrder, SaleError } from "@/lib/sales";

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

  try {
    const order = await createOrder({
      type: body.type === "DELIVERY" ? "DELIVERY" : "SALON",
      tableId: body.tableId || null,
      waiterName: (body.waiterName || "").trim(),
      customerName: body.customerName || "",
      customerPhone: body.customerPhone || "",
      address: body.address || "",
      deliveryMode: body.deliveryMode,
      paid: Boolean(body.paid),
      paymentMethod: body.paymentMethod,
      cashierName: (body.cashierName || body.waiterName || "").trim() || "Equipo",
      items: Array.isArray(body.items) ? body.items : [],
    });
    return NextResponse.json(serializeOrder(order), { status: 201 });
  } catch (err) {
    if (err instanceof SaleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
