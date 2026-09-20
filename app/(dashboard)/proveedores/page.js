"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, Truck } from "lucide-react";
import SupplierModal from "@/components/SupplierModal";
import { Skeleton } from "@/components/Skeleton";

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState(null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  function loadSuppliers() {
    fetch("/api/suppliers")
      .then((res) => res.json())
      .then(setSuppliers);
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filtered = useMemo(() => {
    if (!suppliers) return [];
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => s.name.toLowerCase().includes(q));
  }, [suppliers, query]);

  function handleSaved(saved) {
    setSuppliers((prev) => {
      if (!prev) return [saved];
      const exists = prev.some((s) => s.id === saved.id);
      return exists ? prev.map((s) => (s.id === saved.id ? saved : s)) : [...prev, saved];
    });
    setModalOpen(false);
    setEditing(null);
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar el proveedor");
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Proveedores</h1>
          <p className="mt-1 text-sm text-slate-500">Contactos y datos de los proveedores del restaurante.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          <Plus size={16} />
          Nuevo proveedor
        </button>
      </div>

      <div className="relative mt-4 max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar proveedor…"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {!suppliers ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Truck size={26} className="text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No hay proveedores que coincidan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500">{s.contact || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{s.email || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(s);
                            setModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === s.id}
                          onClick={() => handleDelete(s.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <SupplierModal
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
          supplier={editing}
        />
      )}
    </div>
  );
}
