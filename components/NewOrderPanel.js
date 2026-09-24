"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import FloorPlan from "@/components/FloorPlan";
import ReservationWarningModal from "@/components/ReservationWarningModal";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/format";
import { isUpcomingSoon, tableStatus } from "@/lib/reservations";

const ORDER_KINDS = [
  { id: "SALON", label: "En el salón" },
  { id: "RETIRA", label: "Para retirar" },
  { id: "ENVIO", label: "Con envío" },
];

const PAYMENT_METHODS = [
  { id: "EFECTIVO", label: "Efectivo" },
  { id: "TARJETA", label: "Tarjeta" },
  { id: "TRANSFERENCIA", label: "Transferencia" },
  { id: "MERCADO_PAGO", label: "Mercado Pago" },
];

export default function NewOrderPanel({ tables, waiterName, onClose, onCreated }) {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderKind, setOrderKind] = useState("SALON");
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [prepaid, setPrepaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [cart, setCart] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reservations, setReservations] = useState([]);
  const [pendingTableId, setPendingTableId] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
    fetch("/api/reservations")
      .then((res) => res.json())
      .then(setReservations);
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setDeliveryFee(data.deliveryFee));
  }, []);

  const tablesWithStatus = useMemo(() => {
    const now = new Date();
    return tables.map((t) => ({
      ...t,
      status: tableStatus(t, reservations.filter((r) => r.tableId === t.id), now),
    }));
  }, [tables, reservations]);

  const pendingTable = tablesWithStatus.find((t) => t.id === pendingTableId) || null;
  const pendingReservations = reservations.filter(
    (r) => r.tableId === pendingTableId && isUpcomingSoon(r.reservedFor),
  );

  function handleSelectTable(id) {
    const table = tablesWithStatus.find((t) => t.id === id);
    if (table?.status === "reserved") {
      setPendingTableId(id);
    } else {
      setTableId(id);
    }
  }

  function handleProceedAnyway() {
    setTableId(pendingTableId);
    setPendingTableId(null);
  }

  async function handleDeleteReservation(id) {
    const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "No se pudo eliminar la reserva");
    setReservations((prev) => prev.filter((r) => r.id !== id));
    setTableId(pendingTableId);
    setPendingTableId(null);
  }

  const availableProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.available && (!categoryFilter || p.categoryId === categoryFilter));
  }, [products, categoryFilter]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const total = orderKind === "ENVIO" ? subtotal + deliveryFee : subtotal;

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: Number(product.price), quantity: 1 }];
    });
  }

  function changeQuantity(productId, delta) {
    setCart((prev) =>
      prev
        .map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  const isDelivery = orderKind === "RETIRA" || orderKind === "ENVIO";
  const canSubmit =
    cart.length > 0 &&
    (orderKind === "SALON"
      ? Boolean(tableId)
      : customerName.trim() && customerPhone.trim() && (orderKind !== "ENVIO" || address.trim()));

  async function handleCreate() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isDelivery ? "DELIVERY" : "SALON",
          tableId: orderKind === "SALON" ? tableId : undefined,
          deliveryMode: isDelivery ? orderKind : undefined,
          customerName: isDelivery ? customerName.trim() : undefined,
          customerPhone: isDelivery ? customerPhone.trim() : undefined,
          address: orderKind === "ENVIO" ? address.trim() : undefined,
          waiterName,
          paid: isDelivery ? prepaid : false,
          paymentMethod: isDelivery && prepaid ? paymentMethod : undefined,
          cashierName: waiterName,
          items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear la orden");
      onCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Nueva orden</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ORDER_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setOrderKind(k.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              orderKind === k.id ? "bg-orange-600 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {orderKind === "SALON" && (
        <div className="mt-3 max-w-xl">
          <span className="mb-1 block text-xs font-medium text-slate-500">Mesa</span>
          <FloorPlan tables={tablesWithStatus} mode="select" selectedId={tableId} onSelect={handleSelectTable} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                categoryFilter === "" ? "bg-orange-600 text-white" : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(c.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  categoryFilter === c.id ? "bg-orange-600 text-white" : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {!products ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
            ) : availableProducts.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-slate-400">No hay productos disponibles.</p>
            ) : (
              availableProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-orange-300 hover:shadow-sm"
                >
                  <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                  <span className="mt-1 text-xs text-slate-400">{p.category?.name || "—"}</span>
                  <span className="mt-2 text-sm font-bold text-orange-600">{formatCurrency(p.price)}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:col-span-1 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-orange-600" />
              <h3 className="text-sm font-semibold text-slate-900">Pedido</h3>
            </div>

            {cart.length === 0 ? (
              <p className="mt-6 text-center text-sm text-slate-400">Tocá un producto para agregarlo.</p>
            ) : (
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{item.name}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(item.price)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.productId, -1)}
                        className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold text-slate-800">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.productId, 1)}
                        className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="rounded-lg p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isDelivery && cart.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500">Datos de {orderKind === "ENVIO" ? "envío" : "retiro"}</p>
                <div>
                  <span className="mb-1 block text-xs font-medium text-slate-500">Nombre de quien pide</span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Juana Pérez"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  />
                </div>
                <div>
                  <span className="mb-1 block text-xs font-medium text-slate-500">Teléfono</span>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej. 11 5555-5555"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                {orderKind === "ENVIO" && (
                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-500">Dirección de entrega</span>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej. Av. Corrientes 1234, 3° B"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                    />
                  </div>
                )}

                <div>
                  <span className="mb-1 block text-xs font-medium text-slate-500">Pago</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPrepaid(false)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        !prepaid ? "bg-orange-600 text-white" : "bg-white text-slate-500 border border-slate-200"
                      }`}
                    >
                      Cobrar al {orderKind === "ENVIO" ? "entregar" : "retirar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrepaid(true)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        prepaid ? "bg-orange-600 text-white" : "bg-white text-slate-500 border border-slate-200"
                      }`}
                    >
                      Ya está pagado
                    </button>
                  </div>
                </div>

                {prepaid && (
                  <div>
                    <span className="mb-1 block text-xs font-medium text-slate-500">Medio de pago</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`rounded-lg py-2 text-xs font-semibold ${
                            paymentMethod === m.id
                              ? "bg-orange-600 text-white"
                              : "bg-white text-slate-500 border border-slate-200"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 border-t border-slate-100 pt-3">
              {orderKind === "ENVIO" && cart.length > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Costo de envío</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                </>
              )}
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Total</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

            <button
              type="button"
              disabled={!canSubmit || saving}
              onClick={handleCreate}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Crear orden
            </button>
          </div>
        </div>
      </div>

      {pendingTable && (
        <ReservationWarningModal
          table={pendingTable}
          reservations={pendingReservations}
          onClose={() => setPendingTableId(null)}
          onProceedAnyway={handleProceedAnyway}
          onDeleteReservation={handleDeleteReservation}
        />
      )}
    </div>
  );
}
