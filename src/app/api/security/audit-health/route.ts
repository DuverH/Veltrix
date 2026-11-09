/**
 * @file route.ts (API Auditoría de Riesgos y Salud del Sistema)
 * @description Endpoint que ejecuta el escaneo de salud y detección preventiva de riesgos contables.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { riskAuditService } from "@/lib/security/risk-audit-service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/security/audit-health?companyId=xxx
 * Ejecuta la auditoría en tiempo real y retorna el informe de riesgos y score de salud.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let companyId = searchParams.get("companyId") || (session.user as any).companyId;

    if (!companyId || companyId === "default") {
      const firstCompany = await prisma.company.findFirst();
      companyId = firstCompany?.id || "default";
    }

    const report = await riskAuditService.runAudit(companyId);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al ejecutar la auditoría de riesgos", details: error?.message },
      { status: 500 }
    );
  }
}

