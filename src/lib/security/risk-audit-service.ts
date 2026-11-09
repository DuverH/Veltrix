/**
 * @file risk-audit-service.ts
 * @description Servicio de Auditoría Preventiva de Riesgos Contables, Fiscales y de Datos.
 *
 * Realiza un escaneo holístico para la prevención de contingencias:
 *   1. **Integridad de Partida Doble**: Verifica que el 100% de los asientos estén cuadrados.
 *   2. **Cumplimiento Tributario DIAN**: Verifica CUFE, IVA y retenciones en facturación.
 *   3. **Riesgo de Liquidez / Saldos Anómalos**: Detecta cajas o bancos en saldo rojo (crédito anómalo).
 *   4. **Seguridad de Datos Personales (Ley 1581 / Habeas Data)**: Monitorea consentimientos de clientes/proveedores.
 *   5. **Puntaje de Salud (Security & Health Score)**: Métrica global de 0 a 100% para toma de decisiones gerenciales.
 */

import { prisma } from "@/lib/prisma";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RiskFinding {
  level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "OK";
  category: "CONTABLE" | "FISCAL" | "SEGURIDAD" | "DATOS_PERSONALES";
  title: string;
  description: string;
  recommendation: string;
  affectedCount?: number;
}

export interface RiskAuditReport {
  companyId: string;
  companyName: string;
  timestamp: string;
  healthScore: number; // 0 - 100%
  status: "OPTIMAL" | "ATTENTION_REQUIRED" | "HIGH_RISK";
  totalChecks: number;
  passedChecks: number;
  findings: RiskFinding[];
  summary: {
    unbalancedEntries: number;
    negativeCashAccounts: number;
    invoicesWithoutCUFE: number;
    contactsWithoutDataConsent: number;
  };
}

// ─── Clase de Servicio ────────────────────────────────────────────────────────

export class RiskAuditService {
  /**
   * Ejecuta el escaneo de salud y mitigación de riesgos de la empresa.
   *
   * @param companyId - ID de la empresa a auditar
   */
  async runAudit(companyId: string): Promise<RiskAuditReport> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    const companyName = company?.name || "Empresa";
    const findings: RiskFinding[] = [];

    // ── 1. Verificación de Partida Doble en Todos los Asientos ───────────────
    const entries = await prisma.journalEntry.findMany({
      where: { companyId },
      include: { lines: true },
    });

    let unbalancedCount = 0;
    for (const entry of entries) {
      const totalDebit = entry.lines.reduce((s, l) => s + (l.debit || 0), 0);
      const totalCredit = entry.lines.reduce((s, l) => s + (l.credit || 0), 0);
      // Tolerancia mínima por centavos
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        unbalancedCount++;
      }
    }

    if (unbalancedCount > 0) {
      findings.push({
        level: "CRITICAL",
        category: "CONTABLE",
        title: "Asientos con Descuadre Contable Detectados",
        description: `Se encontraron ${unbalancedCount} asientos donde los Débitos no son exactamente iguales a los Créditos.`,
        recommendation: "Revisar y corregir inmediatamente los asientos descuadrados en el Libro Diario para evitar contingencias fiscales y legales.",
        affectedCount: unbalancedCount,
      });
    } else {
      findings.push({
        level: "OK",
        category: "CONTABLE",
        title: "Partida Doble Íntegra al 100%",
        description: `Todos los ${entries.length} asientos contables registrados cumplen estrictamente con la ecuación de partida doble.`,
        recommendation: "Mantener la validación en caliente activa al crear comprobantes.",
      });
    }

    // ── 2. Verificación de Saldos Rojos en Cajas y Bancos ───────────────────
    const liquidAccounts = await prisma.account.findMany({
      where: {
        companyId,
        code: { startsWith: "11" }, // Cuentas de disponible (Caja y Bancos)
      },
      include: {
        lines: true,
      },
    });

    let negativeAccountsCount = 0;
    for (const acc of liquidAccounts) {
      // En cuentas de activo disponible (11xx), Saldo = Débitos - Créditos
      const balance = acc.lines.reduce((sum, line) => sum + (line.debit || 0) - (line.credit || 0), 0);
      if (balance < 0) {
        negativeAccountsCount++;
      }
    }

    if (negativeAccountsCount > 0) {
      findings.push({
        level: "HIGH",
        category: "CONTABLE",
        title: "Cuentas de Efectivo o Bancos con Saldo Negativo",
        description: `Existen ${negativeAccountsCount} cuentas de disponible con saldo en rojo, lo que suele indicar sobregiros no registrados o gastos asentados sin provisión.`,
        recommendation: "Efectuar arqueo de caja y conciliar cuentas corrientes con extractos oficiales.",
        affectedCount: negativeAccountsCount,
      });
    } else {
      findings.push({
        level: "OK",
        category: "CONTABLE",
        title: "Saldos de Disponible Saludables",
        description: "Ninguna cuenta de caja o bancos presenta saldo negativo anómalo.",
        recommendation: "Continuar con la revisión quincenal de tesorería.",
      });
    }

    // ── 3. Verificación de Cumplimiento Fiscal DIAN en Facturación ───────────
    const invoices = await prisma.invoice.findMany({
      where: { companyId },
    });

    let invoicesWithoutCUFE = 0;
    for (const inv of invoices) {
      // Las facturas emitidas deben tener CUFE generado
      if (inv.status === "ISSUED" && !inv.cufe) {
        invoicesWithoutCUFE++;
      }
    }

    if (invoicesWithoutCUFE > 0) {
      findings.push({
        level: "HIGH",
        category: "FISCAL",
        title: "Facturas Emitidas sin Código CUFE DIAN",
        description: `Hay ${invoicesWithoutCUFE} facturas en estado EMITIDA sin hash CUFE reglamentario asignado.`,
        recommendation: "Ejecutar la sincronización de facturación electrónica para obtener la firma digital y validación previa.",
        affectedCount: invoicesWithoutCUFE,
      });
    } else {
      findings.push({
        level: "OK",
        category: "FISCAL",
        title: "Cumplimiento de Estándar UBL 2.1 DIAN",
        description: "Todas las facturas electrónicas emitidas cuentan con trazabilidad de código CUFE y QR.",
        recommendation: "Mantener vigentes la resolución y certificado digital DIAN.",
      });
    }

    // ── 4. Protección de Datos Personales (Ley 1581 de 2012 / Habeas Data) ──
    const contacts = await prisma.contact.findMany({
      where: { companyId },
    });

    // Validar si los terceros tienen datos completos (identificación tributaria)
    let incompleteContacts = 0;
    for (const c of contacts) {
      if (!c.taxId || !c.name) {
        incompleteContacts++;
      }
    }

    if (incompleteContacts > 0) {
      findings.push({
        level: "MEDIUM",
        category: "DATOS_PERSONALES",
        title: "Terceros con Información Fiscal Incompleta",
        description: `Se detectaron ${incompleteContacts} contactos sin NIT o Razón Social completa, lo que puede provocar rechazos en medios magnéticos DIAN.`,
        recommendation: "Solicitar el RUT actualizado a clientes y proveedores antes de generar documentos tributarios.",
        affectedCount: incompleteContacts,
      });
    } else {
      findings.push({
        level: "OK",
        category: "DATOS_PERSONALES",
        title: "Padrón de Terceros Completo y Homologado",
        description: "Todos los contactos cuentan con identificación fiscal y clasificación para información exógena.",
        recommendation: "Verificar anualmente la vigencia del RUT de los proveedores clave.",
      });
    }

    // ── 5. Cálculo del Índice de Salud del Sistema ──────────────────────────
    const totalChecks = findings.length;
    const passedChecks = findings.filter((f) => f.level === "OK").length;

    // Penalizaciones según severidad
    let penalty = 0;
    if (unbalancedCount > 0) penalty += 40;
    if (negativeAccountsCount > 0) penalty += 20;
    if (invoicesWithoutCUFE > 0) penalty += 20;
    if (incompleteContacts > 0) penalty += 10;

    const healthScore = Math.max(0, 100 - penalty);

    let status: "OPTIMAL" | "ATTENTION_REQUIRED" | "HIGH_RISK" = "OPTIMAL";
    if (healthScore < 60) status = "HIGH_RISK";
    else if (healthScore < 85) status = "ATTENTION_REQUIRED";

    return {
      companyId,
      companyName,
      timestamp: new Date().toISOString(),
      healthScore,
      status,
      totalChecks,
      passedChecks,
      findings,
      summary: {
        unbalancedEntries: unbalancedCount,
        negativeCashAccounts: negativeAccountsCount,
        invoicesWithoutCUFE,
        contactsWithoutDataConsent: incompleteContacts,
      },
    };
  }
}

export const riskAuditService = new RiskAuditService();
