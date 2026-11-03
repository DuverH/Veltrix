import { prisma } from "../prisma";
import { AccountingEngine } from "./double-entry";

export interface BankStatementRow {
  date: Date;
  description: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  reference?: string;
}

export interface MatchResult {
  bankTransactionId: string;
  matchedJournalLineId?: string;
  confidence: number; // 0 to 100
  reason: string;
  bankTx: {
    id: string;
    date: Date;
    description: string;
    amount: number;
    type: string;
    reference?: string | null;
  };
  journalLine?: {
    id: string;
    date: Date;
    description: string | null;
    amount: number;
    accountCode: string;
    accountName: string;
  };
}

export class BankReconciliationService {
  /**
   * Parse CSV content into structured statement rows
   */
  static parseCSV(csvText: string): BankStatementRow[] {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const rows: BankStatementRow[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Format: Fecha,Descripción,Referencia,Tipo,Monto
      const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length < 5) continue;

      const [dateStr, description, reference, typeStr, amountStr] = parts;
      const parsedDate = new Date(dateStr);
      const parsedAmount = Math.abs(parseFloat(amountStr.replace(/[^0-9.-]+/g, "")));
      const type = typeStr.toUpperCase().includes("CREDIT") || typeStr.toUpperCase().includes("CRED") ? "CREDIT" : "DEBIT";

      if (!isNaN(parsedDate.getTime()) && !isNaN(parsedAmount) && parsedAmount > 0) {
        rows.push({
          date: parsedDate,
          description: description || "Movimiento Bancario",
          amount: parsedAmount,
          type,
          reference: reference || undefined,
        });
      }
    }

    return rows;
  }

  /**
   * Get all bank transactions for an account, with optional period filter
   */
  static async getTransactions(bankAccountId: string, startDate?: Date, endDate?: Date) {
    const whereClause: { bankAccountId: string; date?: { gte?: Date; lte?: Date } } = {
      bankAccountId,
    };

    if (startDate && endDate) {
      whereClause.date = { gte: startDate, lte: endDate };
    }

    return prisma.bankTransaction.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });
  }

  /**
   * Import bank transactions (from CSV or parsed statement)
   */
  static async importTransactions(
    bankAccountId: string,
    transactions: BankStatementRow[]
  ) {
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });
    if (!bankAccount) throw new Error("Cuenta bancaria no encontrada");

    const created = [];
    for (const tx of transactions) {
      const created_tx = await prisma.bankTransaction.create({
        data: {
          bankAccountId,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          reference: tx.reference,
          isReconciled: false,
        },
      });
      created.push(created_tx);
    }

    // Actualizar saldo de la cuenta bancaria
    const totalCredits = transactions
      .filter((t) => t.type === "CREDIT")
      .reduce((s, t) => s + t.amount, 0);
    const totalDebits = transactions
      .filter((t) => t.type === "DEBIT")
      .reduce((s, t) => s + t.amount, 0);

    await prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { currentBalance: { increment: totalCredits - totalDebits } },
    });

    return created;
  }

  /**
   * Create or open a reconciliation for a period
   */
  static async openReconciliation(
    bankAccountId: string,
    period: string,
    statementBalance: number
  ) {
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });
    if (!bankAccount) throw new Error("Cuenta bancaria no encontrada");

    return prisma.bankReconciliation.upsert({
      where: { id: `${bankAccountId}-${period}` },
      create: {
        id: `${bankAccountId}-${period}`,
        bankAccountId,
        period,
        statementBalance,
        bookBalance: bankAccount.currentBalance,
        status: "OPEN",
      },
      update: { statementBalance, status: "OPEN" },
    });
  }

  /**
   * Automated matching engine comparing bank transactions with accounting journal lines
   */
  static async autoMatchTransactions(
    bankAccountId: string,
    reconciliationId?: string
  ): Promise<{
    matchedCount: number;
    results: MatchResult[];
  }> {
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      include: { company: true },
    });
    if (!bankAccount) throw new Error("Cuenta bancaria no encontrada");

    // 1. Obtener transacciones bancarias no conciliadas
    const pendingBankTxs = await prisma.bankTransaction.findMany({
      where: {
        bankAccountId,
        isReconciled: false,
      },
      orderBy: { date: "asc" },
    });

    // 2. Obtener movimientos contables en la cuenta de Bancos (código '1110')
    const bankLedgerLines = await prisma.journalLine.findMany({
      where: {
        account: {
          code: { startsWith: "1110" },
          companyId: bankAccount.companyId,
        },
        entry: {
          status: "POSTED",
          companyId: bankAccount.companyId,
        },
      },
      include: {
        entry: true,
        account: true,
      },
      orderBy: { entry: { date: "asc" } },
    });

    const results: MatchResult[] = [];
    const usedJournalLineIds = new Set<string>();
    let matchedCount = 0;

    for (const bankTx of pendingBankTxs) {
      let bestMatch: { line: (typeof bankLedgerLines)[0]; confidence: number; reason: string } | null = null;

      for (const line of bankLedgerLines) {
        if (usedJournalLineIds.has(line.id)) continue;

        // En contabilidad:
        // Crédito bancario en extracto (+ plata) = Débito en libro contable
        // Débito bancario en extracto (- plata) = Crédito en libro contable
        const ledgerAmount = bankTx.type === "CREDIT" ? line.debit : line.credit;
        const amountDiff = Math.abs(bankTx.amount - ledgerAmount);

        // Si los montos coinciden exactamente
        if (amountDiff < 0.01) {
          const daysDiff = Math.abs(
            (bankTx.date.getTime() - line.entry.date.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Regla 1: Mismo monto y misma referencia
          if (
            bankTx.reference &&
            line.entry.reference &&
            bankTx.reference.toLowerCase().trim() === line.entry.reference.toLowerCase().trim()
          ) {
            bestMatch = { line, confidence: 100, reason: "Coincidencia exacta: Monto y Referencia idénticos" };
            break;
          }

          // Regla 2: Mismo monto dentro de +/- 3 días
          if (daysDiff <= 3) {
            const confidence = daysDiff === 0 ? 95 : 85;
            if (!bestMatch || confidence > bestMatch.confidence) {
              bestMatch = {
                line,
                confidence,
                reason: `Monto idéntico con diferencia de fecha de ${Math.round(daysDiff)} día(s)`,
              };
            }
          }

          // Regla 3: Mismo monto dentro de +/- 15 días
          if (daysDiff <= 15 && (!bestMatch || bestMatch.confidence < 70)) {
            bestMatch = {
              line,
              confidence: 70,
              reason: "Mismo monto con fecha cercana en el mes",
            };
          }
        }
      }

      if (bestMatch && bestMatch.confidence >= 70) {
        usedJournalLineIds.add(bestMatch.line.id);
        matchedCount++;

        // Auto marcar como conciliado si se proporcionó un reconciliationId
        if (reconciliationId) {
          await prisma.bankTransaction.update({
            where: { id: bankTx.id },
            data: { isReconciled: true, reconciledId: reconciliationId },
          });
        }

        results.push({
          bankTransactionId: bankTx.id,
          matchedJournalLineId: bestMatch.line.id,
          confidence: bestMatch.confidence,
          reason: bestMatch.reason,
          bankTx: {
            id: bankTx.id,
            date: bankTx.date,
            description: bankTx.description,
            amount: bankTx.amount,
            type: bankTx.type,
            reference: bankTx.reference,
          },
          journalLine: {
            id: bestMatch.line.id,
            date: bestMatch.line.entry.date,
            description: bestMatch.line.description || bestMatch.line.entry.description,
            amount: bankTx.type === "CREDIT" ? bestMatch.line.debit : bestMatch.line.credit,
            accountCode: bestMatch.line.account.code,
            accountName: bestMatch.line.account.name,
          },
        });
      } else {
        results.push({
          bankTransactionId: bankTx.id,
          confidence: 0,
          reason: "Sin coincidencia directa en libros. Requiere revisión o asiento manual.",
          bankTx: {
            id: bankTx.id,
            date: bankTx.date,
            description: bankTx.description,
            amount: bankTx.amount,
            type: bankTx.type,
            reference: bankTx.reference,
          },
        });
      }
    }

    return { matchedCount, results };
  }

  /**
   * 1-Click quick expense creation for Bank Fees, GMF 4x1000, or Interest
   */
  static async createQuickBankExpense(
    bankAccountId: string,
    transactionId: string,
    expenseType: "GMF_4X1000" | "BANK_FEE" | "INTEREST",
    reconciliationId?: string
  ) {
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      include: { company: true },
    });
    if (!bankAccount) throw new Error("Cuenta bancaria no encontrada");

    const tx = await prisma.bankTransaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) throw new Error("Transacción bancaria no encontrada");

    // Buscar cuentas contables: 1110 (Bancos) y 5305 (Gastos Financieros)
    const bankLedgerAccount = await prisma.account.findFirst({
      where: { companyId: bankAccount.companyId, code: { startsWith: "1110" } },
    });
    const expenseAccount = await prisma.account.findFirst({
      where: { companyId: bankAccount.companyId, code: { startsWith: "5305" } },
    });

    if (!bankLedgerAccount || !expenseAccount) {
      throw new Error("No se encontraron las cuentas contables de Bancos (1110) o Gastos Financieros (5305)");
    }

    let description = tx.description;
    if (expenseType === "GMF_4X1000") description = `GMF 4x1000 - ${tx.description}`;
    if (expenseType === "BANK_FEE") description = `Comisión Bancaria - ${tx.description}`;
    if (expenseType === "INTEREST") description = `Intereses Bancarios - ${tx.description}`;

    // Crear asiento contable:
    // Débito a Gasto Financiero (5305)
    // Crédito a Bancos (1110)
    const entry = await AccountingEngine.createJournalEntry({
      companyId: bankAccount.companyId,
      date: tx.date,
      description,
      reference: tx.reference || "GASTO-BANCARIO",
      type: "BANK",
      lines: [
        {
          accountId: expenseAccount.id,
          description: `Gasto deducible: ${description}`,
          debit: tx.amount,
          credit: 0,
        },
        {
          accountId: bankLedgerAccount.id,
          description: `Salida de ${bankAccount.bankName} - ${tx.reference || "Nota Débito"}`,
          debit: 0,
          credit: tx.amount,
        },
      ],
    });

    // Marcar la transacción bancaria como conciliada
    await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        isReconciled: true,
        reconciledId: reconciliationId,
      },
    });

    return entry;
  }

  /**
   * Mark a transaction as reconciled or unreconciled
   */
  static async toggleReconciliation(transactionId: string, reconciliationId?: string) {
    const tx = await prisma.bankTransaction.findUnique({ where: { id: transactionId } });
    if (!tx) throw new Error("Transacción no encontrada");

    return prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        isReconciled: !tx.isReconciled,
        reconciledId: !tx.isReconciled ? reconciliationId || null : null,
      },
    });
  }

  /**
   * Get reconciliation summary
   */
  static async getReconciliationSummary(bankAccountId: string, reconciliationId?: string) {
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });
    if (!bankAccount) throw new Error("Cuenta bancaria no encontrada");

    const allTxs = await prisma.bankTransaction.findMany({
      where: { bankAccountId },
    });

    const reconciledCount = allTxs.filter((t) => t.isReconciled).length;
    const unreconciledCount = allTxs.filter((t) => !t.isReconciled).length;

    const reconciledCredits = allTxs
      .filter((t) => t.isReconciled && t.type === "CREDIT")
      .reduce((s, t) => s + t.amount, 0);
    const reconciledDebits = allTxs
      .filter((t) => t.isReconciled && t.type === "DEBIT")
      .reduce((s, t) => s + t.amount, 0);

    const unreconciledCredits = allTxs
      .filter((t) => !t.isReconciled && t.type === "CREDIT")
      .reduce((s, t) => s + t.amount, 0);
    const unreconciledDebits = allTxs
      .filter((t) => !t.isReconciled && t.type === "DEBIT")
      .reduce((s, t) => s + t.amount, 0);

    let statementBalance = bankAccount.currentBalance;
    let status = "OPEN";

    if (reconciliationId) {
      const rec = await prisma.bankReconciliation.findUnique({
        where: { id: reconciliationId },
      });
      if (rec) {
        statementBalance = rec.statementBalance;
        status = rec.status;
      }
    }

    const difference = statementBalance - bankAccount.currentBalance;

    return {
      bankAccount,
      statementBalance,
      bookBalance: bankAccount.currentBalance,
      reconciledCount,
      unreconciledCount,
      totalCount: allTxs.length,
      reconciledCredits,
      reconciledDebits,
      unreconciledCredits,
      unreconciledDebits,
      difference,
      isBalanced: Math.abs(difference) < 0.01 && unreconciledCount === 0,
      status,
    };
  }

  /**
   * Close a reconciliation
   */
  static async closeReconciliation(bankAccountId: string, reconciliationId: string) {
    return prisma.bankReconciliation.update({
      where: { id: reconciliationId },
      data: { status: "CLOSED", completedAt: new Date() },
    });
  }
}
