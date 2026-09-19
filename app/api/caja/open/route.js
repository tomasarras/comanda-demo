import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeShift } from "@/lib/caja";

export async function POST(request) {
  const body = await request.json();
  const openingAmount = Number(body.openingAmount);
  const openedBy = (body.openedBy || "").trim();

  if (!Number.isFinite(openingAmount) || openingAmount < 0) {
    return NextResponse.json({ error: "Monto inicial inválido" }, { status: 400 });
  }
  if (!openedBy) {
    return NextResponse.json({ error: "Falta indicar quién abre el turno" }, { status: 400 });
  }

  const existing = await prisma.cashRegisterShift.findFirst({ where: { closedAt: null } });
  if (existing) {
    return NextResponse.json({ error: "Ya hay un turno de caja abierto" }, { status: 409 });
  }

  const shift = await prisma.cashRegisterShift.create({
    data: { openingAmount, openedBy },
    include: { movements: true },
  });

  return NextResponse.json(serializeShift(shift), { status: 201 });
}
