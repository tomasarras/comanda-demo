import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeReservation } from "@/lib/reservations";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  const data = {};

  if (body.tableId !== undefined) {
    const table = await prisma.restaurantTable.findUnique({ where: { id: body.tableId } });
    if (!table) return NextResponse.json({ error: "La mesa no existe" }, { status: 400 });
    data.tableId = body.tableId;
  }
  if (body.customerName !== undefined) {
    const customerName = body.customerName.trim();
    if (!customerName) return NextResponse.json({ error: "Falta el nombre del cliente" }, { status: 400 });
    data.customerName = customerName;
  }
  if (body.reservedFor !== undefined) {
    const reservedFor = new Date(body.reservedFor);
    if (!Number.isFinite(reservedFor.getTime())) {
      return NextResponse.json({ error: "Fecha y hora inválidas" }, { status: 400 });
    }
    data.reservedFor = reservedFor;
  }
  if (body.partySize !== undefined) {
    const partySize = Number(body.partySize);
    if (!Number.isInteger(partySize) || partySize < 1) {
      return NextResponse.json({ error: "Cantidad de personas inválida" }, { status: 400 });
    }
    data.partySize = partySize;
  }
  if (body.phone !== undefined) data.phone = body.phone.trim() || null;
  if (body.notes !== undefined) data.notes = body.notes.trim() || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  try {
    const reservation = await prisma.reservation.update({
      where: { id },
      data,
      include: { table: true },
    });
    return NextResponse.json(serializeReservation(reservation));
  } catch {
    return NextResponse.json({ error: "La reserva no existe" }, { status: 404 });
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;

  try {
    await prisma.reservation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "La reserva no existe" }, { status: 404 });
  }
}
