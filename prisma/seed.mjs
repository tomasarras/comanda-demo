import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = ["Entradas", "Platos principales", "Pastas", "Postres", "Bebidas"];

const PRODUCTS = [
  { name: "Empanadas de carne (x3)", category: "Entradas", price: 4200, cost: 1800, stock: 40 },
  { name: "Provoleta", category: "Entradas", price: 5800, cost: 2200, stock: 25 },
  { name: "Tabla de fiambres", category: "Entradas", price: 9500, cost: 4200, stock: 15 },
  { name: "Milanesa napolitana", category: "Platos principales", price: 12500, cost: 5100, stock: 30 },
  { name: "Bife de chorizo", category: "Platos principales", price: 15800, cost: 7200, stock: 20 },
  { name: "Pollo al verdeo", category: "Platos principales", price: 11200, cost: 4600, stock: 25 },
  { name: "Salmón grillado", category: "Platos principales", price: 17900, cost: 8500, stock: 12 },
  { name: "Ñoquis con salsa fileto", category: "Pastas", price: 9800, cost: 3400, stock: 35 },
  { name: "Ravioles de ricota y nuez", category: "Pastas", price: 10500, cost: 3900, stock: 28 },
  { name: "Sorrentinos de jamón y queso", category: "Pastas", price: 10800, cost: 4100, stock: 22 },
  { name: "Flan casero", category: "Postres", price: 4500, cost: 1400, stock: 40 },
  { name: "Tiramisú", category: "Postres", price: 5200, cost: 1900, stock: 18 },
  { name: "Panqueques con dulce de leche", category: "Postres", price: 4800, cost: 1600, stock: 30 },
  { name: "Agua mineral 500ml", category: "Bebidas", price: 2200, cost: 700, stock: 80 },
  { name: "Gaseosa línea Coca-Cola", category: "Bebidas", price: 2800, cost: 950, stock: 70 },
  { name: "Copa de vino de la casa", category: "Bebidas", price: 3800, cost: 1300, stock: 50 },
  { name: "Cerveza artesanal IPA", category: "Bebidas", price: 4200, cost: 1700, stock: 45 },
];

const SUPPLIERS = [
  { name: "Distribuidora El Buen Sabor", contact: "Marcos Lima", phone: "011-4555-2301", email: "ventas@buensabor.com.ar" },
  { name: "Carnes Premium SRL", contact: "Roxana Ibáñez", phone: "011-4988-7412", email: "pedidos@carnespremium.com.ar" },
  { name: "Verdulería Mayorista Sur", contact: "Diego Farías", phone: "011-4321-9087", email: "diego@verdusur.com.ar" },
  { name: "Bebidas del Litoral", contact: "Carla Suárez", phone: "011-4765-1203", email: "carla@bebidaslitoral.com.ar" },
];

const EXPENSE_CATEGORIES = ["Insumos", "Servicios", "Sueldos", "Mantenimiento", "Otros"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("Seeding categories...");
  const categoryByName = {};
  for (const name of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryByName[name] = category;
  }

  console.log("Seeding products...");
  for (const p of PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        name: p.name,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        available: true,
        categoryId: categoryByName[p.category].id,
      },
    });
  }

  console.log("Seeding restaurant tables...");
  const TABLES = [
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
  for (const t of TABLES) {
    await prisma.restaurantTable.upsert({
      where: { number: t.number },
      update: {},
      create: t,
    });
  }

  console.log("Seeding suppliers...");
  const suppliers = [];
  for (const s of SUPPLIERS) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    const supplier =
      existing ||
      (await prisma.supplier.create({
        data: s,
      }));
    suppliers.push(supplier);
  }

  const existingSales = await prisma.sale.count();
  if (existingSales === 0) {
    console.log("Seeding historical sales (last 14 days)...");
    const methods = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "MERCADO_PAGO"];
    for (let d = 13; d >= 0; d--) {
      const salesToday = randomInt(8, 18);
      for (let i = 0; i < salesToday; i++) {
        const total = randomInt(4000, 22000);
        await prisma.sale.create({
          data: {
            total,
            paymentMethod: pick(methods),
            cashierName: pick(["Lucía", "Martín", "Sofía"]),
            createdAt: daysAgo(d),
          },
        });
      }
    }
  }

  const existingExpenses = await prisma.expense.count();
  if (existingExpenses === 0) {
    console.log("Seeding historical expenses (last 14 days)...");
    for (let d = 13; d >= 0; d--) {
      if (Math.random() > 0.6) continue;
      await prisma.expense.create({
        data: {
          description: pick([
            "Compra de carne y pollo",
            "Verdura y frutas de estación",
            "Factura de electricidad",
            "Factura de gas",
            "Reparación de heladera",
            "Compra de bebidas",
            "Insumos de limpieza",
          ]),
          category: pick(EXPENSE_CATEGORIES),
          amount: randomInt(8000, 60000),
          supplierId: Math.random() > 0.3 ? pick(suppliers).id : null,
          createdAt: daysAgo(d),
        },
      });
    }
  }

  console.log("Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
