import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import {
  CATEGORIES,
  DELIVERY_FEE,
  EMPLOYEES,
  EXPENSE_CATEGORIES,
  PRODUCTS,
  SUPPLIERS,
  TABLES,
  daysAgo,
  pick,
  randomInt,
} from "@/lib/demoData.mjs";

const MENU_IMAGES_DIR = path.join(process.cwd(), "public", "menu-images");

function imageUrlFor(imageFile) {
  if (!imageFile) return null;
  try {
    return fs.existsSync(path.join(MENU_IMAGES_DIR, imageFile)) ? `/menu-images/${imageFile}` : null;
  } catch {
    return null;
  }
}

// Botón "Restablecer demo": esta es una demo pública sin login, cualquiera
// puede entrar y cargar datos basura o intentar romperla — esto la vuelve a
// un estado conocido de un solo golpe. Borra TODO (transaccional y catálogo)
// y vuelve a sembrar el catálogo base + un poco de historial para que los
// gráficos de Ventas/Gastos no se vean vacíos. Todo por createMany (en vez de
// un create por fila) porque la latencia contra Neon hace que cientos de
// round-trips secuenciales tarden casi un minuto.
export async function resetDemoData() {
  await prisma.$transaction([
    prisma.cashMovement.deleteMany(),
    prisma.cashRegisterShift.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.reservation.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.product.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.restaurantTable.deleteMany(),
    prisma.category.deleteMany(),
  ]);

  await prisma.category.createMany({ data: CATEGORIES.map((name) => ({ name })) });
  const categories = await prisma.category.findMany();
  const categoryIdByName = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  await prisma.product.createMany({
    data: PRODUCTS.map((p) => ({
      name: p.name,
      description: p.description,
      price: p.price,
      cost: p.cost,
      stock: p.stock,
      available: true,
      imageUrl: imageUrlFor(p.imageFile),
      categoryId: categoryIdByName[p.category],
    })),
  });

  await prisma.restaurantTable.createMany({
    data: TABLES.map((t, i) => ({
      ...t,
      posX: 20 + (i % 5) * 15,
      posY: 20 + Math.floor(i / 5) * 25,
    })),
  });

  await prisma.supplier.createMany({ data: SUPPLIERS });
  const suppliers = await prisma.supplier.findMany();

  await prisma.employee.createMany({ data: EMPLOYEES });

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { deliveryFee: DELIVERY_FEE },
    create: { id: "singleton", deliveryFee: DELIVERY_FEE },
  });

  const methods = ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "MERCADO_PAGO"];
  const salesData = [];
  for (let d = 13; d >= 0; d--) {
    const salesToday = randomInt(8, 18);
    for (let i = 0; i < salesToday; i++) {
      salesData.push({
        total: randomInt(4000, 22000),
        paymentMethod: pick(methods),
        cashierName: pick(["Lucía", "Martín", "Sofía"]),
        createdAt: daysAgo(d),
      });
    }
  }
  await prisma.sale.createMany({ data: salesData });

  const expenseDescriptions = [
    "Compra de carne y pollo",
    "Verdura y frutas de estación",
    "Factura de electricidad",
    "Factura de gas",
    "Reparación de heladera",
    "Compra de bebidas",
    "Insumos de limpieza",
  ];
  const expensesData = [];
  for (let d = 13; d >= 0; d--) {
    if (Math.random() > 0.6) continue;
    expensesData.push({
      description: pick(expenseDescriptions),
      category: pick(EXPENSE_CATEGORIES),
      amount: randomInt(8000, 60000),
      supplierId: Math.random() > 0.3 ? pick(suppliers).id : null,
      createdAt: daysAgo(d),
    });
  }
  await prisma.expense.createMany({ data: expensesData });
}
