import { NextRequest, NextResponse } from "next/server";
import { ProductionCostService } from "@/lib/accounting/production-costs";

// GET /api/production?companyId=xxx
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId") || "default";
  const boms = request.nextUrl.searchParams.get("boms");

  try {
    if (boms === "true") {
      return NextResponse.json(ProductionCostService.getBOMTemplates());
    }

    const orders = await ProductionCostService.getCompanyOrders(companyId);
    return NextResponse.json(orders);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// POST /api/production
export async function POST(request: NextRequest) {
  const body = await request.json();
  const companyId = body.companyId || "default";

  try {
    // 1. Agregar costo a orden existente
    if (body.action === "add-cost") {
      const cost = await ProductionCostService.addCost(body.orderId, {
        type: body.type,
        description: body.description,
        quantity: Number(body.quantity) || 1,
        unitCost: Number(body.unitCost) || 0,
      });
      return NextResponse.json(cost, { status: 201 });
    }

    // 2. Cerrar orden y contabilizar en inventario producto terminado
    if (body.action === "close-order") {
      const result = await ProductionCostService.closeOrder(body.orderId);
      return NextResponse.json(result);
    }

    // 3. Crear nueva orden de producción
    const order = await ProductionCostService.createOrder(companyId, {
      number: body.number,
      product: body.product,
      quantity: Number(body.quantity) || 1,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      applyBOM: Boolean(body.applyBOM),
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error procesando orden de producción";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
