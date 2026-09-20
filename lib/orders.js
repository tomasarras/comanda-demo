// Órdenes de salón avanzan por estos pasos con botones simples (no drag & drop).
// ENTREGADA no tiene "siguiente": desde ahí se cobra (checkoutOrder), no se avanza.
export const ORDER_FLOW = ["ABIERTA", "EN_COCINA", "LISTA", "ENTREGADA"];

export const STATUS_LABELS = {
  ABIERTA: "Abierta",
  EN_COCINA: "En cocina",
  LISTA: "Lista",
  ENTREGADA: "Entregada",
  PAGADA: "Pagada",
  CANCELADA: "Cancelada",
};

export const ADVANCE_LABELS = {
  ABIERTA: "Enviar a cocina",
  EN_COCINA: "Marcar lista",
  LISTA: "Marcar entregada",
};

export function nextStatus(status) {
  const idx = ORDER_FLOW.indexOf(status);
  if (idx === -1 || idx === ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[idx + 1];
}

export function serializeOrder(order) {
  return {
    ...order,
    total: Number(order.total),
    items: (order.items || []).map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      product: item.product
        ? { ...item.product, price: Number(item.product.price), cost: Number(item.product.cost) }
        : undefined,
    })),
  };
}
