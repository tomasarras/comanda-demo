import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidRoleId, serializeEmployee } from "@/lib/employees";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  const data = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
    data.name = name;
  }
  if (body.email !== undefined) {
    data.email = body.email.trim() || null;
  }
  if (body.role !== undefined) {
    if (!isValidRoleId(body.role)) return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    data.role = body.role;
  }
  if (body.active !== undefined) {
    data.active = Boolean(body.active);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  try {
    const employee = await prisma.employee.update({ where: { id }, data });
    return NextResponse.json(serializeEmployee(employee));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una persona con ese email" }, { status: 409 });
    }
    return NextResponse.json({ error: "La persona no existe" }, { status: 404 });
  }
}
