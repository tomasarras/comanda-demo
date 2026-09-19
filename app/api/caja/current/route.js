import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeShift } from "@/lib/caja";

export async function GET() {
  const shift = await prisma.cashRegisterShift.findFirst({
    where: { closedAt: null },
    include: { movements: { orderBy: { createdAt: "asc" } } },
    orderBy: { openedAt: "desc" },
  });

  return NextResponse.json(shift ? serializeShift(shift) : null);
}
