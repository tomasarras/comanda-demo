import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeReservation } from "@/lib/reservations";

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    orderBy: { reservedFor: "asc" },
    include: { table: true },
  });
  return NextResponse.json(reservations.map(serializeReservation));
}

export async function POST(request) {
  const body = await request.json();

  const tableId = body.tableId;
  const customerName = (body.customerName || "").trim();
  const phone = (body.phone || "").trim();
  const notes = (body.notes || "").trim();
  const partySize = Number(body.partySize) || 2;
  const reservedFor = new Date(body.reservedFor);

  if (!tableId) {
    return NextResponse.json({ error: "Falta seleccionar una mesa" }, { status: 400 });
  }
  if (!customerName) {
    return NextResponse.json({ error: "Falta el nombre del cliente" }, { status: 400 });
  }
  if (!Number.isFinite(reservedFor.getTime())) {
    return NextResponse.json({ error: "Fecha y hora inválidas" }, { status: 400 });
  }
  if (!Number.isInteger(partySize) || partySize < 1) {
    return NextResponse.json({ error: "Cantidad de personas inválida" }, { status: 400 });
  }

  const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
  if (!table) {
    return NextResponse.json({ error: "La mesa no existe" }, { status: 400 });
  }

  const reservation = await prisma.reservation.create({
    data: { tableId, customerName, phone: phone || null, partySize, reservedFor, notes: notes || null },
    include: { table: true },
  });

  return NextResponse.json(serializeReservation(reservation), { status: 201 });
}
