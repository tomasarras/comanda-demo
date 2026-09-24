import { Bike, ClipboardList, ShieldCheck, UtensilsCrossed, Wallet } from "lucide-react";

export const NAV_SECTIONS = [
  { id: "panel", label: "Panel", href: "/panel" },
  { id: "mesas", label: "Mesas", href: "/mesas" },
  { id: "reservas", label: "Reservas", href: "/reservas" },
  { id: "ordenes", label: "Órdenes", href: "/ordenes" },
  { id: "mostrador", label: "Mostrador", href: "/mostrador" },
  { id: "envios", label: "Envíos", href: "/envios" },
  { id: "ventas", label: "Ventas", href: "/ventas" },
  { id: "gastos", label: "Gastos", href: "/gastos" },
  { id: "productos", label: "Productos", href: "/productos" },
  { id: "caja", label: "Caja", href: "/caja" },
  { id: "proveedores", label: "Proveedores", href: "/proveedores" },
  { id: "configuracion", label: "Configuración", href: "/configuracion" },
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
    sections: ["ordenes", "mesas", "reservas"],
  },
  {
    id: "cajero",
    label: "Cajero",
    description: "Cobra, gestiona caja y ventas del mostrador",
    icon: Wallet,
    color: "#2563eb",
    sections: ["caja", "mostrador", "ordenes", "ventas", "mesas", "reservas"],
  },
  {
    id: "recepcionista",
    label: "Recepcionista",
    description: "Organiza mesas y recibe a los comensales",
    icon: ClipboardList,
    color: "#9333ea",
    sections: ["ordenes", "panel", "mesas", "reservas"],
  },
  {
    id: "delivery",
    label: "Delivery",
    description: "Retira y entrega los pedidos con envío",
    icon: Bike,
    color: "#0d9488",
    sections: ["envios"],
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

// Quién puede cargar/editar/eliminar reservas (en Mesas y en Reservas) — el
// resto de los roles solo puede consultarlas.
export function canManageReservations(role) {
  return role?.id === "recepcionista" || role?.id === "admin";
}
