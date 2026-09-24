import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidRoleId, serializeEmployee } from "@/lib/employees";

export async function GET() {
  const employees = await prisma.employee.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(employees.map(serializeEmployee));
}

export async function POST(request) {
  const body = await request.json();

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const role = body.role;

  if (!name) {
    return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
  }
  if (!isValidRoleId(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  try {
    const employee = await prisma.employee.create({
      data: { name, email: email || null, role },
    });
    return NextResponse.json(serializeEmployee(employee), { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una persona con ese email" }, { status: 409 });
    }
    throw err;
  }
}
