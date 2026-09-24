"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const inputClass =
  "rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

export default function EnviosConfigTab() {
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setDeliveryFee(String(data.deliveryFee));
        setSaved(data.deliveryFee);
      });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryFee: Number(deliveryFee) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setSaved(data.deliveryFee);
      setDeliveryFee(String(data.deliveryFee));
      setMessage("Guardado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (deliveryFee === null) {
    return <p className="text-sm text-slate-400">Cargando…</p>;
  }

  return (
    <div>
      <p className="text-sm text-slate-500">
        Costo fijo de envío que se suma automáticamente al total de cada orden nueva &quot;con envío&quot;.
      </p>

      <form
        onSubmit={handleSave}
        className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Costo de envío</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={saving || Number(deliveryFee) === saved}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar
        </button>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Truck size={13} />
          Actual: {formatCurrency(saved)}
        </span>
      </form>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
    </div>
  );
}
