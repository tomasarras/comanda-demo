import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nextStatus, serializeOrder } from "@/lib/orders";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const action = body.action;

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) {
    return NextResponse.json({ error: "La orden no existe" }, { status: 404 });
  }
  if (order.status === "PAGADA" || order.status === "CANCELADA") {
    return NextResponse.json({ error: "La orden ya está cerrada" }, { status: 409 });
  }

  if (action === "cancel") {
    const updated = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
      return tx.order.update({
        where: { id },
        data: { status: "CANCELADA", closedAt: new Date() },
        include: { items: { include: { product: true } }, table: true },
      });
    });
    return NextResponse.json(serializeOrder(updated));
  }

  if (action === "advance") {
    const next = nextStatus(order.status);
    if (!next) {
      return NextResponse.json({ error: "Esta orden ya está lista para cobrar" }, { status: 400 });
    }
    const updated = await prisma.order.update({
      where: { id },
      data: { status: next },
      include: { items: { include: { product: true } }, table: true },
    });
    return NextResponse.json(serializeOrder(updated));
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
