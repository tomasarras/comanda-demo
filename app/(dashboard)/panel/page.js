"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BadgeDollarSign, Package, Receipt } from "lucide-react";
import WeekChart from "@/components/WeekChart";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/format";
import { useRole } from "@/components/RoleProvider";

export default function PanelPage() {
  const { role } = useRole();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/panel-summary")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSummary(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Panel</h1>
      <p className="mt-1 text-sm text-slate-500">
        {role ? `Bienvenido/a, ${role.label.toLowerCase()}.` : "Bienvenido/a."} Resumen general del restaurante.
      </p>

      {!summary ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<BadgeDollarSign size={18} />}
            color="bg-orange-50 text-orange-600"
            label="Ventas de hoy"
            value={formatCurrency(summary.todaySalesTotal)}
            hint={`${summary.todaySalesCount} venta${summary.todaySalesCount === 1 ? "" : "s"}`}
          />
          <KpiCard
            icon={<Receipt size={18} />}
            color="bg-rose-50 text-rose-600"
            label="Gastos de hoy"
            value={formatCurrency(summary.todayExpensesTotal)}
          />
          <KpiCard
            icon={<Package size={18} />}
            color="bg-sky-50 text-sky-600"
            label="Productos activos"
            value={summary.activeProducts}
          />
          <KpiCard
            icon={<AlertTriangle size={18} />}
            color="bg-amber-50 text-amber-600"
            label="Stock bajo (menos de 10)"
            value={summary.lowStockCount}
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
