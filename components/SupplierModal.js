"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

const emptyForm = { name: "", contact: "", phone: "", email: "", notes: "" };

function initialFormFor(supplier) {
  if (!supplier) return emptyForm;
  return {
    name: supplier.name,
    contact: supplier.contact || "",
    phone: supplier.phone || "",
    email: supplier.email || "",
    notes: supplier.notes || "",
  };
}

// Mounted only while the modal is open (see proveedores/page.js), so this
// initial state is fresh for every open — no effect needed to resync it.
export default function SupplierModal({ onClose, onSaved, supplier }) {
  const [form, setForm] = useState(() => initialFormFor(supplier));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      contact: form.contact.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
    };

    const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
    const method = supplier ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar el proveedor");
      onSaved(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {supplier ? "Editar proveedor" : "Nuevo proveedor"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Field label="Nombre">
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
          </Field>

          <Field label="Contacto (opcional)">
            <input value={form.contact} onChange={(e) => set("contact", e.target.value)} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono">
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
            </Field>
          </div>

          <Field label="Notas (opcional)">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </Field>

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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
