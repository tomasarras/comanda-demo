import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeShift } from "@/lib/caja";

export async function POST(request) {
  const body = await request.json();
  const type = body.type;
  const amount = Number(body.amount);
  const description = (body.description || "").trim() || null;

  if (type !== "INGRESO" && type !== "EGRESO") {
    return NextResponse.json({ error: "Tipo de movimiento inválido" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  const shift = await prisma.cashRegisterShift.findFirst({ where: { closedAt: null } });
  if (!shift) {
    return NextResponse.json({ error: "No hay un turno de caja abierto" }, { status: 409 });
  }

  await prisma.cashMovement.create({
    data: { shiftId: shift.id, type, amount, description },
  });

  const updated = await prisma.cashRegisterShift.findUnique({
    where: { id: shift.id },
    include: { movements: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json(serializeShift(updated), { status: 201 });
}
