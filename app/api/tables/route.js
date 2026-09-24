import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultPositionFor, nextTableNumber, serializeTable } from "@/lib/tables";

export async function GET() {
  const tables = await prisma.restaurantTable.findMany({
    orderBy: { number: "asc" },
    include: {
      orders: {
        where: { status: { notIn: ["PAGADA", "CANCELADA"] } },
        select: { id: true, status: true },
      },
    },
  });

  return NextResponse.json(tables.map(serializeTable));
}

export async function POST() {
  const tables = await prisma.restaurantTable.findMany({ select: { number: true } });
  const number = nextTableNumber(tables);
  const { posX, posY } = defaultPositionFor(tables.length);

  const table = await prisma.restaurantTable.create({
    data: { number, capacity: 2, posX, posY },
  });

  return NextResponse.json(serializeTable(table), { status: 201 });
}
