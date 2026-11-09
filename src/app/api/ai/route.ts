/**
 * @file route.ts
 * @description Endpoint API unificado para servicios de Inteligencia Artificial Contable (Veltrix AI).
 *
 * Acciones soportadas vía método POST:
 *   - `ocr_parse`: Extracción y clasificación automática de facturas de compra (OCR / UBL 2.1).
 *   - `post_ocr_invoice`: Asienta la factura procesada en el Libro Diario y registra la Cuenta por Pagar.
 *   - `cfo_query`: Consulta analítica en lenguaje natural al Director Financiero Virtual (AI CFO).
 *   - `natural_entry`: Generación de propuesta de asiento contable de partida doble en lenguaje natural.
 *   - `post_natural_entry`: Registra el asiento contable propuesto en el Libro Diario.
 *   - `audit_anomalies`: Escaneo proactivo de anomalías contables y riesgos de evasión.
 */

import { NextRequest, NextResponse } from "next/server";
import { AIAccountingService } from "@/lib/ai/ai-accounting-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: "Empresa Demo S.A.S.",
          taxId: "901.234.567-8",
        },
      });
    }

    if (action === "ocr_parse") {
      const { text } = body;
      const parsed = AIAccountingService.parseInvoiceText(text || "");
      return NextResponse.json({ success: true, data: parsed });
    }

    if (action === "post_ocr_invoice") {
      const { invoiceData } = body;
      const result = await AIAccountingService.postOcrInvoice(company.id, invoiceData);
      return NextResponse.json({ success: true, result });
    }

    if (action === "cfo_query") {
      const { question } = body;
      const result = await AIAccountingService.queryCfoBot(company.id, question || "");
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "natural_entry") {
      const text = body.text || body.description || "";
      const result = await AIAccountingService.generateNaturalEntry(company.id, text);
      return NextResponse.json({ success: true, data: result });
    }

    if (action === "post_natural_entry") {
      const { entryData } = body;
      const { AccountingEngine } = await import("@/lib/accounting/double-entry");

      const created = await AccountingEngine.createJournalEntry({
        companyId: company.id,
        date: new Date(),
        description: entryData.description,
        reference: entryData.reference,
        type: "MANUAL",
        lines: entryData.lines.map((l: any) => ({
          accountId: l.accountId,
          description: l.description,
          debit: l.debit || 0,
          credit: l.credit || 0,
        })),
      });

      return NextResponse.json({ success: true, entry: created });
    }

    if (action === "audit_anomalies") {
      const result = await AIAccountingService.auditAnomalies(company.id);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/ai error:", error);
    return NextResponse.json({ error: error.message || "Error en servicio de IA" }, { status: 500 });
  }
}
