import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BankReconciliationService } from "@/lib/accounting/bank-reconciliation";

// GET /api/bank?companyId=xxx&accountId=xxx&summary=true
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId") || "default";
  const accountId = request.nextUrl.searchParams.get("accountId");
  const summary = request.nextUrl.searchParams.get("summary");
  const period = request.nextUrl.searchParams.get("period");

  try {
    if (accountId && summary === "true") {
      const recId = period ? `${accountId}-${period}` : undefined;
      const data = await BankReconciliationService.getReconciliationSummary(accountId, recId);
      return NextResponse.json(data);
    }

    if (accountId) {
      // Get transactions for a specific bank account
      const transactions = await BankReconciliationService.getTransactions(accountId);
      return NextResponse.json(transactions);
    }

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { companyId, isActive: true },
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(bankAccounts);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/bank
export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    // 1. Auto-matching engine
    if (body.action === "auto-match") {
      const results = await BankReconciliationService.autoMatchTransactions(
        body.bankAccountId,
        body.reconciliationId
      );
      return NextResponse.json(results);
    }

    // 2. Import statement via CSV
    if (body.action === "import-csv") {
      const rows = BankReconciliationService.parseCSV(body.csvContent);
      if (rows.length === 0) {
        return NextResponse.json(
          { error: "No se encontraron filas válidas en el archivo CSV." },
          { status: 400 }
        );
      }
      const imported = await BankReconciliationService.importTransactions(
        body.bankAccountId,
        rows
      );
      return NextResponse.json({ success: true, count: imported.length, transactions: imported });
    }

    // 3. Quick Bank Expense (GMF 4x1000, Comisiones, Intereses)
    if (body.action === "quick-expense") {
      const entry = await BankReconciliationService.createQuickBankExpense(
        body.bankAccountId,
        body.transactionId,
        body.expenseType || "GMF_4X1000",
        body.reconciliationId
      );
      return NextResponse.json({ success: true, entry });
    }

    // 4. Toggle Reconciled
    if (body.action === "toggle-reconcile") {
      const tx = await BankReconciliationService.toggleReconciliation(
        body.transactionId,
        body.reconciliationId
      );
      return NextResponse.json({ success: true, transaction: tx });
    }

    // 5. Open Reconciliation Period
    if (body.action === "open-reconciliation") {
      const rec = await BankReconciliationService.openReconciliation(
        body.bankAccountId,
        body.period,
        body.statementBalance
      );
      return NextResponse.json(rec);
    }

    // 6. Close Reconciliation Period
    if (body.action === "close-reconciliation") {
      const rec = await BankReconciliationService.closeReconciliation(
        body.bankAccountId,
        body.reconciliationId
      );
      return NextResponse.json(rec);
    }

    // 7. Add single transaction
    if (body.action === "add-transaction") {
      const tx = await prisma.bankTransaction.create({
        data: {
          bankAccountId: body.bankAccountId,
          date: new Date(body.date),
          description: body.description,
          amount: body.amount,
          type: body.type,
          reference: body.reference,
        },
      });

      const increment = body.type === "CREDIT" ? body.amount : -body.amount;
      await prisma.bankAccount.update({
        where: { id: body.bankAccountId },
        data: { currentBalance: { increment } },
      });

      return NextResponse.json(tx, { status: 201 });
    }

    // 8. Create bank account
    const bankAccount = await prisma.bankAccount.create({
      data: {
        name: body.name,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        accountType: body.accountType || "CHECKING",
        currency: body.currency || "COP",
        currentBalance: body.initialBalance || 0,
        companyId: body.companyId || "default",
      },
    });

    return NextResponse.json(bankAccount, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error procesando solicitud";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
