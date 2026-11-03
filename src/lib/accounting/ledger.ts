import { prisma } from "../prisma";

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export interface LedgerMovement {
  date: Date;
  description: string;
  entryNumber: number | null;
  debit: number;
  credit: number;
  runningBalance: number;
}

export class LedgerService {
  /**
   * Get the trial balance (Balanza de Comprobación) for a company in a period
   */
  static async getTrialBalance(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<LedgerAccount[]> {
    const accounts = await prisma.account.findMany({
      where: { companyId, isActive: true },
      include: {
        lines: {
          where: {
            entry: {
              status: "POSTED",
              date: { gte: startDate, lte: endDate },
            },
          },
        },
      },
      orderBy: { code: "asc" },
    });

    return accounts
      .map((account) => {
        const debitTotal = account.lines.reduce((s, l) => s + l.debit, 0);
        const creditTotal = account.lines.reduce((s, l) => s + l.credit, 0);
        const balance =
          account.type === "ASSET" || account.type === "EXPENSE"
            ? debitTotal - creditTotal
            : creditTotal - debitTotal;

        return {
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          debitTotal,
          creditTotal,
          balance,
        };
      })
      .filter((a) => a.debitTotal !== 0 || a.creditTotal !== 0);
  }

  /**
   * Get movements for a specific account (Libro Mayor)
   */
  static async getAccountLedger(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<LedgerMovement[]> {
    const lines = await prisma.journalLine.findMany({
      where: {
        accountId,
        entry: {
          status: "POSTED",
          date: { gte: startDate, lte: endDate },
        },
      },
      include: {
        entry: true,
      },
      orderBy: {
        entry: { date: "asc" },
      },
    });

    let runningBalance = 0;
    return lines.map((line) => {
      runningBalance += line.debit - line.credit;
      return {
        date: line.entry.date,
        description: line.entry.description,
        entryNumber: line.entry.number,
        debit: line.debit,
        credit: line.credit,
        runningBalance,
      };
    });
  }

  /**
   * Get summary balances for all main account types (for reports)
   */
  static async getAccountBalances(
    companyId: string,
    asOf?: Date
  ): Promise<Record<string, number>> {
    const endDate = asOf || new Date();

    const lines = await prisma.journalLine.findMany({
      where: {
        entry: {
          companyId,
          status: "POSTED",
          date: { lte: endDate },
        },
      },
      include: {
        account: true,
      },
    });

    const balances: Record<string, number> = {
      ASSET: 0,
      LIABILITY: 0,
      EQUITY: 0,
      REVENUE: 0,
      EXPENSE: 0,
    };

    for (const line of lines) {
      const type = line.account.type;
      if (type === "ASSET" || type === "EXPENSE") {
        balances[type] += line.debit - line.credit;
      } else {
        balances[type] += line.credit - line.debit;
      }
    }

    return balances;
  }
}
