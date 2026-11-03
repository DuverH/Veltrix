import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccountingEngine } from "@/lib/accounting/double-entry";
import { LedgerService } from "@/lib/accounting/ledger";

// GET /api/journal?companyId=xxx&view=trial-balance|ledger|entries
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId") || "default";
  const view = request.nextUrl.searchParams.get("view");
  const accountId = request.nextUrl.searchParams.get("accountId");
  const status = request.nextUrl.searchParams.get("status");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "100");

  const startParam = request.nextUrl.searchParams.get("start");
  const endParam = request.nextUrl.searchParams.get("end");

  const now = new Date();
  const startDate = startParam ? new Date(startParam) : new Date(now.getFullYear(), 0, 1);
  const endDate = endParam ? new Date(endParam) : new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  try {
    // 1. Balanza de Comprobación (Trial Balance)
    if (view === "trial-balance") {
      const trialBalance = await LedgerService.getTrialBalance(companyId, startDate, endDate);
      return NextResponse.json(trialBalance);
    }

    // 2. Libro Mayor por Cuenta (Account Ledger)
    if (view === "ledger" && accountId) {
      const movements = await LedgerService.getAccountLedger(accountId, startDate, endDate);
      return NextResponse.json(movements);
    }

    // 3. Libro Diario General (Journal Entries)
    const entries = await prisma.journalEntry.findMany({
      where: {
        companyId,
        ...(status ? { status } : {}),
      },
      include: {
        lines: { include: { account: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { number: "desc" },
      take: limit,
    });

    return NextResponse.json(entries);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al consultar registros contables";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/journal
export async function POST(request: NextRequest) {
  const body = await request.json();
  const companyId = body.companyId || "default";

  try {
    const entry = body.draft
      ? await AccountingEngine.createDraftEntry({
          companyId,
          date: new Date(body.date),
          description: body.description,
          reference: body.reference,
          type: body.type || "MANUAL",
          lines: body.lines,
        })
      : await AccountingEngine.createJournalEntry({
          companyId,
          date: new Date(body.date),
          description: body.description,
          reference: body.reference,
          type: body.type || "MANUAL",
          lines: body.lines,
        });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error procesando el asiento contable";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
