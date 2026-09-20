import { NextResponse } from "next/server";
import { completeSale, SaleError } from "@/lib/sales";

const PAYMENT_METHODS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "MERCADO_PAGO"];

function serializeOrder(order) {
  return {
    ...order,
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      product: {
        ...item.product,
        price: Number(item.product.price),
        cost: Number(item.product.cost),
      },
    })),
  };
}

function serializeSale(sale) {
  return { ...sale, total: Number(sale.total) };
}

export async function POST(request) {
  const body = await request.json();

  if (!PAYMENT_METHODS.includes(body.paymentMethod)) {
    return NextResponse.json({ error: "Medio de pago inválido" }, { status: 400 });
  }

  try {
    const { order, sale } = await completeSale({
      items: body.items,
      paymentMethod: body.paymentMethod,
      cashierName: (body.cashierName || "").trim() || "Equipo",
      orderType: body.orderType || "MOSTRADOR",
      tableId: body.tableId || null,
    });
    return NextResponse.json({ order: serializeOrder(order), sale: serializeSale(sale) }, { status: 201 });
  } catch (err) {
    if (err instanceof SaleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
