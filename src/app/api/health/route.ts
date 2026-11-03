import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "healthy",
        app: "Veltrix ERP",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "degraded",
        app: "Veltrix ERP",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
        database: "unreachable",
        error: error?.message || "Database connection error",
      },
      { status: 503 }
    );
  }
}

