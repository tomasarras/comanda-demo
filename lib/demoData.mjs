// Datos base de la demo pública — usados por prisma/seed.mjs (script de CLI,
// no destructivo) y por lib/demoReset.js (endpoint "Restablecer demo", que sí
// borra todo y vuelve a este estado conocido). Un solo lugar de verdad para
// que ambos no se desincronicen.

export const CATEGORIES = ["Entradas", "Platos principales", "Pastas", "Postres", "Bebidas"];

export const PRODUCTS = [
  {
    name: "Empanadas de carne (x3)",
    category: "Entradas",
    price: 4200,
    cost: 1800,
    stock: 40,
    description: "Tres empanadas caseras de carne cortada a cuchillo, repulgo a mano y horneadas al momento.",
    imageFile: "empanadas-de-carne.jpeg",
  },
  {
    name: "Provoleta",
    category: "Entradas",
    price: 5800,
    cost: 2200,
    stock: 25,
    description: "Provolone a la parrilla con orégano y un hilo de aceite de oliva, servida bien dorada.",
    imageFile: "provoleta.jpeg",
  },
  {
    name: "Tabla de fiambres",
    category: "Entradas",
    price: 9500,
    cost: 4200,
    stock: 15,
    description: "Selección de jamón crudo, salame, queso y aceitunas para compartir.",
    imageFile: "tabla-de-fiambres.jpeg",
  },
  {
    name: "Milanesa napolitana",
    category: "Platos principales",
    price: 12500,
    cost: 5100,
    stock: 30,
    description: "Milanesa de ternera con salsa de tomate, jamón y muzzarella gratinada, con papas fritas.",
    imageFile: "milanesa-napolitana.jpeg",
  },
  {
    name: "Bife de chorizo",
    category: "Platos principales",
    price: 15800,
    cost: 7200,
    stock: 20,
    description: "Bife de chorizo a la parrilla, punto a elección, con guarnición de puré o ensalada.",
    imageFile: "bife-de-chorizo.jpeg",
  },
  {
    name: "Pollo al verdeo",
    category: "Platos principales",
    price: 11200,
    cost: 4600,
    stock: 25,
    description: "Suprema de pollo grillada con salsa cremosa de cebolla de verdeo.",
    imageFile: "pollo-al-verdeo.jpeg",
  },
  {
    name: "Salmón grillado",
    category: "Platos principales",
    price: 17900,
    cost: 8500,
    stock: 12,
    description: "Filet de salmón a la plancha con vegetales salteados y salsa de limón.",
    imageFile: "salmon-grillado.jpeg",
  },
  {
    name: "Ñoquis con salsa fileto",
    category: "Pastas",
    price: 9800,
    cost: 3400,
    stock: 35,
    description: "Ñoquis de papa caseros con salsa fileto y albahaca fresca.",
    imageFile: "noquis-con-salsa-fileto.jpeg",
  },
  {
    name: "Ravioles de ricota y nuez",
    category: "Pastas",
    price: 10500,
    cost: 3900,
    stock: 28,
    description: "Ravioles rellenos de ricota y nuez, con manteca y salvia.",
    imageFile: "ravioles-de-ricota-y-nuez.jpeg",
  },
  {
    name: "Sorrentinos de jamón y queso",
    category: "Pastas",
    price: 10800,
    cost: 4100,
    stock: 22,
    description: "Sorrentinos rellenos de jamón y queso con salsa a elección (fileto o crema).",
    imageFile: "sorrentinos-de-jamon-y-queso.jpeg",
  },
  {
    name: "Flan casero",
    category: "Postres",
    price: 4500,
    cost: 1400,
    stock: 40,
    description: "Flan casero con dulce de leche y crema.",
    imageFile: "flan-casero.jpeg",
  },
  {
    name: "Tiramisú",
    category: "Postres",
    price: 5200,
    cost: 1900,
    stock: 18,
    description: "Clásico tiramisú con café, mascarpone y cacao amargo.",
    imageFile: "tiramisu.jpeg",
  },
  {
    name: "Panqueques con dulce de leche",
    category: "Postres",
    price: 4800,
    cost: 1600,
    stock: 30,
    description: "Panqueques caseros rellenos de dulce de leche.",
    imageFile: "panqueques-con-dulce-de-leche.jpeg",
  },
  {
    name: "Agua mineral 500ml",
    category: "Bebidas",
    price: 2200,
    cost: 700,
    stock: 80,
    description: "Agua mineral sin gas, botella de 500ml.",
    imageFile: "agua-mineral-500ml.jpeg",
  },
  {
    name: "Gaseosa línea Coca-Cola",
    category: "Bebidas",
    price: 2800,
    cost: 950,
    stock: 70,
    description: "Gaseosa línea Coca-Cola, botella de 500ml.",
    imageFile: "gaseosa-linea-coca-cola.jpeg",
  },
  {
    name: "Copa de vino de la casa",
    category: "Bebidas",
    price: 3800,
    cost: 1300,
    stock: 50,
    description: "Copa de vino tinto de la casa, malbec de la región de Cuyo.",
    imageFile: "copa-de-vino-de-la-casa.jpeg",
  },
  {
    name: "Cerveza artesanal IPA",
    category: "Bebidas",
    price: 4200,
    cost: 1700,
    stock: 45,
    description: "Cerveza artesanal estilo IPA, botella de 500ml.",
    imageFile: "cerveza-artesanal-ipa.jpeg",
  },
];

export const TABLES = [
  { number: 1, capacity: 2 },
  { number: 2, capacity: 2 },
  { number: 3, capacity: 4 },
  { number: 4, capacity: 4 },
  { number: 5, capacity: 4 },
  { number: 6, capacity: 6 },
  { number: 7, capacity: 6 },
  { number: 8, capacity: 2 },
  { number: 9, capacity: 4 },
  { number: 10, capacity: 8 },
];

export const SUPPLIERS = [
  { name: "Distribuidora El Buen Sabor", contact: "Marcos Lima", phone: "011-4555-2301", email: "ventas@buensabor.com.ar" },
  { name: "Carnes Premium SRL", contact: "Roxana Ibáñez", phone: "011-4988-7412", email: "pedidos@carnespremium.com.ar" },
  { name: "Verdulería Mayorista Sur", contact: "Diego Farías", phone: "011-4321-9087", email: "diego@verdusur.com.ar" },
  { name: "Bebidas del Litoral", contact: "Carla Suárez", phone: "011-4765-1203", email: "carla@bebidaslitoral.com.ar" },
];

export const EMPLOYEES = [
  { name: "Ana Administradora", email: "admin@comanda.demo", role: "admin" },
  { name: "Lucía Gómez", email: "lucia@comanda.demo", role: "mesero" },
  { name: "Martín Pérez", email: "martin@comanda.demo", role: "cajero" },
  { name: "Sofía Ruiz", email: "sofia@comanda.demo", role: "recepcionista" },
  { name: "Nico Torres", email: "nico@comanda.demo", role: "delivery" },
];

export const EXPENSE_CATEGORIES = ["Insumos", "Servicios", "Sueldos", "Mantenimiento", "Otros"];

// Costo de envío por defecto — se puede cambiar desde Configuración → Envíos.
export const DELIVERY_FEE = 1500;

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

export function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
