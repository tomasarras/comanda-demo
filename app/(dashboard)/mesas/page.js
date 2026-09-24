"use client";

import { useEffect, useMemo, useState } from "react";
import FloorPlan from "@/components/FloorPlan";
import ReservationsModal from "@/components/ReservationsModal";
import { Skeleton } from "@/components/Skeleton";
import { tableStatus } from "@/lib/reservations";
import { canManageReservations } from "@/lib/roles";
import { useRole } from "@/components/RoleProvider";

const LEGEND = [
  { status: "available", label: "Disponible", swatch: "bg-emerald-400" },
  { status: "occupied", label: "Ocupada", swatch: "bg-rose-400" },
  { status: "reserved", label: "Reserva próxima (≤ 1:30hs)", swatch: "bg-amber-400" },
];

// Refresca cada minuto: el estado "reserva próxima" depende del reloj, no
// solo de acciones del usuario, así que sin esto quedaría desactualizado.
const REFRESH_MS = 60000;

export default function MesasPage() {
  const { role } = useRole();
  const canManage = canManageReservations(role);

  const [tables, setTables] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [now, setNow] = useState(() => new Date());
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

  const tablesWithStatus = useMemo(() => {
    if (!tables) return [];
    return tables.map((t) => ({
      ...t,
      status: tableStatus(
        t,
        reservations.filter((r) => r.tableId === t.id),
        now,
      ),
    }));
  }, [tables, reservations, now]);

  const selectedTable = tablesWithStatus.find((t) => t.id === selectedTableId) || null;
  const selectedReservations = reservations
    .filter((r) => r.tableId === selectedTableId)
    .sort((a, b) => new Date(a.reservedFor) - new Date(b.reservedFor));

  async function handleCreateReservation(payload) {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo crear la reserva");
    setReservations((prev) => [...prev, data]);
  }

  async function handleUpdateReservation(id, payload) {
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo actualizar la reserva");
    setReservations((prev) => prev.map((r) => (r.id === id ? data : r)));
  }

  async function handleDeleteReservation(id) {
    setError("");
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar la reserva");
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Mesas</h1>
      <p className="mt-1 text-sm text-slate-500">
        Estado del salón en vivo. Click en una mesa para ver sus reservas.
      </p>

      <div className="mt-4 flex flex-wrap gap-4">
        {LEGEND.map((l) => (
          <span key={l.status} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span className={`h-2.5 w-2.5 rounded-full ${l.swatch}`} />
            {l.label}
          </span>
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <div className="mt-6">
        {!tables ? (
          <Skeleton className="aspect-video w-full rounded-2xl" />
        ) : (
          <FloorPlan tables={tablesWithStatus} mode="view" onSelect={setSelectedTableId} />
        )}
      </div>

      {selectedTable && (
        <ReservationsModal
          table={selectedTable}
          reservations={selectedReservations}
          canManage={canManage}
          onClose={() => setSelectedTableId(null)}
          onCreate={handleCreateReservation}
          onUpdate={handleUpdateReservation}
          onDelete={handleDeleteReservation}
        />
      )}
    </div>
  );
}
