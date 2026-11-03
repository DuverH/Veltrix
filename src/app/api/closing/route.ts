import { NextRequest, NextResponse } from "next/server";
import { ClosingService } from "@/lib/accounting/closing";

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId") || "default";
  
  try {
    const periods = await ClosingService.getPeriods(companyId);
    return NextResponse.json(periods);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const companyId = body.companyId || "default";

  try {
    const result = await ClosingService.closePeriod(companyId, body.period, body.userId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
