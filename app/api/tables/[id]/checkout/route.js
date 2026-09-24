import { NextResponse } from "next/server";
import { checkoutTable, SaleError } from "@/lib/sales";
import { serializeOrder } from "@/lib/orders";

const PAYMENT_METHODS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "MERCADO_PAGO"];

function serializeSale(sale) {
  return { ...sale, total: Number(sale.total) };
}

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  if (!PAYMENT_METHODS.includes(body.paymentMethod)) {
    return NextResponse.json({ error: "Medio de pago inválido" }, { status: 400 });
  }

  try {
    const { orders, sale } = await checkoutTable(id, {
      paymentMethod: body.paymentMethod,
      cashierName: (body.cashierName || "").trim() || "Equipo",
    });
    return NextResponse.json({ orders: orders.map(serializeOrder), sale: serializeSale(sale) });
  } catch (err) {
    if (err instanceof SaleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
