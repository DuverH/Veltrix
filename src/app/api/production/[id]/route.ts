import { NextRequest, NextResponse } from "next/server";
import { ProductionCostService } from "@/lib/accounting/production-costs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const summary = await ProductionCostService.getOrderCostSummary(id);
    return NextResponse.json(summary);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  
  try {
    if (body.action === "CLOSE") {
      const order = await ProductionCostService.closeOrder(id);
      return NextResponse.json(order);
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
