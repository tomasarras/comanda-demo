"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Phone } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import { STATUS_LABELS, advanceLabel } from "@/lib/orders";
import { formatCurrency } from "@/lib/format";

function minutesAgo(date) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());
  return Math.floor(diff / 60000);
}

function PaymentBadge({ order }) {
  return order.paid ? (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
      Ya está pagado
    </span>
  ) : (
    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
      Cobrar {formatCurrency(order.total)} al entregar
    </span>
  );
}

const DELIVERY_NAME_KEY = "comanda_delivery_name";

export default function EnviosPage() {
  const [orders, setOrders] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [deliveryPeople, setDeliveryPeople] = useState([]);
  const [deliveryName, setDeliveryName] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then(setOrders);
    fetch("/api/employees")
      .then((res) => res.json())
      .then((emps) => setDeliveryPeople(emps.filter((e) => e.role === "delivery" && e.active)));
    const saved = window.localStorage.getItem(DELIVERY_NAME_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setDeliveryName(saved);
  }, []);

  function pickDeliveryPerson(name) {
    setDeliveryName(name);
    window.localStorage.setItem(DELIVERY_NAME_KEY, name);
  }

  function clearDeliveryPerson() {
    setDeliveryName("");
    window.localStorage.removeItem(DELIVERY_NAME_KEY);
  }

  const envios = useMemo(
    () =>
      (orders || []).filter(
        (o) => o.type === "DELIVERY" && o.deliveryMode === "ENVIO" && (o.status === "LISTA" || o.status === "ENVIANDO"),
      ),
    [orders],
  );

  const listas = envios.filter((o) => o.status === "LISTA");
  const enviando = envios.filter((o) => o.status === "ENVIANDO");

  async function handleAdvance(order) {
    setBusyId(order.id);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "advance",
          deliveredBy: order.status === "ENVIANDO" ? deliveryName || null : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la orden");
      setOrders((prev) => {
        const updated = prev.map((o) => (o.id === data.id ? data : o));
        return data.status === "ENTREGADA" ? updated.filter((o) => o.id !== data.id) : updated;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // Arrastrar y soltar entre columnas: para adelante ("salir a entregar") o
  // para atrás, por si se marcó "Enviando" por error y hay que volverla a
  // "Lista para enviar".
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

  function OrderCard({ order }) {
    return (
      <div
        draggable
        onDragStart={(e) => e.dataTransfer.setData("text/plain", order.id)}
        className="cursor-grab rounded-xl border border-slate-200 p-3 active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">{order.customerName}</p>
            {order.customerPhone && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Phone size={11} />
                {order.customerPhone}
              </p>
            )}
            {order.address && (
              <p className="flex items-center gap-1 text-xs font-medium text-slate-600">
                <MapPin size={11} />
                {order.address}
              </p>
            )}
            <p className="text-xs text-slate-400">hace {minutesAgo(order.createdAt)} min</p>
          </div>
          <PaymentBadge order={order} />
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
          <button
            type="button"
            onClick={() => handleAdvance(order)}
            disabled={busyId === order.id}
            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {busyId === order.id && <Loader2 size={12} className="animate-spin" />}
            {order.status === "LISTA" ? "Salir a entregar" : advanceLabel(order)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Envíos</h1>
      <p className="mt-1 text-sm text-slate-500">Pedidos con envío listos para salir y en camino.</p>

      {!deliveryName ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">¿Quién sos?</p>
          {deliveryPeople.length === 0 ? (
            <p className="mt-1 text-xs text-amber-700">
              No hay personal de delivery cargado en Configuración → Personal.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {deliveryPeople.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickDeliveryPerson(p.name)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Repartiendo como <span className="font-semibold text-slate-600">{deliveryName}</span> ·{" "}
          <button type="button" onClick={clearDeliveryPerson} className="underline hover:text-slate-600">
            cambiar
          </button>
        </p>
      )}

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverStatus("LISTA");
          }}
          onDragLeave={() => setDragOverStatus((s) => (s === "LISTA" ? null : s))}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverStatus(null);
            const orderId = e.dataTransfer.getData("text/plain");
            if (orderId) handleMove(orderId, "LISTA");
          }}
          className={`rounded-2xl border bg-white p-4 transition ${
            dragOverStatus === "LISTA" ? "border-orange-400 ring-2 ring-orange-100" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">{STATUS_LABELS.LISTA} para enviar</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {listas.length}
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {!orders ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : listas.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Sin pedidos listos.</p>
            ) : (
              listas.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverStatus("ENVIANDO");
          }}
          onDragLeave={() => setDragOverStatus((s) => (s === "ENVIANDO" ? null : s))}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverStatus(null);
            const orderId = e.dataTransfer.getData("text/plain");
            if (orderId) handleMove(orderId, "ENVIANDO");
          }}
          className={`rounded-2xl border bg-white p-4 transition ${
            dragOverStatus === "ENVIANDO" ? "border-orange-400 ring-2 ring-orange-100" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">{STATUS_LABELS.ENVIANDO}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {enviando.length}
            </span>
          </div>
          <div className="mt-3 space-y-3">
            {!orders ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : enviando.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Nadie en camino.</p>
            ) : (
              enviando.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
