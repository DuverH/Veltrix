import { prisma } from "../prisma";
import { AccountingEngine } from "./double-entry";

export class ClosingService {
  /**
   * Close an accounting period: transfer net income/loss to retained earnings
   */
  static async closePeriod(
    companyId: string,
    period: string,
    userId?: string
  ): Promise<{ success: boolean; netResult: number }> {
    // Check if period is already closed
    const existing = await prisma.closingPeriod.findUnique({
      where: { period_companyId: { period, companyId } },
    });

    if (existing?.status === "CLOSED") {
      throw new Error(`El período ${period} ya está cerrado.`);
    }

    // Get period date range
    const [year, month] = period.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all revenue and expense accounts
    const revenueLines = await prisma.journalLine.findMany({
      where: {
        account: { companyId, type: "REVENUE" },
        entry: { companyId, status: "POSTED", date: { gte: startDate, lte: endDate } },
      },
      include: { account: true },
    });

    const expenseLines = await prisma.journalLine.findMany({
      where: {
        account: { companyId, type: "EXPENSE" },
        entry: { companyId, status: "POSTED", date: { gte: startDate, lte: endDate } },
      },
      include: { account: true },
    });

    const totalRevenue = revenueLines.reduce((s, l) => s + l.credit - l.debit, 0);
    const totalExpenses = expenseLines.reduce((s, l) => s + l.debit - l.credit, 0);
    const netResult = totalRevenue - totalExpenses;

    // Find or create the period record
    const closingPeriod = await prisma.closingPeriod.upsert({
      where: { period_companyId: { period, companyId } },
      create: { period, companyId, status: "OPEN" },
      update: {},
    });

    // Create closing entry: zero out revenue and expense accounts
    const closingLines: { accountId: string; debit: number; credit: number }[] = [];

    // Consolidate revenue by account
    const revenueByAccount = new Map<string, { accountId: string; total: number }>();
    for (const line of revenueLines) {
      const existing = revenueByAccount.get(line.accountId) || { accountId: line.accountId, total: 0 };
      existing.total += line.credit - line.debit;
      revenueByAccount.set(line.accountId, existing);
    }

    // Consolidate expenses by account
    const expenseByAccount = new Map<string, { accountId: string; total: number }>();
    for (const line of expenseLines) {
      const existing = expenseByAccount.get(line.accountId) || { accountId: line.accountId, total: 0 };
      existing.total += line.debit - line.credit;
      expenseByAccount.set(line.accountId, existing);
    }

    // Revenue accounts: debit to close
    for (const [, data] of revenueByAccount) {
      if (data.total > 0) {
        closingLines.push({ accountId: data.accountId, debit: data.total, credit: 0 });
      }
    }

    // Expense accounts: credit to close
    for (const [, data] of expenseByAccount) {
      if (data.total > 0) {
        closingLines.push({ accountId: data.accountId, debit: 0, credit: data.total });
      }
    }

    // Find retained earnings account (EQUITY type with 'utilidades' or 'retenidas')
    const retainedEarningsAccount = await prisma.account.findFirst({
      where: {
        companyId,
        type: "EQUITY",
        OR: [
          { name: { contains: "utilidad" } },
          { name: { contains: "retenid" } },
          { name: { contains: "resultado" } },
          { code: { startsWith: "3" } },
        ],
      },
    });

    if (retainedEarningsAccount && closingLines.length > 0) {
      // Add the balancing line to retained earnings
      if (netResult > 0) {
        closingLines.push({ accountId: retainedEarningsAccount.id, debit: 0, credit: netResult });
      } else if (netResult < 0) {
        closingLines.push({ accountId: retainedEarningsAccount.id, debit: Math.abs(netResult), credit: 0 });
      }

      // Create the closing journal entry
      await AccountingEngine.createJournalEntry({
        companyId,
        date: endDate,
        description: `Cierre contable del período ${period}`,
        lines: closingLines,
        type: "CLOSING",
        periodId: closingPeriod.id,
      });
    }

    // Mark period as closed
    await prisma.closingPeriod.update({
      where: { period_companyId: { period, companyId } },
      data: { status: "CLOSED", closedAt: new Date(), closedBy: userId },
    });

    return { success: true, netResult };
  }

  /**
   * Get list of open/closed periods for a company
   */
  static async getPeriods(companyId: string) {
    return prisma.closingPeriod.findMany({
      where: { companyId },
      orderBy: { period: "desc" },
    });
  }

  /**
   * Check if a period is open (allows new entries)
   */
  static async isPeriodOpen(companyId: string, period: string): Promise<boolean> {
    const closingPeriod = await prisma.closingPeriod.findUnique({
      where: { period_companyId: { period, companyId } },
    });
    return !closingPeriod || closingPeriod.status === "OPEN";
  }
}
