import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function serialize(expense) {
  return { ...expense, amount: Number(expense.amount) };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const supplierId = searchParams.get("supplierId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {};
  if (category) where.category = category;
  if (supplierId) where.supplierId = supplierId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59`);
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(expenses.map(serialize));
}

export async function POST(request) {
  const body = await request.json();
  const description = (body.description || "").trim();
  const category = (body.category || "").trim();
  const amount = Number(body.amount);

  if (!description) {
    return NextResponse.json({ error: "La descripción es obligatoria" }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ error: "La categoría es obligatoria" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: { description, category, amount, supplierId: body.supplierId || null },
    include: { supplier: true },
  });

  return NextResponse.json(serialize(expense), { status: 201 });
}
