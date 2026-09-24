// Shared helpers for reservas de mesa — usadas por app/api/reservations/* y
// por la vista de solo lectura en app/(dashboard)/mesas.

export const UPCOMING_WINDOW_MINUTES = 90;
export const SOON_WINDOW_HOURS = 3;

export function serializeReservation(r) {
  return {
    ...r,
    reservedFor: r.reservedFor.toISOString?.() ?? r.reservedFor,
    table: r.table ? { id: r.table.id, number: r.table.number } : r.table,
  };
}

// Usado en la sección Reservas: agrupa por "pasada" / "próxima" (dentro de
// las próximas 3hs) / "más adelante" (a más de 3hs) — distinto del umbral de
// 90min que usa el mapa de Mesas para pintar una mesa de amarillo.
export function reservationBucket(reservedFor, now = new Date()) {
  const hoursAway = (new Date(reservedFor).getTime() - now.getTime()) / 3600000;
  if (hoursAway < 0) return "past";
  if (hoursAway <= SOON_WINDOW_HOURS) return "soon";
  return "later";
}

// Una mesa se marca "reserva próxima" solo cuando falta poco (no apenas
// tiene una reserva a futuro lejano) — así la vista no queda toda amarilla.
export function isUpcomingSoon(reservedFor, now = new Date()) {
  const minutesAway = (new Date(reservedFor).getTime() - now.getTime()) / 60000;
  return minutesAway >= 0 && minutesAway <= UPCOMING_WINDOW_MINUTES;
}

// Prioridad: ocupada (tiene una orden activa) > reserva próxima > disponible.
export function tableStatus(table, reservations, now = new Date()) {
  if (table.activeOrder) return "occupied";
  if (reservations.some((r) => isUpcomingSoon(r.reservedFor, now))) return "reserved";
  return "available";
}
