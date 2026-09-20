"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/format";

export default function NewOrderPanel({ tables, waiterName, onClose, onCreated }) {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tableId, setTableId] = useState("");
  const [cart, setCart] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  const freeTables = useMemo(() => tables.filter((t) => !t.activeOrder), [tables]);

  const availableProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.available && (!categoryFilter || p.categoryId === categoryFilter));
  }, [products, categoryFilter]);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

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

  async function handleCreate() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          waiterName,
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

      <label className="mt-3 block max-w-xs">
        <span className="mb-1 block text-xs font-medium text-slate-500">Mesa</span>
        <select
          value={tableId}
          onChange={(e) => setTableId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          <option value="">Elegir mesa…</option>
          {freeTables.map((t) => (
            <option key={t.id} value={t.id}>
              Mesa {t.number} · {t.capacity} personas
            </option>
          ))}
        </select>
      </label>

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

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-medium text-slate-500">Total</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
            </div>

            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

            <button
              type="button"
              disabled={cart.length === 0 || !tableId || saving}
              onClick={handleCreate}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Crear orden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
