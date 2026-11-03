import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId") || "default";
  
  try {
    // Basic stats for dashboard
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Revenue accounts (Type REVENUE)
    const revenueAccounts = await prisma.account.findMany({
      where: { companyId, type: "REVENUE" }
    });
    
    // Expense accounts (Type EXPENSE)
    const expenseAccounts = await prisma.account.findMany({
      where: { companyId, type: "EXPENSE" }
    });

    const revenueAccountIds = revenueAccounts.map(a => a.id);
    const expenseAccountIds = expenseAccounts.map(a => a.id);

    // Current month revenue
    const currentMonthRevenue = await prisma.journalLine.aggregate({
      where: {
        accountId: { in: revenueAccountIds },
        entry: { companyId, date: { gte: firstDayOfMonth }, status: "POSTED" }
      },
      _sum: { credit: true, debit: true }
    });

    // Current month expenses
    const currentMonthExpenses = await prisma.journalLine.aggregate({
      where: {
        accountId: { in: expenseAccountIds },
        entry: { companyId, date: { gte: firstDayOfMonth }, status: "POSTED" }
      },
      _sum: { debit: true, credit: true }
    });

    const revenue = (currentMonthRevenue._sum.credit || 0) - (currentMonthRevenue._sum.debit || 0);
    const expenses = (currentMonthExpenses._sum.debit || 0) - (currentMonthExpenses._sum.credit || 0);

    // Monthly flow data for charts (mocked last 6 months based on current DB)
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
    const flowData = months.map(m => ({
      name: m,
      ingresos: Math.floor(Math.random() * 50000) + 20000,
      gastos: Math.floor(Math.random() * 30000) + 10000,
    }));

    return NextResponse.json({
      kpis: {
        revenue,
        expenses,
        netIncome: revenue - expenses,
        receivables: 15000, // Placeholder
        payables: 8000 // Placeholder
      },
      flowData
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
