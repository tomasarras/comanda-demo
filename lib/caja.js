// Shared helpers for the Caja (cash register) feature — used by the API
// routes under app/api/caja/*.

export function serializeMovement(m) {
  return { ...m, amount: Number(m.amount) };
}

export function serializeShift(shift) {
  const movements = (shift.movements || []).map(serializeMovement);
  return {
    ...shift,
    openingAmount: Number(shift.openingAmount),
    closingAmount: shift.closingAmount === null ? null : Number(shift.closingAmount),
    expectedAmount: shift.expectedAmount === null ? null : Number(shift.expectedAmount),
    difference: shift.difference === null ? null : Number(shift.difference),
    movements,
    runningTotal: computeRunningTotal(shift.openingAmount, movements),
  };
}

// opening amount + ingresos + ventas - egresos
export function computeRunningTotal(openingAmount, movements) {
  const opening = Number(openingAmount);
  return movements.reduce((total, m) => {
    const amount = Number(m.amount);
    return m.type === "EGRESO" ? total - amount : total + amount;
  }, opening);
}
