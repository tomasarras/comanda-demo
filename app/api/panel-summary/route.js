import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const sevenDaysAgo = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

  const [todaySales, todayExpenses, productCount, lowStockCount, recentSales, recentExpenses] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { amount: true },
      }),
      prisma.product.count({ where: { available: true } }),
      prisma.product.count({ where: { stock: { lt: 10 } } }),
      prisma.sale.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { total: true, createdAt: true },
      }),
      prisma.expense.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { amount: true, createdAt: true },
      }),
    ]);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
    const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const salesTotal = recentSales
      .filter((s) => s.createdAt >= day && s.createdAt < dayEnd)
      .reduce((sum, s) => sum + Number(s.total), 0);
    const expensesTotal = recentExpenses
      .filter((e) => e.createdAt >= day && e.createdAt < dayEnd)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    days.push({
      date: day.toISOString().slice(0, 10),
      sales: salesTotal,
      expenses: expensesTotal,
    });
  }

  return NextResponse.json({
    todaySalesTotal: Number(todaySales._sum.total || 0),
    todaySalesCount: todaySales._count,
    todayExpensesTotal: Number(todayExpenses._sum.amount || 0),
    activeProducts: productCount,
    lowStockCount,
    last7Days: days,
  });
}
