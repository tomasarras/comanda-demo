"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import { NAV_SECTIONS } from "@/lib/roles";

const ICONS = {
  panel: LayoutDashboard,
  ordenes: ClipboardList,
  mostrador: ShoppingCart,
  ventas: BadgeDollarSign,
  gastos: Receipt,
  productos: Package,
  caja: Wallet,
  proveedores: Truck,
};

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/panel" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white">
              <UtensilsCrossed size={18} />
            </span>
            <span className="text-lg tracking-tight">
              Com<span className="text-orange-600">anda</span>
            </span>
          </Link>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_SECTIONS.map((section) => {
            const Icon = ICONS[section.id];
            const active = pathname.startsWith(section.href);
            return (
              <Link
                key={section.id}
                href={section.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-orange-50 text-orange-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={18} />
                {section.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
