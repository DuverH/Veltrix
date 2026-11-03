import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccountingEngine } from "@/lib/accounting/double-entry";
import { createHash } from "crypto";

// GET /api/invoices?companyId=xxx&type=RECEIVABLE
export async function GET(request: NextRequest) {
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: { name: "Empresa Demo S.A.S.", taxId: "901.234.567-8" },
    });
  }

  const type = request.nextUrl.searchParams.get("type");
  const status = request.nextUrl.searchParams.get("status");

  const invoices = await prisma.invoice.findMany({
    where: {
      companyId: company.id,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      contact: true,
      lines: true,
      payments: true,
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(invoices);
}

// POST /api/invoices
export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: { name: "Empresa Demo S.A.S.", taxId: "901.234.567-8" },
      });
    }
    const companyId = company.id;

    const isSupportDoc = body.type === "SUPPORT_DOCUMENT";

    // Prefijo y consecutivo
    let prefix = isSupportDoc ? "DSE" : "FAC";
    const count = await prisma.invoice.count({
      where: { companyId, type: body.type },
    });
    const nextNum = count + 1;
    const invoiceNumber = `${prefix}-${String(nextNum).padStart(4, "0")}`;

    // Calculate totals
    const subtotal = body.lines.reduce(
      (s: number, l: { quantity: number; unitPrice: number; discount?: number }) => {
        return s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * (1 - (Number(l.discount) || 0) / 100);
      },
      0
    );

    const taxAmount = body.lines.reduce(
      (s: number, l: { quantity: number; unitPrice: number; discount?: number; taxRate?: number }) => {
        const lineSubtotal = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * (1 - (Number(l.discount) || 0) / 100);
        return s + lineSubtotal * ((Number(l.taxRate) || 0) / 100);
      },
      0
    );

    const retefuenteRate = Number(body.retefuenteRate) || 0;
    const retefuenteAmount = Math.round(subtotal * (retefuenteRate / 100));

    // Para Documento Soporte, el total neto es subtotal - retenciones
    const total = isSupportDoc ? subtotal - retefuenteAmount : subtotal + taxAmount;

    let cudsOrCufe: string | null = null;
    let xmlData: string | null = null;

    if (body.issue) {
      if (isSupportDoc) {
        // Generar CUDS (Código Único de Documento Soporte) según Res. DIAN 000167
        const rawCuds = `${invoiceNumber}|${body.date}|${subtotal}|${company.taxId}|${body.contactId || "NO_OBLIGADO"}|${Date.now()}`;
        cudsOrCufe = createHash("sha384").update(rawCuds).digest("hex").toUpperCase();

        xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1: Documento Soporte en Adquisiciones Efectuadas a Sujetos No Obligados a Facturar (Resolución 000167)</cbc:ProfileID>
  <cbc:ID>${invoiceNumber}</cbc:ID>
  <cbc:UUID schemeName="CUDS-SHA384">${cudsOrCufe}</cbc:UUID>
  <cbc:IssueDate>${body.date}</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:RegistrationName>${company.name}</cbc:RegistrationName>
        <cbc:CompanyID schemeAgencyID="195">${company.taxId}</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${subtotal}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">0</cbc:TaxExclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
      } else {
        // Factura Electrónica estándar CUFE
        const rawCufe = `${invoiceNumber}|${body.date}|${subtotal}|${taxAmount}|${total}|${company.taxId}|${Date.now()}`;
        cudsOrCufe = createHash("sha384").update(rawCufe).digest("hex").toUpperCase();
        xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>${invoiceNumber}</cbc:ID>
  <cbc:UUID schemeName="CUFE-SHA384">${cudsOrCufe}</cbc:UUID>
  <cbc:IssueDate>${body.date}</cbc:IssueDate>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="COP">${total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
      }
    }

    // Contabilizar automáticamente en Libro Diario si es Documento Soporte
    let journalEntryId: string | null = null;
    if (isSupportDoc) {
      const expenseAcc = await prisma.account.findFirst({
        where: { companyId, OR: [{ code: { startsWith: "51" } }, { code: { startsWith: "52" } }] },
      });
      const retefuenteAcc = await prisma.account.findFirst({
        where: { companyId, code: { startsWith: "2365" } },
      });
      const payableAcc = await prisma.account.findFirst({
        where: { companyId, OR: [{ code: { startsWith: "2335" } }, { code: { startsWith: "2205" } }] },
      });

      if (expenseAcc && payableAcc) {
        const lines = [
          {
            accountId: expenseAcc.id,
            description: `Gasto por servicios no obligados - Ref ${invoiceNumber}`,
            debit: subtotal,
            credit: 0,
          },
          ...(retefuenteAmount > 0 && retefuenteAcc
            ? [
                {
                  accountId: retefuenteAcc.id,
                  description: `Retención en la fuente practicada (${retefuenteRate}%)`,
                  debit: 0,
                  credit: retefuenteAmount,
                },
              ]
            : []),
          {
            accountId: payableAcc.id,
            description: `Cuentas por pagar sujeto no obligado - Ref ${invoiceNumber}`,
            debit: 0,
            credit: total,
          },
        ];

        const entry = await AccountingEngine.createJournalEntry({
          companyId,
          date: new Date(body.date),
          description: `Documento Soporte Electrónico ${invoiceNumber} - No Obligados a Facturar`,
          reference: invoiceNumber,
          type: "MANUAL",
          lines,
        });
        journalEntryId = entry.id;
      }
    }

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        date: new Date(body.date),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        type: body.type,
        status: body.issue ? "ISSUED" : "DRAFT",
        subtotal,
        taxAmount,
        discountAmt: retefuenteAmount,
        total,
        paidAmount: 0,
        notes: body.notes,
        contactId: body.contactId || null,
        companyId,
        cufe: cudsOrCufe,
        xmlData,
        journalEntryId,
        lines: {
          create: body.lines.map((l: { description: string; quantity: number; unitPrice: number; discount?: number; taxRate?: number }) => ({
            description: l.description,
            quantity: Number(l.quantity) || 1,
            unitPrice: Number(l.unitPrice) || 0,
            discount: Number(l.discount) || 0,
            taxRate: Number(l.taxRate) || 0,
            total: (Number(l.quantity) || 1) * (Number(l.unitPrice) || 0),
          })),
        },
      },
      include: { lines: true, contact: true },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/invoices error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
