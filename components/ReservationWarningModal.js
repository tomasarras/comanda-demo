"use client";

import { useState } from "react";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { formatDateTime } from "@/lib/format";

// Se muestra al elegir una mesa con una reserva próxima (≤ 1:30hs) en Nueva
// orden: deja seguir igual, o borrar la reserva si el cliente que llegó es
// justo esa persona.
export default function ReservationWarningModal({ table, reservations, onClose, onProceedAnyway, onDeleteReservation }) {
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  async function handleDelete(id) {
    setDeletingId(id);
    setError("");
    try {
      await onDeleteReservation(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <TriangleAlert size={18} />
            </span>
            <h2 className="text-base font-bold text-slate-900">Mesa {table.number} tiene una reserva próxima</h2>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {reservations.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 p-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{r.customerName}</p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(r.reservedFor)} · {r.partySize} personas
                  {r.phone ? ` · ${r.phone}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                disabled={deletingId === r.id}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                {deletingId === r.id && <Loader2 size={13} className="animate-spin" />}
                Llegó, borrar reserva
              </button>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Si es otra persona, podés usar la mesa igual — la reserva se mantiene para cuando llegue.
        </p>

        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Elegir otra mesa
          </button>
          <button
            type="button"
            onClick={onProceedAnyway}
            className="flex-1 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Usar mesa igual
          </button>
        </div>
      </div>
    </div>
  );
}
