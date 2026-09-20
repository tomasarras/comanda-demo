"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Users, X } from "lucide-react";
import CheckoutOrderModal from "@/components/CheckoutOrderModal";
import NewOrderPanel from "@/components/NewOrderPanel";
import { Skeleton } from "@/components/Skeleton";
import { ADVANCE_LABELS, ORDER_FLOW, STATUS_LABELS } from "@/lib/orders";
import { formatCurrency } from "@/lib/format";
import { useRole } from "@/components/RoleProvider";

function minutesAgo(date) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  return Math.floor(diff / 60000);
}

export default function OrdenesPage() {
  const { role } = useRole();
  const [orders, setOrders] = useState(null);
  const [tables, setTables] = useState([]);
  const [shift, setShift] = useState(undefined);
  const [view, setView] = useState("board");
  const [busyId, setBusyId] = useState(null);
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [error, setError] = useState("");

  function loadAll() {
    fetch("/api/orders")
      .then((res) => res.json())
      .then(setOrders);
    fetch("/api/tables")
      .then((res) => res.json())
      .then(setTables);
    fetch("/api/caja/current")
      .then((res) => res.json())
      .then(setShift);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const columns = useMemo(() => {
    const grouped = { ABIERTA: [], EN_COCINA: [], LISTA: [], ENTREGADA: [] };
    (orders || []).forEach((o) => {
      if (grouped[o.status]) grouped[o.status].push(o);
    });
    return grouped;
  }, [orders]);

  async function handleAdvance(order) {
    setBusyId(order.id);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo avanzar la orden");
      setOrders((prev) => prev.map((o) => (o.id === data.id ? data : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(order) {
    setBusyId(order.id);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cancelar la orden");
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setTables((prev) =>
        prev.map((t) => (t.id === order.tableId ? { ...t, activeOrder: null } : t)),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function handleOrderCreated(order) {
    setOrders((prev) => [...(prev || []), order]);
    setTables((prev) =>
      prev.map((t) => (t.id === order.tableId ? { ...t, activeOrder: { id: order.id, status: order.status } } : t)),
    );
    setView("board");
  }

  function handleCheckedOut(order) {
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    setTables((prev) => prev.map((t) => (t.id === order.tableId ? { ...t, activeOrder: null } : t)));
    setCheckoutTarget(null);
  }

  if (view === "new") {
    return (
      <div>
        <h1 className="text-xl font-bold text-slate-900">Órdenes</h1>
        <p className="mt-1 text-sm text-slate-500">Pedidos de salón por mesa, del pedido al cobro.</p>
        <div className="mt-6">
          <NewOrderPanel
            tables={tables}
            waiterName={role?.label || "Equipo"}
            onClose={() => setView("board")}
            onCreated={handleOrderCreated}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Órdenes</h1>
          <p className="mt-1 text-sm text-slate-500">Pedidos de salón por mesa, del pedido al cobro.</p>
        </div>
        <button
          type="button"
          onClick={() => setView("new")}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          <Plus size={16} />
          Nueva orden
        </button>
      </div>

      {shift === null && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          No hay una caja abierta — se pueden tomar pedidos, pero para cobrarlos hay que abrir un turno en Caja.
        </p>
      )}
      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {!orders ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)
        ) : (
          ORDER_FLOW.map((status) => (
            <div key={status} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">{STATUS_LABELS[status]}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {columns[status].length}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {columns[status].length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Sin órdenes.</p>
                ) : (
                  columns[status].map((order) => (
                    <div key={order.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                            <Users size={13} className="text-slate-400" />
                            Mesa {order.table?.number}
                          </p>
                          <p className="text-xs text-slate-400">
                            {order.waiterName || "Equipo"} · hace {minutesAgo(order.createdAt)} min
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCancel(order)}
                          disabled={busyId === order.id}
                          className="rounded-lg p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          title="Cancelar orden"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <ul className="mt-2 space-y-0.5">
                        {order.items.map((item) => (
                          <li key={item.id} className="text-xs text-slate-500">
                            {item.quantity}× {item.product?.name}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</span>
                        {status === "ENTREGADA" ? (
                          <button
                            type="button"
                            disabled={!shift}
                            onClick={() => setCheckoutTarget(order)}
                            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                            title={!shift ? "Abrí la caja para poder cobrar" : undefined}
                          >
                            Cobrar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAdvance(order)}
                            disabled={busyId === order.id}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {busyId === order.id && <Loader2 size={12} className="animate-spin" />}
                            {ADVANCE_LABELS[status]}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {checkoutTarget && (
        <CheckoutOrderModal
          order={checkoutTarget}
          cashierName={role?.label || "Equipo"}
          onClose={() => setCheckoutTarget(null)}
          onCheckedOut={handleCheckedOut}
        />
      )}
    </div>
  );
}
