import { NextRequest, NextResponse } from "next/server";
import { ProductionCostService } from "@/lib/accounting/production-costs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  try {
    const cost = await ProductionCostService.addCost(id, {
      type: body.type,
      description: body.description,
      quantity: body.quantity,
      unitCost: body.unitCost,
    });
    return NextResponse.json(cost, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
