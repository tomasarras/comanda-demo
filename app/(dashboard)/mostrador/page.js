"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Lock, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/format";
import { useRole } from "@/components/RoleProvider";

const PAYMENT_METHODS = [
  { id: "EFECTIVO", label: "Efectivo" },
  { id: "TARJETA", label: "Tarjeta" },
  { id: "TRANSFERENCIA", label: "Transferencia" },
  { id: "MERCADO_PAGO", label: "Mercado Pago" },
];

export default function MostradorPage() {
  const { role } = useRole();
  const [shift, setShift] = useState(undefined);
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [lastSale, setLastSale] = useState(null);

  useEffect(() => {
    fetch("/api/caja/current")
      .then((res) => res.json())
      .then(setShift);
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  const availableProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.available && (!categoryFilter || p.categoryId === categoryFilter));
  }, [products, categoryFilter]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  function addToCart(product) {
    setLastSale(null);
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

  async function handleCheckout() {
    setCheckingOut(true);
    setError("");
    try {
      const res = await fetch("/api/sales/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          paymentMethod,
          cashierName: role?.label || "Equipo",
          orderType: "MOSTRADOR",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo registrar la venta");
      setLastSale(data.sale);
      setCart([]);
      fetch("/api/products")
        .then((r) => r.json())
        .then(setProducts);
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  if (shift === undefined) {
    return (
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mostrador</h1>
        <p className="mt-1 text-sm text-slate-500">Venta rápida para llevar o take-away, sin pasar por una mesa.</p>
        <Skeleton className="mt-6 h-64 w-full max-w-sm rounded-2xl" />
      </div>
    );
  }

  if (shift === null) {
    return (
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mostrador</h1>
        <p className="mt-1 text-sm text-slate-500">Venta rápida para llevar o take-away, sin pasar por una mesa.</p>

        <div className="mt-6 max-w-sm rounded-2xl border border-slate-200 bg-white p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Lock size={18} />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">No hay una caja abierta</p>
          <p className="mt-1 text-xs text-slate-500">Abrí un turno de caja para poder cobrar ventas de mostrador.</p>
          <Link
            href="/caja"
            className="mt-4 flex w-full items-center justify-center rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Ir a Caja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Mostrador</h1>
      <p className="mt-1 text-sm text-slate-500">Venta rápida para llevar o take-away, sin pasar por una mesa.</p>

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
              Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
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
              <h2 className="text-sm font-semibold text-slate-900">Pedido</h2>
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

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-medium text-slate-500">Total</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`rounded-lg py-1.5 text-xs font-semibold ${
                    paymentMethod === m.id ? "bg-orange-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
            {lastSale && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                <CheckCircle2 size={15} />
                Venta cobrada por {formatCurrency(lastSale.total)}
              </p>
            )}

            <button
              type="button"
              disabled={cart.length === 0 || checkingOut}
              onClick={handleCheckout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {checkingOut && <Loader2 size={15} className="animate-spin" />}
              Cobrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
