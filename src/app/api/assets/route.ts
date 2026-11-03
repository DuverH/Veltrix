import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AssetAutomation } from "@/lib/automation/depreciation";

// GET /api/assets?companyId=xxx
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId") || "default";

  const assets = await prisma.fixedAsset.findMany({
    where: { companyId },
    include: { depreciationHistory: { orderBy: { runDate: "desc" }, take: 5 } },
    orderBy: { acquisitionDate: "desc" },
  });

  return NextResponse.json(
    assets.map((a) => ({
      ...a,
      netBookValue: a.cost - a.accumulatedDep,
      depreciationProgress: (a.accumulatedDep / a.cost) * 100,
    }))
  );
}

// POST /api/assets
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Handle depreciation run
  if (body.action === "run-depreciation") {
    try {
      const total = await AssetAutomation.runMonthlyDepreciation(
        body.companyId,
        new Date(body.date)
      );
      return NextResponse.json({ success: true, totalDepreciation: total });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const asset = await prisma.fixedAsset.create({
    data: {
      code: body.code,
      name: body.name,
      description: body.description,
      category: body.category || "EQUIPMENT",
      acquisitionDate: new Date(body.acquisitionDate),
      cost: body.cost,
      salvageValue: body.salvageValue || 0,
      usefulLifeYears: body.usefulLifeYears || 5,
      depreciationMethod: body.depreciationMethod || "STRAIGHT_LINE",
      depreciationRate: body.depreciationRate,
      location: body.location,
      companyId: body.companyId,
    },
  });

  return NextResponse.json(asset, { status: 201 });
}
