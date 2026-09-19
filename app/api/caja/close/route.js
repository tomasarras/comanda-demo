import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeRunningTotal, serializeShift } from "@/lib/caja";

export async function POST(request) {
  const body = await request.json();
  const closingAmount = Number(body.closingAmount);
  const closedBy = (body.closedBy || "").trim();

  if (!Number.isFinite(closingAmount) || closingAmount < 0) {
    return NextResponse.json({ error: "Monto contado inválido" }, { status: 400 });
  }
  if (!closedBy) {
    return NextResponse.json({ error: "Falta indicar quién cierra el turno" }, { status: 400 });
  }

  const shift = await prisma.cashRegisterShift.findFirst({
    where: { closedAt: null },
    include: { movements: true },
  });
  if (!shift) {
    return NextResponse.json({ error: "No hay un turno de caja abierto" }, { status: 409 });
  }

  const expectedAmount = computeRunningTotal(shift.openingAmount, shift.movements);
  const difference = closingAmount - expectedAmount;

  const closed = await prisma.cashRegisterShift.update({
    where: { id: shift.id },
    data: {
      closingAmount,
      expectedAmount,
      difference,
      closedBy,
      closedAt: new Date(),
    },
    include: { movements: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json(serializeShift(closed));
}
