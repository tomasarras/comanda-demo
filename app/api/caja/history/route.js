import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeShift } from "@/lib/caja";

export async function GET() {
  const shifts = await prisma.cashRegisterShift.findMany({
    where: { closedAt: { not: null } },
    include: { movements: true },
    orderBy: { closedAt: "desc" },
    take: 10,
  });

  return NextResponse.json(shifts.map(serializeShift));
}
