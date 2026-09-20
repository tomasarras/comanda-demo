import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(suppliers);
}

export async function POST(request) {
  const body = await request.json();
  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const supplier = await prisma.supplier.create({
    data: {
      name,
      contact: body.contact || null,
      phone: body.phone || null,
      email: body.email || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(supplier, { status: 201 });
}
