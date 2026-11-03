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

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/ai error:", error);
    return NextResponse.json({ error: error.message || "Error en servicio de IA" }, { status: 500 });
  }
}
