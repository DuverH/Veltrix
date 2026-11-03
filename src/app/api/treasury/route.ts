import { NextRequest, NextResponse } from "next/server";
import { TreasuryService } from "@/lib/treasury/cash-forecast-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "Empresa Demo S.A.S.",
          taxId: "901.234.567-8",
        },
      });
    }

    const [arAging, apAging, cashForecast] = await Promise.all([
      TreasuryService.getAgingReport(company.id, "RECEIVABLE"),
      TreasuryService.getAgingReport(company.id, "PAYABLE"),
      TreasuryService.getCashFlowForecast(company.id),
    ]);

    return NextResponse.json({
      arAging,
      apAging,
      cashForecast,
    });
  } catch (error: any) {
    console.error("GET /api/treasury error:", error);
    return NextResponse.json({ error: error.message || "Error al cargar datos de tesorería" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "Empresa Demo S.A.S.",
          taxId: "901.234.567-8",
        },
      });
    }

    if (action === "revalue_trm") {
      const { accountCode, currency, foreignBalance, bookTrm, currentTrm } = body;
      const result = await TreasuryService.revalueForeignCurrency(company.id, {
        accountCode: accountCode || "111005",
        currency: currency || "USD",
        foreignBalance: Number(foreignBalance),
        bookTrm: Number(bookTrm),
        currentTrm: Number(currentTrm),
      });

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/treasury error:", error);
    return NextResponse.json({ error: error.message || "Error al procesar reexpresión" }, { status: 500 });
  }
}
