import { Invoice } from "@prisma/client";
import { prisma } from "../prisma";

export class EInvoiceService {
  /**
   * Generates a unique CUFE (Código Único de Facturación Electrónica)
   * This is a mock function. In a real scenario, this involves hashing the invoice data with a digital certificate.
   */
  private static generateCUFE(invoiceId: string, total: number): string {
    const timestamp = Date.now().toString(16);
    return `CUFE-${invoiceId}-${total}-${timestamp}`.toUpperCase();
  }

  /**
   * Mocks the process of signing the XML with a digital certificate
   */
  private static async signXML(invoiceData: unknown): Promise<string> {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice>
  <Signed>true</Signed>
  <Data>${JSON.stringify(invoiceData)}</Data>
</Invoice>`;
  }

  /**
   * Issues a new electronic invoice, signs it, and sends it to the tax authority.
   */
  static async issueInvoice(companyId: string, data: {
    number: string;
    date: Date;
    dueDate?: Date;
    total: number;
    type: string;
  }): Promise<Invoice> {
    
    // 1. Create Invoice in DRAFT status
    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        number: data.number,
        date: data.date,
        dueDate: data.dueDate,
        total: data.total,
        type: data.type,
        status: "DRAFT"
      }
    });

    // 2. Generate Electronic Data (XML & CUFE)
    const xml = await this.signXML({ id: invoice.id, total: invoice.total });
    const cufe = this.generateCUFE(invoice.id, invoice.total);

    // 3. Mock transmission to Tax Authority (e.g. DIAN/SAT)
    const isAccepted = await this.transmitToTaxAuthority(xml);

    if (!isAccepted) {
      throw new Error("La factura fue rechazada por la entidad tributaria.");
    }

    // 4. Update Invoice as ISSUED
    return await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "ISSUED",
        xmlData: xml,
        cufe: cufe
      }
    });
  }

  /**
   * Mocks the API call to the Tax Authority
   */
  private static async transmitToTaxAuthority(xmlData: string): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Assume 99% success rate
    return Math.random() > 0.01; 
  }
}
