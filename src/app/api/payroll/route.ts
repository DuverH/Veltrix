import { NextRequest, NextResponse } from "next/server";
import { PayrollService } from "@/lib/payroll/payroll-service";

// GET /api/payroll?period=2026-02
export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") || "2026-02";
  const days = parseInt(request.nextUrl.searchParams.get("days") || "30");

  try {
    const settlement = PayrollService.settleFullPayroll(period, days);
    return NextResponse.json(settlement);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error calculando nómina";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// POST /api/payroll
export async function POST(request: NextRequest) {
  const body = await request.json();
  const companyId = body.companyId || "default";

  try {
    // 1. Contabilizar en libro diario
    if (body.action === "post-journal") {
      const settlement = PayrollService.settleFullPayroll(body.period || "2026-02");
      const entry = await PayrollService.postPayrollEntry(companyId, settlement);
      return NextResponse.json({ success: true, entry });
    }

    // 2. Liquidación individual con novedades
    if (body.action === "settle-single") {
      const item = PayrollService.settleEmployee(
        body.employee,
        body.daysWorked || 30,
        body.overtime || {},
        body.period || "2026-02"
      );
      return NextResponse.json(item);
    }

    // 3. Descargar XML DIAN
    if (body.action === "get-dian-xml") {
      const item = PayrollService.settleEmployee(body.employee, 30, {}, body.period || "2026-02");
      const xml = PayrollService.generateDianPayrollXML(item, body.period || "2026-02");
      return new NextResponse(xml, {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="nomina_${item.employee.docNumber}_${body.period}.xml"`,
        },
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error procesando nómina";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
