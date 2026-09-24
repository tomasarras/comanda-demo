"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import ReservationForm from "@/components/ReservationForm";
import { Skeleton } from "@/components/Skeleton";
import { formatDateTime } from "@/lib/format";
import { reservationBucket } from "@/lib/reservations";
import { canManageReservations } from "@/lib/roles";
import { useRole } from "@/components/RoleProvider";

const REFRESH_MS = 60000;

const BUCKETS = [
  { id: "soon", label: "Próximas 3 horas" },
  { id: "later", label: "Más adelante" },
  { id: "past", label: "Pasadas" },
];

function ReservationRow({ reservation, canManage, onEdit, onDelete, deleting }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">
          Mesa {reservation.table?.number ?? "—"} · {reservation.customerName}
        </p>
        <p className="text-xs text-slate-500">
          {formatDateTime(reservation.reservedFor)} · {reservation.partySize} personas
          {reservation.phone ? ` · ${reservation.phone}` : ""}
        </p>
        {reservation.notes && <p className="mt-0.5 text-xs text-slate-400">{reservation.notes}</p>}
      </div>
      {canManage && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onEdit(reservation)}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
            title="Editar reserva"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(reservation.id)}
            disabled={deleting}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            title="Eliminar reserva"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReservasPage() {
  const { role } = useRole();
  const canManage = canManageReservations(role);

  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState(null);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [formTarget, setFormTarget] = useState(null); // null | "new" | reservation
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  function loadAll() {
    fetch("/api/tables")
      .then((res) => res.json())
      .then(setTables);
    fetch("/api/reservations")
      .then((res) => res.json())
      .then(setReservations);
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => {
      loadAll();
      setNow(new Date());
    }, REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    if (!reservations) return [];
    const term = search.trim().toLowerCase();
    if (!term) return reservations;
    return reservations.filter((r) => {
      const tableNumber = String(r.table?.number ?? "");
      return r.customerName.toLowerCase().includes(term) || tableNumber === term;
    });
  }, [reservations, search]);

  const grouped = useMemo(() => {
    const g = { soon: [], later: [], past: [] };
    filtered.forEach((r) => g[reservationBucket(r.reservedFor, now)].push(r));
    Object.values(g).forEach((list) => list.sort((a, b) => new Date(a.reservedFor) - new Date(b.reservedFor)));
    g.past.reverse();
    return g;
  }, [filtered, now]);

  async function handleCreate(payload) {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo crear la reserva");
    setReservations((prev) => [...(prev || []), data]);
    setFormTarget(null);
  }

  async function handleUpdate(payload) {
    const id = formTarget.id;
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo actualizar la reserva");
    setReservations((prev) => prev.map((r) => (r.id === id ? data : r)));
    setFormTarget(null);
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar la reserva");
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const isFormOpen = formTarget !== null;
  const isEditing = isFormOpen && formTarget !== "new";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reservas</h1>
          <p className="mt-1 text-sm text-slate-500">Todas las reservas del salón, agrupadas por cercanía.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setFormTarget("new")}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            <Plus size={16} />
            Nueva reserva
          </button>
        )}
      </div>

      <div className="relative mt-4 max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por cliente o número de mesa…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      {!reservations ? (
        <div className="mt-6 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-400">No hay reservas que coincidan.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {BUCKETS.map(
            (bucket) =>
              grouped[bucket.id].length > 0 && (
                <div key={bucket.id}>
                  <h2 className="mb-2 text-sm font-semibold text-slate-900">
                    {bucket.label}{" "}
                    <span className="font-normal text-slate-400">({grouped[bucket.id].length})</span>
                  </h2>
                  <div className="space-y-2">
                    {grouped[bucket.id].map((r) => (
                      <ReservationRow
                        key={r.id}
                        reservation={r}
                        canManage={canManage}
                        onEdit={setFormTarget}
                        onDelete={handleDelete}
                        deleting={deletingId === r.id}
                      />
                    ))}
                  </div>
                </div>
              ),
          )}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{isEditing ? "Editar reserva" : "Nueva reserva"}</h2>
              <button
                type="button"
                onClick={() => setFormTarget(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4">
              <ReservationForm
                key={isEditing ? formTarget.id : "new"}
                tables={tables}
                initial={isEditing ? formTarget : null}
                onSubmit={isEditing ? handleUpdate : handleCreate}
                onCancel={() => setFormTarget(null)}
                submitLabel={isEditing ? "Guardar cambios" : "Agregar reserva"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
