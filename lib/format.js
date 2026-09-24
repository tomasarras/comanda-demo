export function formatCurrency(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// Formato fijo día/mes/año — los inputs nativos de fecha muestran mm/dd/yyyy
// según el idioma del navegador, no de la página, así que no alcanza con
// toLocaleString("es-AR") en los inputs (sí sirve para texto de solo lectura).
export function formatDateTime(dateLike) {
  const d = new Date(dateLike);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}
