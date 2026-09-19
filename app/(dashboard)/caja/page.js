"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Lock,
  Plus,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import CashMovementModal from "@/components/CashMovementModal";
import CloseShiftModal from "@/components/CloseShiftModal";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/format";
import { useRole } from "@/components/RoleProvider";

const MOVEMENT_META = {
  INGRESO: { icon: ArrowDownCircle, color: "text-emerald-600", label: "Ingreso" },
  EGRESO: { icon: ArrowUpCircle, color: "text-rose-600", label: "Egreso" },
  VENTA: { icon: ShoppingBag, color: "text-orange-600", label: "Venta" },
};

export default function CajaPage() {
  const { role } = useRole();
  const [shift, setShift] = useState(undefined);
  const [history, setHistory] = useState(null);
  const [openingAmount, setOpeningAmount] = useState("");
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState("");
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);

  function loadCurrent() {
    fetch("/api/caja/current")
      .then((res) => res.json())
      .then(setShift);
  }

  function loadHistory() {
    fetch("/api/caja/history")
      .then((res) => res.json())
      .then(setHistory);
  }

  useEffect(() => {
    loadCurrent();
    loadHistory();
  }, []);

  async function handleOpenShift(e) {
    e.preventDefault();
    setOpening(true);
    setOpenError("");
    try {
      const res = await fetch("/api/caja/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingAmount: Number(openingAmount), openedBy: role?.label || "Equipo" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo abrir el turno");
      setShift(data);
      setOpeningAmount("");
    } catch (err) {
      setOpenError(err.message);
    } finally {
      setOpening(false);
    }
  }

  function handleMovementSaved(updatedShift) {
    setShift(updatedShift);
    setMovementModalOpen(false);
  }

  function handleShiftClosed(closedShift) {
    setShift(null);
    setCloseModalOpen(false);
    setHistory((prev) => [closedShift, ...(prev || [])].slice(0, 10));
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Caja</h1>
      <p className="mt-1 text-sm text-slate-500">Apertura y cierre de turno, movimientos de efectivo.</p>

      <div className="mt-6">
        {shift === undefined ? (
          <Skeleton className="h-56 w-full rounded-2xl" />
        ) : shift === null ? (
          <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Lock size={18} />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">No hay un turno de caja abierto</p>
            <p className="mt-1 text-xs text-slate-500">Ingresá el monto inicial para abrir la caja.</p>
            <form onSubmit={handleOpenShift} className="mt-4 space-y-3">
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="Monto inicial"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              {openError && <p className="text-sm text-rose-600">{openError}</p>}
              <button
                type="submit"
                disabled={opening}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {opening && <Loader2 size={15} className="animate-spin" />}
                Abrir turno
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-1">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Wallet size={18} />
              </span>
              <p className="mt-3 text-2xl font-bold text-slate-900">{formatCurrency(shift.runningTotal)}</p>
              <p className="text-xs text-slate-500">Total en caja</p>
              <p className="mt-3 text-xs text-slate-400">
                Abierto por {shift.openedBy} · {new Date(shift.openedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-xs text-slate-400">Monto inicial: {formatCurrency(shift.openingAmount)}</p>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setMovementModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Plus size={15} />
                  Nuevo movimiento
                </button>
                <button
                  type="button"
                  onClick={() => setCloseModalOpen(true)}
                  className="rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  Cerrar turno
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-slate-900">Movimientos del turno</h2>
              {shift.movements.length === 0 ? (
                <p className="mt-6 text-center text-sm text-slate-400">Todavía no hay movimientos.</p>
              ) : (
                <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
                  {[...shift.movements].reverse().map((m) => {
                    const meta = MOVEMENT_META[m.type];
                    const Icon = meta.icon;
                    return (
                      <div key={m.id} className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
                        <Icon size={18} className={meta.color} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-slate-700">{m.description || meta.label}</p>
                          <p className="text-[11px] text-slate-400">
                            {meta.label} ·{" "}
                            {new Date(m.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold ${m.type === "EGRESO" ? "text-rose-600" : "text-slate-800"}`}>
                          {m.type === "EGRESO" ? "-" : "+"}
                          {formatCurrency(m.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-900">Turnos anteriores</h2>
        {!history ? (
          <Skeleton className="mt-3 h-24 w-full rounded-xl" />
        ) : history.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Todavía no se cerró ningún turno.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Cerrado</th>
                    <th className="px-4 py-2.5 font-medium">Abierto por</th>
                    <th className="px-4 py-2.5 font-medium">Cerrado por</th>
                    <th className="px-4 py-2.5 font-medium">Inicial</th>
                    <th className="px-4 py-2.5 font-medium">Contado</th>
                    <th className="px-4 py-2.5 font-medium">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2.5 text-slate-600">
                        {new Date(s.closedAt).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{s.openedBy}</td>
                      <td className="px-4 py-2.5 text-slate-600">{s.closedBy}</td>
                      <td className="px-4 py-2.5 text-slate-600">{formatCurrency(s.openingAmount)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{formatCurrency(s.closingAmount)}</td>
                      <td
                        className={`px-4 py-2.5 font-medium ${
                          s.difference === 0 ? "text-emerald-600" : s.difference > 0 ? "text-sky-600" : "text-rose-600"
                        }`}
                      >
                        {s.difference > 0 ? "+" : ""}
                        {formatCurrency(s.difference)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {movementModalOpen && (
        <CashMovementModal onClose={() => setMovementModalOpen(false)} onSaved={handleMovementSaved} />
      )}
      {closeModalOpen && shift && (
        <CloseShiftModal
          shift={shift}
          closedBy={role?.label || "Equipo"}
          onClose={() => setCloseModalOpen(false)}
          onClosed={handleShiftClosed}
        />
      )}
    </div>
  );
}
