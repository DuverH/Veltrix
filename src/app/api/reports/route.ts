import { NextRequest, NextResponse } from "next/server";
import { FinancialReportsService } from "@/lib/reports/financial-statements";
import { TaxService } from "@/lib/billing/tax-service";

// GET /api/reports?type=income-statement&companyId=xxx&start=2026-01-01&end=2026-12-31
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const companyId = request.nextUrl.searchParams.get("companyId") || "default";
  const startParam = request.nextUrl.searchParams.get("start");
  const endParam = request.nextUrl.searchParams.get("end");
  const asOfParam = request.nextUrl.searchParams.get("asOf");
  const yearParam = request.nextUrl.searchParams.get("year");

  const now = new Date();
  const startDate = startParam ? new Date(startParam) : new Date(now.getFullYear(), 0, 1);
  const endDate = endParam ? new Date(endParam) : now;
  const asOf = asOfParam ? new Date(asOfParam) : now;
  const year = yearParam ? parseInt(yearParam) : now.getFullYear();

  try {
    switch (type) {
      case "income-statement":
        return NextResponse.json(
          await FinancialReportsService.getIncomeStatement(companyId, startDate, endDate)
        );

      case "balance-sheet":
        return NextResponse.json(
          await FinancialReportsService.getBalanceSheet(companyId, asOf)
        );

      case "cash-flow":
        return NextResponse.json(
          await FinancialReportsService.getCashFlow(companyId, startDate, endDate)
        );

      case "kpis":
        return NextResponse.json(
          await FinancialReportsService.getDashboardKPIs(companyId)
        );

      case "exogena-1001": {
        const csv1001 = await TaxService.exportExogena1001CSV(companyId, year);
        return new NextResponse(csv1001, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="exogena_1001_${year}.csv"`,
          },
        });
      }

      case "exogena-1007": {
        const csv1007 = await TaxService.exportExogena1007CSV(companyId, year);
        return new NextResponse(csv1007, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="exogena_1007_${year}.csv"`,
          },
        });
      }

      default:
        return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
