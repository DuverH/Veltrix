import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/accounts?companyId=xxx
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId") || "default";
  
  const accounts = await prisma.account.findMany({
    where: { companyId, isActive: true },
    include: { parent: true, children: true },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(accounts);
}

// POST /api/accounts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const account = await prisma.account.create({
    data: {
      code: body.code,
      name: body.name,
      type: body.type,
      subtype: body.subtype,
      description: body.description,
      parentId: body.parentId || null,
      companyId: body.companyId,
      allowsEntry: body.allowsEntry ?? true,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
