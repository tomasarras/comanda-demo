import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function serialize(sale) {
  return {
    ...sale,
    total: Number(sale.total),
    order: sale.order ? { type: sale.order.type, table: sale.order.table } : null,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const paymentMethod = searchParams.get("paymentMethod");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {};
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59`);
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { order: { include: { table: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(sales.map(serialize));
}
