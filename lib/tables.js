// Shared helpers for RestaurantTable — used by app/api/tables/*.

// Una orden ENTREGADA se queda en la mesa esperando el cobro combinado (ver
// checkoutTable) — no bloquea pedir otra ronda (ej. postre después del plato
// principal). Solo las que todavía están en curso de cocina sí lo hacen.
const OPEN_STATUSES = ["ABIERTA", "EN_COCINA", "LISTA"];

export function serializeTable(table) {
  const orders = table.orders || [];
  return {
    id: table.id,
    number: table.number,
    capacity: table.capacity,
    posX: table.posX,
    posY: table.posY,
    activeOrder: orders[0] || table.activeOrder || null,
    hasOpenOrder: orders.some((o) => OPEN_STATUSES.includes(o.status)),
  };
}

export function nextTableNumber(tables) {
  return Math.max(0, ...tables.map((t) => t.number)) + 1;
}

// Grilla simple para que las mesas nuevas no se apilen todas en el mismo
// punto — el admin las termina acomodando arrastrándolas de todos modos.
export function defaultPositionFor(count) {
  return {
    posX: 20 + (count % 5) * 15,
    posY: 20 + Math.floor(count / 5) * 25,
  };
}
