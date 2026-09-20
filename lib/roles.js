import { ClipboardList, ShieldCheck, UtensilsCrossed, Wallet } from "lucide-react";

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

const ALL_SECTION_IDS = NAV_SECTIONS.map((s) => s.id);

export const ROLES = [
  {
    id: "admin",
    label: "Administrador",
    description: "Acceso completo a todas las secciones",
    icon: ShieldCheck,
    color: "#ea580c",
    sections: ALL_SECTION_IDS,
  },
  {
    id: "mesero",
    label: "Mesero",
    description: "Toma y sigue pedidos de las mesas",
    icon: UtensilsCrossed,
    color: "#16a34a",
    sections: ["ordenes"],
  },
  {
    id: "cajero",
    label: "Cajero",
    description: "Cobra, gestiona caja y ventas del mostrador",
    icon: Wallet,
    color: "#2563eb",
    sections: ["caja", "mostrador", "ordenes", "ventas"],
  },
  {
    id: "recepcionista",
    label: "Recepcionista",
    description: "Organiza mesas y recibe a los comensales",
    icon: ClipboardList,
    color: "#9333ea",
    sections: ["ordenes", "panel"],
  },
];

export function getRole(id) {
  return ROLES.find((r) => r.id === id) || null;
}

// Nav-only gate: this demo has no real backend auth, so it's UX guidance
// (hide + redirect), not an enforced permission boundary.
export function getAllowedSections(role) {
  if (!role) return [];
  return NAV_SECTIONS.filter((s) => role.sections.includes(s.id));
}

export function isSectionAllowed(role, sectionId) {
  return Boolean(role?.sections.includes(sectionId));
}
