import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request, { params }) {
  const { id } = await params;
  try {
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
  }
}
