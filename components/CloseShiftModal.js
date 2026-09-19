"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

export default function CloseShiftModal({ shift, closedBy, onClose, onClosed }) {
  const [closingAmount, setClosingAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const counted = Number(closingAmount);
  const hasAmount = closingAmount !== "" && Number.isFinite(counted);
  const difference = hasAmount ? counted - shift.runningTotal : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/caja/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingAmount: counted, closedBy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cerrar el turno");
      onClosed(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Cerrar turno</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Total esperado en caja: <span className="font-semibold text-slate-700">{formatCurrency(shift.runningTotal)}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Monto contado</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={closingAmount}
              onChange={(e) => setClosingAmount(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </label>

          {hasAmount && (
            <p
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                difference === 0
                  ? "bg-emerald-50 text-emerald-700"
                  : difference > 0
                    ? "bg-sky-50 text-sky-700"
                    : "bg-rose-50 text-rose-700"
              }`}
            >
              {difference === 0
                ? "Coincide exacto"
                : difference > 0
                  ? `Sobran ${formatCurrency(difference)}`
                  : `Faltan ${formatCurrency(Math.abs(difference))}`}
            </p>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Cerrar turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
