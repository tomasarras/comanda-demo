import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  const data = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.contact !== undefined) data.contact = body.contact || null;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.notes !== undefined) data.notes = body.notes || null;

  try {
    const supplier = await prisma.supplier.update({ where: { id }, data });
    return NextResponse.json(supplier);
  } catch {
    return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  try {
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar: verificá que no tenga gastos asociados" },
      { status: 409 },
    );
  }
}
