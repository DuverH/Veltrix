import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/contacts?companyId=xxx&type=CUSTOMER
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId") || "default";
  const type = request.nextUrl.searchParams.get("type");

  const contacts = await prisma.contact.findMany({
    where: {
      companyId,
      isActive: true,
      ...(type ? { type } : {}),
    },
    include: {
      invoices: {
        where: { status: { in: ["ISSUED", "PARTIAL"] } },
        select: { total: true, paidAmount: true, type: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    contacts.map((c) => ({
      ...c,
      totalReceivable: c.invoices
        .filter((i) => i.type === "RECEIVABLE")
        .reduce((s, i) => s + i.total - i.paidAmount, 0),
      totalPayable: c.invoices
        .filter((i) => i.type === "PAYABLE")
        .reduce((s, i) => s + i.total - i.paidAmount, 0),
    }))
  );
}

// POST /api/contacts
export async function POST(request: NextRequest) {
  const body = await request.json();

  const contact = await prisma.contact.create({
    data: {
      type: body.type,
      name: body.name,
      taxId: body.taxId,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      country: body.country || "CO",
      creditLimit: body.creditLimit,
      paymentDays: body.paymentDays || 30,
      companyId: body.companyId,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
