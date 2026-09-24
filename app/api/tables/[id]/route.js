import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTable } from "@/lib/tables";

function isValidPercent(n) {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
}

function isValidCapacity(n) {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 20;
}

function isValidNumber(n) {
  return typeof n === "number" && Number.isInteger(n) && n >= 1;
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  const data = {};
  if (body.posX !== undefined) {
    if (!isValidPercent(body.posX)) {
      return NextResponse.json({ error: "posX inválido" }, { status: 400 });
    }
    data.posX = body.posX;
  }
  if (body.posY !== undefined) {
    if (!isValidPercent(body.posY)) {
      return NextResponse.json({ error: "posY inválido" }, { status: 400 });
    }
    data.posY = body.posY;
  }
  if (body.capacity !== undefined) {
    if (!isValidCapacity(body.capacity)) {
      return NextResponse.json({ error: "Capacidad inválida" }, { status: 400 });
    }
    data.capacity = body.capacity;
  }
  if (body.number !== undefined) {
    if (!isValidNumber(body.number)) {
      return NextResponse.json({ error: "Número de mesa inválido" }, { status: 400 });
    }
    data.number = body.number;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  try {
    const table = await prisma.restaurantTable.update({ where: { id }, data });
    return NextResponse.json(serializeTable(table));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una mesa con ese número" }, { status: 409 });
    }
    return NextResponse.json({ error: "La mesa no existe" }, { status: 404 });
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;

  const table = await prisma.restaurantTable.findUnique({
    where: { id },
    include: { orders: { where: { status: { notIn: ["PAGADA", "CANCELADA"] } }, select: { id: true } } },
  });
  if (!table) {
    return NextResponse.json({ error: "La mesa no existe" }, { status: 404 });
  }
  if (table.orders.length > 0) {
    return NextResponse.json({ error: "La mesa tiene una orden activa, no se puede eliminar" }, { status: 409 });
  }

  await prisma.restaurantTable.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
