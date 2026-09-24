"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import FloorPlan from "@/components/FloorPlan";
import { Skeleton } from "@/components/Skeleton";

export default function MesasConfigTab() {
  const [tables, setTables] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  function loadTables() {
    fetch("/api/tables")
      .then((res) => res.json())
      .then(setTables);
  }

  useEffect(() => {
    loadTables();
  }, []);

  async function handleAdd() {
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/tables", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo agregar la mesa");
      setTables((prev) => [...(prev || []), data]);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleMove(tableId, posX, posY) {
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, posX, posY } : t)));
    try {
      const res = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posX, posY }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError("No se pudo guardar la posición de la mesa");
      loadTables();
    }
  }

  async function handleCapacityChange(table, capacity) {
    if (capacity === table.capacity) return;
    setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, capacity } : t)));
    try {
      const res = await fetch(`/api/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError("No se pudo actualizar la capacidad de la mesa");
      loadTables();
    }
  }

  async function handleNumberChange(table, number) {
    const previous = table.number;
    setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, number } : t)));
    try {
      const res = await fetch(`/api/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo cambiar el número de mesa");
    } catch (err) {
      setError(err.message);
      setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, number: previous } : t)));
    }
  }

  async function handleDelete(table) {
    setError("");
    try {
      const res = await fetch(`/api/tables/${table.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar la mesa");
      setTables((prev) => prev.filter((t) => t.id !== table.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Armá el layout del salón: agregá mesas y arrastralas a su lugar.</p>
        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Agregar mesa
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <div className="mt-4">
        {!tables ? (
          <Skeleton className="aspect-video w-full rounded-2xl" />
        ) : (
          <FloorPlan
            tables={tables}
            mode="edit"
            onMove={handleMove}
            onDelete={handleDelete}
            onCapacityChange={handleCapacityChange}
            onNumberChange={handleNumberChange}
          />
        )}
      </div>
    </div>
  );
}
