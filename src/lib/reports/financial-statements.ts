import { prisma } from "../prisma";

export interface IncomeStatementData {
  revenue: { accountCode: string; name: string; amount: number }[];
  expenses: { accountCode: string; name: string; amount: number }[];
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netIncome: number;
  period: string;
}

export interface BalanceSheetData {
  assets: {
    current: { name: string; amount: number }[];
    nonCurrent: { name: string; amount: number }[];
    totalCurrent: number;
    totalNonCurrent: number;
    total: number;
  };
  liabilities: {
    current: { name: string; amount: number }[];
    nonCurrent: { name: string; amount: number }[];
    totalCurrent: number;
    totalNonCurrent: number;
    total: number;
  };
  equity: {
    items: { name: string; amount: number }[];
    total: number;
  };
  asOf: string;
}

export interface CashFlowData {
  operating: { description: string; amount: number }[];
  investing: { description: string; amount: number }[];
  financing: { description: string; amount: number }[];
  totalOperating: number;
  totalInvesting: number;
  totalFinancing: number;
  netChange: number;
  period: string;
}

export class FinancialReportsService {
  /**
   * Generate Income Statement (Estado de Resultados)
   */
  static async getIncomeStatement(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IncomeStatementData> {
    const accounts = await prisma.account.findMany({
      where: {
        companyId,
        type: { in: ["REVENUE", "EXPENSE"] },
        isActive: true,
        allowsEntry: true,
      },
      include: {
        lines: {
          where: {
            entry: {
              companyId,
              status: "POSTED",
              date: { gte: startDate, lte: endDate },
            },
          },
        },
      },
      orderBy: { code: "asc" },
    });

    const revenue = accounts
      .filter((a) => a.type === "REVENUE")
      .map((a) => ({
        accountCode: a.code,
        name: a.name,
        amount: a.lines.reduce((s, l) => s + l.credit - l.debit, 0),
      }))
      .filter((a) => a.amount !== 0);

    const expenses = accounts
      .filter((a) => a.type === "EXPENSE")
      .map((a) => ({
        accountCode: a.code,
        name: a.name,
        amount: a.lines.reduce((s, l) => s + l.debit - l.credit, 0),
      }))
      .filter((a) => a.amount !== 0);

    const totalRevenue = revenue.reduce((s, a) => s + a.amount, 0);
    const totalExpenses = expenses.reduce((s, a) => s + a.amount, 0);
    const grossProfit = totalRevenue - totalExpenses;
    const netIncome = grossProfit;

    const period = `${startDate.toLocaleDateString("es-CO")} - ${endDate.toLocaleDateString("es-CO")}`;

    return {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      grossProfit,
      netIncome,
      period,
    };
  }

  /**
   * Generate Balance Sheet (Balance General)
   */
  static async getBalanceSheet(
    companyId: string,
    asOf: Date
  ): Promise<BalanceSheetData> {
    const accounts = await prisma.account.findMany({
      where: {
        companyId,
        type: { in: ["ASSET", "LIABILITY", "EQUITY"] },
        isActive: true,
        allowsEntry: true,
      },
      include: {
        lines: {
          where: {
            entry: {
              companyId,
              status: "POSTED",
              date: { lte: asOf },
            },
          },
        },
      },
      orderBy: { code: "asc" },
    });

    const getBalance = (account: (typeof accounts)[0]) => {
      const debits = account.lines.reduce((s, l) => s + l.debit, 0);
      const credits = account.lines.reduce((s, l) => s + l.credit, 0);
      if (account.type === "ASSET") return debits - credits;
      return credits - debits;
    };

    const assetAccounts = accounts.filter((a) => a.type === "ASSET" && getBalance(a) !== 0);
    const liabilityAccounts = accounts.filter((a) => a.type === "LIABILITY" && getBalance(a) !== 0);
    const equityAccounts = accounts.filter((a) => a.type === "EQUITY" && getBalance(a) !== 0);

    const currentAssets = assetAccounts
      .filter((a) => a.subtype === "CURRENT_ASSET" || a.code.startsWith("1"))
      .map((a) => ({ name: a.name, amount: getBalance(a) }));

    const nonCurrentAssets = assetAccounts
      .filter((a) => a.subtype === "FIXED_ASSET" || a.code.startsWith("15") || a.code.startsWith("16"))
      .map((a) => ({ name: a.name, amount: getBalance(a) }));

    // If no subtype classification, put everything in current
    const classifiedAssets = new Set([...currentAssets, ...nonCurrentAssets].map(a => a.name));
    const unclassifiedAssets = assetAccounts
      .filter(a => !classifiedAssets.has(a.name))
      .map(a => ({ name: a.name, amount: getBalance(a) }));
    
    currentAssets.push(...unclassifiedAssets);

    const currentLiabilities = liabilityAccounts
      .filter((a) => a.subtype === "CURRENT_LIABILITY" || a.code.startsWith("2"))
      .map((a) => ({ name: a.name, amount: getBalance(a) }));

    const nonCurrentLiabilities = liabilityAccounts
      .filter((a) => a.subtype === "LONG_TERM_LIABILITY" || a.code.startsWith("27") || a.code.startsWith("28"))
      .map((a) => ({ name: a.name, amount: getBalance(a) }));

    // unclassified liabilities → current
    const classifiedLiabilities = new Set([...currentLiabilities, ...nonCurrentLiabilities].map(l => l.name));
    const unclassifiedLiabilities = liabilityAccounts
      .filter(a => !classifiedLiabilities.has(a.name))
      .map(a => ({ name: a.name, amount: getBalance(a) }));
    
    currentLiabilities.push(...unclassifiedLiabilities);

    const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.amount, 0);
    const totalNonCurrentAssets = nonCurrentAssets.reduce((s, a) => s + a.amount, 0);
    const totalCurrentLiabilities = currentLiabilities.reduce((s, a) => s + a.amount, 0);
    const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce((s, a) => s + a.amount, 0);
    const totalEquity = equityAccounts.reduce((a, acc) => a + getBalance(acc), 0);

    return {
      assets: {
        current: currentAssets,
        nonCurrent: nonCurrentAssets,
        totalCurrent: totalCurrentAssets,
        totalNonCurrent: totalNonCurrentAssets,
        total: totalCurrentAssets + totalNonCurrentAssets,
      },
      liabilities: {
        current: currentLiabilities,
        nonCurrent: nonCurrentLiabilities,
        totalCurrent: totalCurrentLiabilities,
        totalNonCurrent: totalNonCurrentLiabilities,
        total: totalCurrentLiabilities + totalNonCurrentLiabilities,
      },
      equity: {
        items: equityAccounts.map((a) => ({ name: a.name, amount: getBalance(a) })),
        total: totalEquity,
      },
      asOf: asOf.toLocaleDateString("es-CO"),
    };
  }

  /**
   * Generate Cash Flow Statement (simplified indirect method)
   */
  static async getCashFlow(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowData> {
    // Get net income from income statement
    const incomeStatement = await this.getIncomeStatement(companyId, startDate, endDate);

    // Get all journal entries in the period grouped by type
    const entries = await prisma.journalEntry.findMany({
      where: {
        companyId,
        status: "POSTED",
        date: { gte: startDate, lte: endDate },
      },
      include: {
        lines: { include: { account: true } },
      },
    });

    // Simplified cash flow: categorize by account type
    const operating = [
      { description: "Utilidad Neta del Período", amount: incomeStatement.netIncome },
    ];

    const investing: { description: string; amount: number }[] = [];
    const financing: { description: string; amount: number }[] = [];

    // Add changes in working capital
    const arEntries = entries.flatMap((e) =>
      e.lines.filter((l) => l.account.name.toLowerCase().includes("cobrar"))
    );
    const apEntries = entries.flatMap((e) =>
      e.lines.filter((l) => l.account.name.toLowerCase().includes("pagar"))
    );

    const arChange = arEntries.reduce((s, l) => s + l.credit - l.debit, 0);
    const apChange = apEntries.reduce((s, l) => s + l.debit - l.credit, 0);

    if (arChange !== 0) operating.push({ description: "Variación Cuentas por Cobrar", amount: arChange });
    if (apChange !== 0) operating.push({ description: "Variación Cuentas por Pagar", amount: apChange });

    // Asset purchases → investing
    const assetEntries = entries.filter((e) => e.type === "DEPRECIATION");
    if (assetEntries.length > 0) {
      const depreciationTotal = assetEntries.flatMap(e => e.lines).reduce((s, l) => s + l.debit, 0);
      operating.push({ description: "Depreciación y Amortización", amount: depreciationTotal });
    }

    const totalOperating = operating.reduce((s, i) => s + i.amount, 0);
    const totalInvesting = investing.reduce((s, i) => s + i.amount, 0);
    const totalFinancing = financing.reduce((s, i) => s + i.amount, 0);
    const netChange = totalOperating + totalInvesting + totalFinancing;

    return {
      operating,
      investing,
      financing,
      totalOperating,
      totalInvesting,
      totalFinancing,
      netChange,
      period: `${startDate.toLocaleDateString("es-CO")} - ${endDate.toLocaleDateString("es-CO")}`,
    };
  }

  /**
   * Get KPI metrics for dashboard
   */
  static async getDashboardKPIs(companyId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [monthlyIncome, yearlyIncome, pendingAR, pendingAP] = await Promise.all([
      prisma.invoice.aggregate({
        where: { companyId, type: "RECEIVABLE", status: { in: ["ISSUED", "PARTIAL"] }, date: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { companyId, type: "RECEIVABLE", status: { in: ["ISSUED", "PARTIAL"] }, date: { gte: startOfYear } },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { companyId, type: "RECEIVABLE", status: { in: ["ISSUED", "PARTIAL"] } },
        _sum: { total: true, paidAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { companyId, type: "PAYABLE", status: { in: ["ISSUED", "PARTIAL"] } },
        _sum: { total: true, paidAmount: true },
      }),
    ]);

    const arPending = (pendingAR._sum.total ?? 0) - (pendingAR._sum.paidAmount ?? 0);
    const apPending = (pendingAP._sum.total ?? 0) - (pendingAP._sum.paidAmount ?? 0);

    const journalCount = await prisma.journalEntry.count({
      where: { companyId, date: { gte: startOfMonth } },
    });

    const overdueInvoices = await prisma.invoice.count({
      where: {
        companyId,
        type: "RECEIVABLE",
        status: { in: ["ISSUED", "PARTIAL"] },
        dueDate: { lt: now },
      },
    });

    return {
      monthlyRevenue: monthlyIncome._sum.total ?? 0,
      yearlyRevenue: yearlyIncome._sum.total ?? 0,
      accountsReceivable: arPending,
      accountsPayable: apPending,
      journalEntriesThisMonth: journalCount,
      overdueInvoices,
    };
  }
}
