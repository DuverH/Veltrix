import { NextRequest, NextResponse } from "next/server";
import { KardexService } from "@/lib/inventory/kardex-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    const warehouseId = searchParams.get("warehouseId") || undefined;

    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "Empresa Demo S.A.S.",
          taxId: "900.876.543-1",
        },
      });
    }

    const warehouses = await KardexService.getWarehouses(company.id);
    const items = await KardexService.getItems(company.id);

    if (itemId) {
      const kardex = await KardexService.getItemKardex(itemId, warehouseId, company.id);
      return NextResponse.json({
        warehouses,
        items,
        kardex,
      });
    }

    const summary = await KardexService.getInventorySummary(company.id);

    const totalValuation = summary.reduce((s, i) => s + i.totalVal, 0);
    const lowStockAlerts = summary.filter((s) => s.isLowStock);

    return NextResponse.json({
      warehouses,
      items,
      summary,
      totalValuation,
      lowStockAlertsCount: lowStockAlerts.length,
    });
  } catch (error: any) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json({ error: error.message || "Error al cargar inventario" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, reason, warehouseId, targetWarehouseId, itemId, quantity, unitCost, referenceDoc, notes, postJournal } = body;

    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "Empresa Demo S.A.S.",
          taxId: "900.876.543-1",
        },
      });
    }

    const result = await KardexService.registerMovement(company.id, {
      type,
      reason,
      warehouseId,
      targetWarehouseId,
      itemId,
      quantity: Number(quantity),
      unitCost: unitCost ? Number(unitCost) : undefined,
      referenceDoc: referenceDoc || `MOV-${Date.now().toString().slice(-4)}`,
      notes,
      postJournal: Boolean(postJournal),
    });

    return NextResponse.json({
      success: true,
      movement: result.movement,
      journalEntry: result.journalEntry,
    });
  } catch (error: any) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json({ error: error.message || "Error al registrar movimiento" }, { status: 400 });
  }
}
