import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function serialize(product) {
  return {
    ...product,
    price: Number(product.price),
    cost: Number(product.cost),
  };
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  const data = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.description !== undefined) data.description = body.description || null;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.cost !== undefined) data.cost = Number(body.cost);
  if (body.stock !== undefined) data.stock = Number(body.stock);
  if (body.available !== undefined) data.available = Boolean(body.available);
  if (body.categoryId !== undefined) data.categoryId = body.categoryId || null;

  try {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
    return NextResponse.json(serialize(product));
  } catch {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
}
