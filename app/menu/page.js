"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImageOff, UtensilsCrossed, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";

// Menú de solo lectura para clientes en el salón (se accede escaneando un QR
// en la mesa). Fuera del route group (dashboard): sin Sidebar/Topbar ni
// gate de rol — cualquiera con el link puede verlo, pero no arma pedidos acá;
// eso lo sigue haciendo el mesero desde Órdenes.
export default function MenuPage() {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  }, []);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => !categoryFilter || p.categoryId === categoryFilter);
  }, [products, categoryFilter]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="relative border-b border-slate-200 bg-white px-4 py-5 text-center">
        <a
          href="/"
          className="absolute left-4 top-5 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Volver
        </a>
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600 text-white">
          <UtensilsCrossed size={20} />
        </span>
        <h1 className="mt-2 text-lg font-bold tracking-tight text-slate-900">
          Com<span className="text-orange-600">anda</span>
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">Menú</p>
      </header>

      <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => setCategoryFilter("")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${
            categoryFilter === "" ? "bg-orange-600 text-white" : "border border-slate-200 bg-white text-slate-500"
          }`}
        >
          Todas
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryFilter(c.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${
              categoryFilter === c.id ? "bg-orange-600 text-white" : "border border-slate-200 bg-white text-slate-500"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-2xl px-4">
        {!products ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">No hay productos en esta categoría.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((p) => {
              const outOfStock = !p.available || p.stock <= 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p)}
                  className={`overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:shadow-md ${
                    outOfStock ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex aspect-square items-center justify-center bg-slate-100">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className={`h-full w-full object-cover ${outOfStock ? "grayscale" : ""}`}
                      />
                    ) : (
                      <ImageOff size={22} className="text-slate-300" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                    {p.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{p.description}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-orange-600">{formatCurrency(p.price)}</span>
                      {outOfStock && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          No disponible
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && <ProductDetail product={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ProductDetail({ product, onClose }) {
  const outOfStock = !product.available || product.stock <= 0;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="relative flex aspect-square items-center justify-center bg-slate-100">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`h-full w-full object-cover ${outOfStock ? "grayscale" : ""}`}
            />
          ) : (
            <ImageOff size={32} className="text-slate-300" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-slate-500 shadow hover:bg-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">{product.name}</h2>
            <span className="shrink-0 text-lg font-bold text-orange-600">{formatCurrency(product.price)}</span>
          </div>
          {product.category?.name && <p className="mt-0.5 text-xs text-slate-400">{product.category.name}</p>}
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {product.description || "Sin descripción."}
          </p>
          {outOfStock && (
            <span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              No disponible por el momento
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
