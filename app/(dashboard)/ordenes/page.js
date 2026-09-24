"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Phone, Plus, Users, X } from "lucide-react";
import CheckoutOrderModal from "@/components/CheckoutOrderModal";
import CheckoutTableModal from "@/components/CheckoutTableModal";
import NewOrderPanel from "@/components/NewOrderPanel";
import { Skeleton } from "@/components/Skeleton";
import { ENVIO_FLOW, RETIRA_FLOW, SALON_FLOW, STATUS_LABELS, advanceLabel } from "@/lib/orders";
import { formatCurrency } from "@/lib/format";
import { useRole } from "@/components/RoleProvider";

const TABS = [
  { id: "SALON", label: "Salón", flow: SALON_FLOW },
  { id: "RETIRA", label: "Para retirar", flow: RETIRA_FLOW },
  { id: "ENVIO", label: "Con envío", flow: ENVIO_FLOW },
];

function minutesAgo(date) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  return Math.floor(diff / 60000);
}

function filterByTab(orders, tabId) {
  if (tabId === "SALON") return orders.filter((o) => o.type === "SALON");
  return orders.filter((o) => o.type === "DELIVERY" && o.deliveryMode === tabId);
}

// Agrupa las órdenes entregadas de una misma mesa (ej. plato + postre pedidos
// por separado) para que se cobren juntas en un solo pago.
function groupByTable(orders) {
  const groups = new Map();
  for (const order of orders) {
    const key = order.tableId;
    if (!groups.has(key)) {
      groups.set(key, { tableId: order.tableId, tableNumber: order.table?.number, orders: [] });
    }
    groups.get(key).orders.push(order);
  }
  return Array.from(groups.values()).map((g) => ({
    ...g,
    total: g.orders.reduce((sum, o) => sum + o.total, 0),
  }));
}

function PaymentBadge({ order }) {
  return order.paid ? (
    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">Pagado</span>
  ) : (
    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
      Cobrar al {order.deliveryMode === "ENVIO" ? "entregar" : "retirar"}
    </span>
  );
}

export default function OrdenesPage() {
  const { role } = useRole();
  const [orders, setOrders] = useState(null);
  const [tables, setTables] = useState([]);
  const [shift, setShift] = useState(undefined);
  const [view, setView] = useState("board");
  const [tab, setTab] = useState("SALON");
  const [busyId, setBusyId] = useState(null);
  const [checkoutGroup, setCheckoutGroup] = useState(null);
  const [checkoutOrderTarget, setCheckoutOrderTarget] = useState(null);
  const [error, setError] = useState("");
  const [dragOverStatus, setDragOverStatus] = useState(null);

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

  // FloorPlan usa table.hasOpenOrder para habilitar/bloquear la mesa al
  // elegirla en "Nueva orden". El array `tables` solo se trae una vez (y se
  // parchea a mano en algunos handlers) — recalcularlo acá a partir de
  // `orders`, que sí queda siempre al día con cada avance/cobro, evita que
  // quede "colgado" un bloqueo viejo hasta recargar la página.
  const tablesWithLiveOpenOrder = useMemo(() => {
    const openStatuses = new Set(SALON_FLOW.slice(0, -1));
    const openTableIds = new Set(
      (orders || [])
        .filter((o) => o.type === "SALON" && o.tableId && openStatuses.has(o.status))
        .map((o) => o.tableId),
    );
    return tables.map((t) => ({ ...t, hasOpenOrder: openTableIds.has(t.id) }));
  }, [tables, orders]);

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const tabOrders = useMemo(() => filterByTab(orders || [], tab), [orders, tab]);
  const checkoutStatus = activeTab.flow[activeTab.flow.length - 1];

  const columns = useMemo(() => {
    const grouped = Object.fromEntries(activeTab.flow.map((s) => [s, []]));
    tabOrders.forEach((o) => {
      if (grouped[o.status]) grouped[o.status].push(o);
    });
    return grouped;
  }, [tabOrders, activeTab]);

  const entregadaGroups = useMemo(
    () => (tab === "SALON" ? groupByTable(columns[checkoutStatus] || []) : []),
    [tab, columns, checkoutStatus],
  );

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

  // Arrastrar y soltar: mueve la orden a cualquier columna de su propio
  // circuito, para adelante o para atrás (ej. corregir un "Entregado" que el
  // delivery marcó por error, volviéndolo a "Enviando").
  async function handleMove(orderId, targetStatus) {
    const order = (orders || []).find((o) => o.id === orderId);
    if (!order || order.status === targetStatus) return;
    setBusyId(orderId);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", status: targetStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo mover la orden");
      setOrders((prev) => prev.map((o) => (o.id === data.id ? data : o)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleClose(order) {
    setBusyId(order.id);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cerrar la orden");
      setOrders((prev) => prev.filter((o) => o.id !== data.id));
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
    setTab(order.type === "DELIVERY" ? order.deliveryMode : "SALON");
    setView("board");
  }

  function handleCheckedOutGroup({ tableId, orderIds }) {
    setOrders((prev) => prev.filter((o) => !orderIds.includes(o.id)));
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, activeOrder: null } : t)));
    setCheckoutGroup(null);
  }

  function handleCheckedOutOrder(updatedOrder) {
    setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
    setCheckoutOrderTarget(null);
  }

  if (view === "new") {
    return (
      <div>
        <h1 className="text-xl font-bold text-slate-900">Órdenes</h1>
        <p className="mt-1 text-sm text-slate-500">Pedidos de salón, para retirar o con envío, del pedido al cobro.</p>
        <div className="mt-6">
          <NewOrderPanel
            tables={tablesWithLiveOpenOrder}
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
          <p className="mt-1 text-sm text-slate-500">Pedidos de salón, para retirar o con envío, del pedido al cobro.</p>
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

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              tab === t.id ? "bg-orange-600 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
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
          activeTab.flow.map((status) => (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStatus(status);
              }}
              onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStatus(null);
                const orderId = e.dataTransfer.getData("text/plain");
                if (orderId) handleMove(orderId, status);
              }}
              className={`rounded-2xl border bg-white p-4 transition ${
                dragOverStatus === status ? "border-orange-400 ring-2 ring-orange-100" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">{STATUS_LABELS[status]}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {status === checkoutStatus && tab === "SALON" ? entregadaGroups.length : columns[status].length}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {status === checkoutStatus && tab === "SALON" ? (
                  entregadaGroups.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">Sin órdenes.</p>
                  ) : (
                    entregadaGroups.map((group) => (
                      <div key={group.tableId} className="rounded-xl border border-slate-200 p-3">
                        <p className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                          <Users size={13} className="text-slate-400" />
                          Mesa {group.tableNumber}
                          {group.orders.length > 1 && (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              {group.orders.length} órdenes
                            </span>
                          )}
                        </p>

                        <div className="mt-2 space-y-2">
                          {group.orders.map((order) => (
                            <div
                              key={order.id}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData("text/plain", order.id)}
                              className="cursor-grab rounded-lg bg-slate-50 p-2 active:cursor-grabbing"
                            >
                              <div className="flex items-start justify-between">
                                <p className="text-xs text-slate-400">
                                  {order.waiterName || "Equipo"} · hace {minutesAgo(order.createdAt)} min
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleCancel(order)}
                                  disabled={busyId === order.id}
                                  className="rounded-lg p-1 text-slate-300 hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50"
                                  title="Cancelar orden"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                              <ul className="mt-1 space-y-0.5">
                                {order.items.map((item) => (
                                  <li key={item.id} className="text-xs text-slate-500">
                                    {item.quantity}× {item.product?.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                          <span className="text-sm font-bold text-slate-900">{formatCurrency(group.total)}</span>
                          <button
                            type="button"
                            disabled={!shift}
                            onClick={() => setCheckoutGroup(group)}
                            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                            title={!shift ? "Abrí la caja para poder cobrar" : undefined}
                          >
                            Cobrar
                          </button>
                        </div>
                      </div>
                    ))
                  )
                ) : columns[status].length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Sin órdenes.</p>
                ) : (
                  columns[status].map((order) => (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", order.id)}
                      className="cursor-grab rounded-xl border border-slate-200 p-3 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                            {order.type === "SALON" ? (
                              <>
                                <Users size={13} className="text-slate-400" />
                                Mesa {order.table?.number}
                              </>
                            ) : (
                              order.customerName
                            )}
                          </p>
                          {order.type !== "SALON" && order.customerPhone && (
                            <p className="flex items-center gap-1 text-xs text-slate-400">
                              <Phone size={11} />
                              {order.customerPhone}
                            </p>
                          )}
                          {order.address && (
                            <p className="flex items-center gap-1 text-xs text-slate-400">
                              <MapPin size={11} />
                              {order.address}
                            </p>
                          )}
                          <p className="text-xs text-slate-400">
                            {order.waiterName || "Equipo"} · hace {minutesAgo(order.createdAt)} min
                          </p>
                          {order.status === "ENTREGADA" && order.deliveryMode === "ENVIO" && order.deliveredBy && (
                            <p className="text-xs font-medium text-emerald-600">Entregada por: {order.deliveredBy}</p>
                          )}
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

                      {order.type !== "SALON" && (
                        <div className="mt-1.5">
                          <PaymentBadge order={order} />
                        </div>
                      )}

                      <ul className="mt-2 space-y-0.5">
                        {order.items.map((item) => (
                          <li key={item.id} className="text-xs text-slate-500">
                            {item.quantity}× {item.product?.name}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</span>
                        {status === checkoutStatus ? (
                          order.paid ? (
                            <button
                              type="button"
                              onClick={() => handleClose(order)}
                              disabled={busyId === order.id}
                              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {busyId === order.id && <Loader2 size={12} className="animate-spin" />}
                              Marcar entregado
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!shift}
                              onClick={() => setCheckoutOrderTarget(order)}
                              className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                              title={!shift ? "Abrí la caja para poder cobrar" : undefined}
                            >
                              Cobrar
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAdvance(order)}
                            disabled={busyId === order.id}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {busyId === order.id && <Loader2 size={12} className="animate-spin" />}
                            {advanceLabel(order)}
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

      {checkoutGroup && (
        <CheckoutTableModal
          tableId={checkoutGroup.tableId}
          tableNumber={checkoutGroup.tableNumber}
          orders={checkoutGroup.orders}
          total={checkoutGroup.total}
          cashierName={role?.label || "Equipo"}
          onClose={() => setCheckoutGroup(null)}
          onCheckedOut={handleCheckedOutGroup}
        />
      )}

      {checkoutOrderTarget && (
        <CheckoutOrderModal
          order={checkoutOrderTarget}
          cashierName={role?.label || "Equipo"}
          onClose={() => setCheckoutOrderTarget(null)}
          onCheckedOut={handleCheckedOutOrder}
        />
      )}
    </div>
  );
}
