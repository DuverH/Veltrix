import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/lib/system/audit-service";

// GET /api/audit?companyId=xxx&verify=true
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId") || "default";
  const verify = request.nextUrl.searchParams.get("verify");

  try {
    if (verify === "true") {
      const integrity = await AuditService.verifyIntegrity(companyId);
      return NextResponse.json(integrity);
    }

    const logs = await AuditService.getLogs(companyId);
    return NextResponse.json(logs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
