import { ClipboardList, ShieldCheck, UtensilsCrossed, Wallet } from "lucide-react";

export const ROLES = [
  {
    id: "admin",
    label: "Administrador",
    description: "Acceso completo a todas las secciones",
    icon: ShieldCheck,
    color: "#ea580c",
  },
  {
    id: "mesero",
    label: "Mesero",
    description: "Toma y sigue pedidos de las mesas",
    icon: UtensilsCrossed,
    color: "#16a34a",
  },
  {
    id: "cajero",
    label: "Cajero",
    description: "Cobra, gestiona caja y ventas del mostrador",
    icon: Wallet,
    color: "#2563eb",
  },
  {
    id: "recepcionista",
    label: "Recepcionista",
    description: "Organiza mesas y recibe a los comensales",
    icon: ClipboardList,
    color: "#9333ea",
  },
];

export function getRole(id) {
  return ROLES.find((r) => r.id === id) || null;
}

// Which sections each role sees in the nav — Phase 1 shows every section to
// every role; per-role restrictions land in a later phase.
export const NAV_SECTIONS = [
  { id: "panel", label: "Panel", href: "/panel" },
  { id: "ordenes", label: "Órdenes", href: "/ordenes" },
  { id: "mostrador", label: "Mostrador", href: "/mostrador" },
  { id: "ventas", label: "Ventas", href: "/ventas" },
  { id: "gastos", label: "Gastos", href: "/gastos" },
  { id: "productos", label: "Productos", href: "/productos" },
  { id: "caja", label: "Caja", href: "/caja" },
  { id: "proveedores", label: "Proveedores", href: "/proveedores" },
];
