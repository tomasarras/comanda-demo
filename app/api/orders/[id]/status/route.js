import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrderFlow, isCheckoutStatus, nextStatus, serializeOrder } from "@/lib/orders";

const ORDER_INCLUDE = { items: { include: { product: true } }, table: true };

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
    if (order.paid) {
      return NextResponse.json({ error: "No se puede cancelar una orden que ya fue pagada" }, { status: 409 });
    }
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
        include: ORDER_INCLUDE,
      });
    });
    return NextResponse.json(serializeOrder(updated));
  }

  if (action === "advance") {
    const next = nextStatus(order);
    if (!next) {
      return NextResponse.json({ error: "Esta orden ya llegó al último paso — hay que cobrarla" }, { status: 400 });
    }
    const updated = await prisma.order.update({
      where: { id },
      data: { status: next, deliveredBy: next === "ENTREGADA" ? body.deliveredBy || null : undefined },
      include: ORDER_INCLUDE,
    });
    return NextResponse.json(serializeOrder(updated));
  }

  // Arrastrar y soltar una tarjeta en otra columna: mueve la orden a
  // cualquier estado de su propio circuito, para adelante o para atrás (ej.
  // el delivery marcó "Entregado" por error y hay que volverla a "Enviando").
  if (action === "move") {
    const flow = getOrderFlow(order);
    if (!flow.includes(body.status)) {
      return NextResponse.json({ error: "Estado inválido para este tipo de orden" }, { status: 400 });
    }
    const updated = await prisma.order.update({
      where: { id },
      data: { status: body.status },
      include: ORDER_INCLUDE,
    });
    return NextResponse.json(serializeOrder(updated));
  }

  // Cierra una orden que llegó al último paso de su circuito y ya estaba
  // pagada por adelantado (prepago) — no genera una venta nueva, solo la cierra.
  if (action === "close") {
    if (!order.paid) {
      return NextResponse.json({ error: "Esta orden todavía no está pagada" }, { status: 400 });
    }
    if (!isCheckoutStatus(order)) {
      return NextResponse.json({ error: "La orden todavía no llegó al último paso" }, { status: 400 });
    }
    const updated = await prisma.order.update({
      where: { id },
      data: { status: "PAGADA", closedAt: new Date() },
      include: ORDER_INCLUDE,
    });
    return NextResponse.json(serializeOrder(updated));
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
