"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import ReservationForm from "@/components/ReservationForm";
import { formatDateTime } from "@/lib/format";

export default function ReservationsModal({ table, reservations, canManage, onClose, onCreate, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreate(payload) {
    await onCreate(payload);
  }

  async function handleUpdate(payload) {
    await onUpdate(editing.id, payload);
    setEditing(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Reservas · Mesa {table.number}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {reservations.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No hay reservas para esta mesa.</p>
          ) : (
            reservations.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{r.customerName}</p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(r.reservedFor)} · {r.partySize} personas
                    {r.phone ? ` · ${r.phone}` : ""}
                  </p>
                  {r.notes && <p className="mt-0.5 text-xs text-slate-400">{r.notes}</p>}
                </div>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setEditing(r)}
                      className="rounded-lg p-1 text-slate-300 hover:bg-slate-200 hover:text-slate-600"
                      title="Editar reserva"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      className="rounded-lg p-1 text-slate-300 hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50"
                      title="Eliminar reserva"
                    >
                      {deletingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {canManage && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold text-slate-500">
              {editing ? "Editar reserva" : "Nueva reserva"}
            </p>
            <ReservationForm
              key={editing?.id || "new"}
              fixedTableId={table.id}
              initial={editing}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={editing ? () => setEditing(null) : undefined}
              submitLabel={editing ? "Guardar cambios" : "Agregar reserva"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
