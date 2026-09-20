"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Receipt, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import WeekChart from "@/components/WeekChart";
import { formatCurrency } from "@/lib/format";

const PAYMENT_METHODS = [
  { id: "EFECTIVO", label: "Efectivo" },
  { id: "TARJETA", label: "Tarjeta" },
  { id: "TRANSFERENCIA", label: "Transferencia" },
  { id: "MERCADO_PAGO", label: "Mercado Pago" },
];
const PAYMENT_METHOD_LABELS = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.id, m.label]));

function origin(sale) {
  if (!sale.order) return "—";
  if (sale.order.type === "MOSTRADOR") return "Mostrador";
  return sale.order.table ? `Mesa ${sale.order.table.number}` : "Salón";
}

export default function VentasPage() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    fetch("/api/panel-summary")
      .then((res) => res.json())
      .then(setSummary);
  }, []);

  function loadSales() {
    const params = new URLSearchParams();
    if (paymentMethod) params.set("paymentMethod", paymentMethod);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/sales?${params.toString()}`)
      .then((res) => res.json())
      .then(setSales);
  }

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, from, to]);

  const avgTicket = summary && summary.todaySalesCount > 0 ? summary.todaySalesTotal / summary.todaySalesCount : 0;

  const filteredTotal = useMemo(() => (sales || []).reduce((sum, s) => sum + s.total, 0), [sales]);

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Ventas</h1>
      <p className="mt-1 text-sm text-slate-500">Reportes de ventas por día, método de pago y origen.</p>

      {!summary ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            icon={<BadgeDollarSign size={18} />}
            color="bg-orange-50 text-orange-600"
            label="Ventas de hoy"
            value={formatCurrency(summary.todaySalesTotal)}
            hint={`${summary.todaySalesCount} venta${summary.todaySalesCount === 1 ? "" : "s"}`}
          />
          <KpiCard
            icon={<TrendingUp size={18} />}
            color="bg-sky-50 text-sky-600"
            label="Ticket promedio de hoy"
            value={formatCurrency(avgTicket)}
          />
          <KpiCard
            icon={<Receipt size={18} />}
            color="bg-rose-50 text-rose-600"
            label="Gastos de hoy"
            value={formatCurrency(summary.todayExpensesTotal)}
          />
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Últimos 7 días</h2>
        {!summary ? (
          <Skeleton className="mt-4 h-40 w-full" />
        ) : (
          <div className="mt-4">
            <WeekChart days={summary.last7Days} />
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Todos los medios de pago</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {!sales ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <BadgeDollarSign size={26} className="text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No hay ventas que coincidan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Medio de pago</th>
                  <th className="px-4 py-3 font-medium">Cajero/a</th>
                  <th className="px-4 py-3 font-medium">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(s.createdAt).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{origin(s)}</td>
                    <td className="px-4 py-3 text-slate-500">{PAYMENT_METHOD_LABELS[s.paymentMethod]}</td>
                    <td className="px-4 py-3 text-slate-500">{s.cashierName || "—"}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(s.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td colSpan={4} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Total
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(filteredTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, color, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>{icon}</span>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
