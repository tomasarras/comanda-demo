// Cada tipo/modalidad de orden avanza por su propio circuito de columnas.
// El último paso de cada flujo es donde se admite el cobro (o el cierre
// directo si ya estaba prepaga) — no hay botón "avanzar" para ir más allá.
export const SALON_FLOW = ["ABIERTA", "EN_COCINA", "LISTA", "ENTREGADA"];
export const RETIRA_FLOW = ["ABIERTA", "EN_COCINA", "LISTA"];
export const ENVIO_FLOW = ["ABIERTA", "EN_COCINA", "LISTA", "ENVIANDO", "ENTREGADA"];

export const STATUS_LABELS = {
  ABIERTA: "Abierta",
  EN_COCINA: "En cocina",
  LISTA: "Lista",
  ENVIANDO: "Enviando",
  ENTREGADA: "Entregada",
  PAGADA: "Pagada",
  CANCELADA: "Cancelada",
};

export function getOrderFlow(order) {
  if (order.type === "DELIVERY") {
    return order.deliveryMode === "ENVIO" ? ENVIO_FLOW : RETIRA_FLOW;
  }
  return SALON_FLOW;
}

export function nextStatus(order) {
  const flow = getOrderFlow(order);
  const idx = flow.indexOf(order.status);
  if (idx === -1 || idx === flow.length - 1) return null;
  return flow[idx + 1];
}

// Último paso del flujo de esta orden: ahí se admite cobrar (o cerrar, si
// ya estaba prepaga) en lugar de avanzar a un próximo estado.
export function isCheckoutStatus(order) {
  const flow = getOrderFlow(order);
  return order.status === flow[flow.length - 1];
}

export function advanceLabel(order) {
  const next = nextStatus(order);
  if (!next) return null;
  const labels = {
    EN_COCINA: "Enviar a cocina",
    LISTA: "Marcar lista",
    ENVIANDO: "Marcar enviando",
    ENTREGADA: order.type === "DELIVERY" ? "Marcar entregado" : "Marcar entregada",
  };
  return labels[next];
}

export function serializeOrder(order) {
  return {
    ...order,
    total: Number(order.total),
    deliveryFee: Number(order.deliveryFee || 0),
    items: (order.items || []).map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      product: item.product
        ? { ...item.product, price: Number(item.product.price), cost: Number(item.product.cost) }
        : undefined,
    })),
  };
}
