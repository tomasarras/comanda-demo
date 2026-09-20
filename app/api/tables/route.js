import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const serialized = tables.map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    activeOrder: t.orders[0] || null,
  }));

  return NextResponse.json(serialized);
}
