"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import DatePicker from "@/components/DatePicker";

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateOnly(reservedFor) {
  if (!reservedFor) return null;
  const d = new Date(reservedFor);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function timeOnly(reservedFor) {
  if (!reservedFor) return "";
  const d = new Date(reservedFor);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function combineDateTime(date, time) {
  if (!date || !time) return null;
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const inputClass =
  "rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

export default function ReservationForm({ tables, fixedTableId, initial, onSubmit, onCancel, submitLabel }) {
  const [tableId, setTableId] = useState(initial?.tableId || fixedTableId || "");
  const [customerName, setCustomerName] = useState(initial?.customerName || "");
  const [date, setDate] = useState(dateOnly(initial?.reservedFor));
  const [time, setTime] = useState(timeOnly(initial?.reservedFor));
  const [partySize, setPartySize] = useState(initial?.partySize ?? 2);
  const [phone, setPhone] = useState(initial?.phone || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const reservedFor = combineDateTime(date, time);
    if (!reservedFor) {
      setError("Elegí una fecha y una hora");
      return;
    }
    if (!tableId) {
      setError("Falta seleccionar una mesa");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        tableId,
        customerName,
        phone,
        partySize: Number(partySize),
        reservedFor: reservedFor.toISOString(),
        notes,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {tables && (
        <select
          value={tableId}
          onChange={(e) => setTableId(e.target.value)}
          required
          className={`w-full bg-white ${inputClass}`}
        >
          <option value="">Elegir mesa…</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              Mesa {t.number} · {t.capacity} personas
            </option>
          ))}
        </select>
      )}

      <input
        type="text"
        required
        placeholder="Nombre del cliente"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        className={`w-full ${inputClass}`}
      />

      <div className="grid grid-cols-2 gap-2">
        <DatePicker value={date} onChange={setDate} />
        <input
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min={1}
          required
          placeholder="Personas"
          value={partySize}
          onChange={(e) => setPartySize(e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Teléfono (opcional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      <input
        type="text"
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className={`w-full ${inputClass}`}
      />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {submitLabel || "Agregar reserva"}
        </button>
      </div>
    </form>
  );
}
