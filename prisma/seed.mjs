import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CATEGORIES,
  EXPENSE_CATEGORIES,
  PRODUCTS,
  SUPPLIERS,
  TABLES,
  daysAgo,
  pick,
  randomInt,
} from "../lib/demoData.mjs";

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MENU_IMAGES_DIR = path.join(__dirname, "..", "public", "menu-images");

function imageUrlFor(imageFile) {
  if (!imageFile) return null;
  return fs.existsSync(path.join(MENU_IMAGES_DIR, imageFile)) ? `/menu-images/${imageFile}` : null;
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
        description: p.description,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        available: true,
        imageUrl: imageUrlFor(p.imageFile),
        categoryId: categoryByName[p.category].id,
      },
    });
  }

  console.log("Seeding restaurant tables...");
  for (const [i, t] of TABLES.entries()) {
    const posX = 20 + (i % 5) * 15;
    const posY = 20 + Math.floor(i / 5) * 25;
    await prisma.restaurantTable.upsert({
      where: { number: t.number },
      update: {},
      create: { ...t, posX, posY },
    });
  }

  console.log("Seeding suppliers...");
  const suppliers = [];
  for (const s of SUPPLIERS) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    const supplier = existing || (await prisma.supplier.create({ data: s }));
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
