import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function serialize(product) {
  return {
    ...product,
    price: Number(product.price),
    cost: Number(product.cost),
  };
}

export async function GET() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products.map(serialize));
}

export async function POST(request) {
  const body = await request.json();
  const name = (body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  const price = Number(body.price);
  const cost = Number(body.cost);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: body.description || null,
      price,
      cost: Number.isFinite(cost) ? cost : 0,
      stock: Number.isFinite(Number(body.stock)) ? Number(body.stock) : 0,
      available: body.available !== false,
      imageUrl: body.imageUrl || null,
      categoryId: body.categoryId || null,
    },
    include: { category: true },
  });

  return NextResponse.json(serialize(product), { status: 201 });
}
