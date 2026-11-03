import { prisma } from "../prisma";

export interface JournalLineInput {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalEntryInput {
  companyId: string;
  date: Date;
  description: string;
  reference?: string;
  type?: string;
  periodId?: string;
  createdById?: string;
  lines: JournalLineInput[];
}

export class AccountingEngine {
  /**
   * Registers a new double-entry journal entry.
   * Ensures that debits equal credits before saving.
   */
  static async createJournalEntry(input: JournalEntryInput) {
    // 1. Validation: Double Entry Principle (Debits = Credits)
    const totalDebits = input.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = input.lines.reduce((sum, line) => sum + line.credit, 0);

    // Using a small epsilon to account for floating point inaccuracies
    if (Math.abs(totalDebits - totalCredits) > 0.001) {
      throw new Error(`Asiento desbalanceado. Débitos: ${totalDebits.toFixed(2)}, Créditos: ${totalCredits.toFixed(2)}`);
    }

    if (totalDebits === 0 && totalCredits === 0) {
      throw new Error("El asiento debe tener valores mayores a 0.");
    }

    // 2. Get next entry number for company
    const lastEntry = await prisma.journalEntry.findFirst({
      where: { companyId: input.companyId },
      orderBy: { number: "desc" },
    });
    const nextNumber = (lastEntry?.number ?? 0) + 1;

    // 3. Transaction: Save entry and lines atomically
    const entry = await prisma.$transaction(async (tx) => {
      const journalEntry = await tx.journalEntry.create({
        data: {
          companyId: input.companyId,
          number: nextNumber,
          date: input.date,
          description: input.description,
          reference: input.reference,
          type: input.type || "MANUAL",
          status: "POSTED",
          periodId: input.periodId,
          createdById: input.createdById,
          lines: {
            create: input.lines.map((line) => ({
              accountId: line.accountId,
              description: line.description,
              debit: line.debit,
              credit: line.credit,
            })),
          },
        },
        include: {
          lines: { include: { account: true } },
        },
      });

      return journalEntry;
    });

    return entry;
  }

  /**
   * Calculates the balance of an account up to a certain date.
   */
  static async getAccountBalance(accountId: string, upToDate?: Date) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error("Account not found");

    const dateFilter = upToDate ? { lte: upToDate } : undefined;

    const lines = await prisma.journalLine.findMany({
      where: {
        accountId: accountId,
        entry: {
          status: "POSTED",
          date: dateFilter,
        },
      },
    });

    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

    // Balance depends on account type:
    // ASSET, EXPENSE increase with debit
    // LIABILITY, EQUITY, REVENUE increase with credit
    if (account.type === "ASSET" || account.type === "EXPENSE") {
      return totalDebit - totalCredit;
    } else {
      return totalCredit - totalDebit;
    }
  }

  /**
   * Create a draft journal entry (for review before posting)
   */
  static async createDraftEntry(input: JournalEntryInput) {
    const totalDebits = input.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = input.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.001) {
      throw new Error(`Asiento desbalanceado. Débitos: ${totalDebits.toFixed(2)}, Créditos: ${totalCredits.toFixed(2)}`);
    }

    const lastEntry = await prisma.journalEntry.findFirst({
      where: { companyId: input.companyId },
      orderBy: { number: "desc" },
    });
    const nextNumber = (lastEntry?.number ?? 0) + 1;

    return prisma.journalEntry.create({
      data: {
        companyId: input.companyId,
        number: nextNumber,
        date: input.date,
        description: input.description,
        reference: input.reference,
        type: input.type || "MANUAL",
        status: "DRAFT",
        createdById: input.createdById,
        lines: {
          create: input.lines.map((line) => ({
            accountId: line.accountId,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  /**
   * Post a draft journal entry
   */
  static async postEntry(entryId: string) {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: entryId },
      include: { lines: true },
    });

    if (!entry) throw new Error("Asiento no encontrado");
    if (entry.status === "POSTED") throw new Error("El asiento ya está asentado");

    return prisma.journalEntry.update({
      where: { id: entryId },
      data: { status: "POSTED" },
    });
  }
}
