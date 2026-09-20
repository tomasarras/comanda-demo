"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const PAYMENT_METHODS = [
  { id: "EFECTIVO", label: "Efectivo" },
  { id: "TARJETA", label: "Tarjeta" },
  { id: "TRANSFERENCIA", label: "Transferencia" },
  { id: "MERCADO_PAGO", label: "Mercado Pago" },
];

export default function CheckoutOrderModal({ order, cashierName, onClose, onCheckedOut }) {
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod, cashierName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cobrar la orden");
      onCheckedOut(data.order);
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
          <h2 className="text-lg font-bold text-slate-900">Cobrar mesa {order.table?.number}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Total: <span className="font-semibold text-slate-700">{formatCurrency(order.total)}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`rounded-lg py-2 text-xs font-semibold ${
                  paymentMethod === m.id ? "bg-orange-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

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
              Cobrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
