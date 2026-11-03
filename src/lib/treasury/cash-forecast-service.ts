import { prisma } from "../prisma";
import { AccountingEngine } from "../accounting/double-entry";

export interface AgingBucket {
  current: number; // No vencido
  days1to30: number; // 1-30 días
  days31to60: number; // 31-60 días
  days61to90: number; // 61-90 días
  daysOver90: number; // >90 días
  total: number;
}

export interface AgingItem {
  contactId: string;
  contactName: string;
  taxId: string;
  phone?: string;
  email?: string;
  buckets: AgingBucket;
  invoicesCount: number;
}

export class TreasuryService {
  /**
   * Genera la matriz de antigüedad de saldos (Aging Report) para CXC o CXP
   */
  static async getAgingReport(companyId: string, type: "RECEIVABLE" | "PAYABLE"): Promise<{
    summary: AgingBucket;
    contacts: AgingItem[];
  }> {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        type,
        status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] },
      },
      include: {
        contact: true,
      },
      orderBy: { dueDate: "asc" },
    });

    const now = new Date();
    const contactMap: Record<string, AgingItem> = {};

    const summary: AgingBucket = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      daysOver90: 0,
      total: 0,
    };

    for (const inv of invoices) {
      const balance = inv.total - inv.paidAmount;
      if (balance <= 0) continue;

      const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.date);
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const contactId = inv.contactId || "UNASSIGNED";
      const contactName = inv.contact?.name || "Sin Contacto";
      const taxId = inv.contact?.taxId || "S/N";
      const phone = inv.contact?.phone || "";
      const email = inv.contact?.email || "";

      if (!contactMap[contactId]) {
        contactMap[contactId] = {
          contactId,
          contactName,
          taxId,
          phone,
          email,
          buckets: {
            current: 0,
            days1to30: 0,
            days31to60: 0,
            days61to90: 0,
            daysOver90: 0,
            total: 0,
          },
          invoicesCount: 0,
        };
      }

      contactMap[contactId].invoicesCount++;
      contactMap[contactId].buckets.total += balance;
      summary.total += balance;

      if (diffDays <= 0) {
        contactMap[contactId].buckets.current += balance;
        summary.current += balance;
      } else if (diffDays <= 30) {
        contactMap[contactId].buckets.days1to30 += balance;
        summary.days1to30 += balance;
      } else if (diffDays <= 60) {
        contactMap[contactId].buckets.days31to60 += balance;
        summary.days31to60 += balance;
      } else if (diffDays <= 90) {
        contactMap[contactId].buckets.days61to90 += balance;
        summary.days61to90 += balance;
      } else {
        contactMap[contactId].buckets.daysOver90 += balance;
        summary.daysOver90 += balance;
      }
    }

    return {
      summary,
      contacts: Object.values(contactMap),
    };
  }

  /**
   * Proyección de Flujo de Caja para 30, 60 y 90 días
   */
  static async getCashFlowForecast(companyId: string) {
    // 1. Saldo actual de bancos y caja
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { companyId, isActive: true },
    });
    const currentCash = bankAccounts.reduce((s, b) => s + b.currentBalance, 0);

    // 2. Facturas por cobrar con vencimiento en los próximos 90 días
    const receivables = await prisma.invoice.findMany({
      where: { companyId, type: "RECEIVABLE", status: { in: ["ISSUED", "PARTIAL"] } },
    });

    // 3. Facturas por pagar con vencimiento en los próximos 90 días
    const payables = await prisma.invoice.findMany({
      where: { companyId, type: "PAYABLE", status: { in: ["ISSUED", "PARTIAL"] } },
    });

    const now = new Date();
    const periods = [
      { key: "30_DAYS", label: "Próximos 30 Días", daysMin: 0, daysMax: 30 },
      { key: "60_DAYS", label: "De 31 a 60 Días", daysMin: 31, daysMax: 60 },
      { key: "90_DAYS", label: "De 61 a 90 Días", daysMin: 61, daysMax: 90 },
    ];

    let runningCash = currentCash;

    const forecastPeriods = periods.map((p) => {
      // Inflow esperado de facturas de clientes
      const inflow = receivables
        .filter((r) => {
          const due = r.dueDate ? new Date(r.dueDate) : new Date(r.date);
          const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= p.daysMin && diffDays <= p.daysMax;
        })
        .reduce((s, r) => s + (r.total - r.paidAmount), 0);

      // Outflow esperado a proveedores
      const outflowSuppliers = payables
        .filter((r) => {
          const due = r.dueDate ? new Date(r.dueDate) : new Date(r.date);
          const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= p.daysMin && diffDays <= p.daysMax;
        })
        .reduce((s, r) => s + (r.total - r.paidAmount), 0);

      // Estimación de nómina operativa mensual recurrente
      const payrollEstimate = 13800000; // Nómina de la empresa
      const netCashChange = inflow - (outflowSuppliers + payrollEstimate);
      runningCash += netCashChange;

      return {
        ...p,
        expectedInflow: inflow,
        expectedOutflow: outflowSuppliers + payrollEstimate,
        suppliersOutflow: outflowSuppliers,
        payrollOutflow: payrollEstimate,
        netCashChange,
        projectedEndingCash: runningCash,
      };
    });

    return {
      startingCash: currentCash,
      forecastPeriods,
      finalProjectedCash: runningCash,
    };
  }

  /**
   * Reexpresión por Diferencia en Cambio TRM (NIC 21)
   */
  static async revalueForeignCurrency(
    companyId: string,
    data: {
      accountCode: string; // ej: 111005
      currency: string; // USD o EUR
      foreignBalance: number; // Saldo en moneda extranjera
      bookTrm: number; // TRM histórica en libros
      currentTrm: number; // TRM oficial actual de cierre
    }
  ) {
    const historicalCOP = data.foreignBalance * data.bookTrm;
    const revaluedCOP = data.foreignBalance * data.currentTrm;
    const difference = Math.round(revaluedCOP - historicalCOP);

    if (difference === 0) {
      return { difference: 0, message: "No hay variación por diferencia en cambio" };
    }

    // Cuentas contables:
    // Cuenta Bancos ME
    let bankMeAcc = await prisma.account.findFirst({
      where: { companyId, code: { startsWith: data.accountCode.slice(0, 4) } },
    });
    if (!bankMeAcc) {
      bankMeAcc = await prisma.account.findFirst({
        where: { companyId, code: { startsWith: "1110" } },
      });
    }

    // Cuenta 421020 (Ganancia) o 530525 (Pérdida)
    const gainAcc = await prisma.account.findFirst({
      where: { companyId, code: { startsWith: "4210" } },
    });
    const lossAcc = await prisma.account.findFirst({
      where: { companyId, code: { startsWith: "5305" } },
    });

    if (!bankMeAcc) {
      throw new Error("No se localizó la cuenta bancaria de moneda extranjera");
    }

    let lines = [];
    const isGain = difference > 0;
    const absDiff = Math.abs(difference);

    if (isGain) {
      // Ganancia: Débito al banco, Crédito a Ingreso por Diferencia en Cambio
      const targetGain = gainAcc || bankMeAcc;
      lines = [
        {
          accountId: bankMeAcc.id,
          description: `Ajuste TRM al alza (${data.currency} ${data.foreignBalance} de $${data.bookTrm} a $${data.currentTrm})`,
          debit: absDiff,
          credit: 0,
        },
        {
          accountId: targetGain.id,
          description: `Ingreso por diferencia en cambio no realizada (NIC 21)`,
          debit: 0,
          credit: absDiff,
        },
      ];
    } else {
      // Pérdida: Débito a Gasto por Diferencia en Cambio, Crédito al banco
      const targetLoss = lossAcc || bankMeAcc;
      lines = [
        {
          accountId: targetLoss.id,
          description: `Gasto por diferencia en cambio (disminución TRM ${data.currency} de $${data.bookTrm} a $${data.currentTrm})`,
          debit: absDiff,
          credit: 0,
        },
        {
          accountId: bankMeAcc.id,
          description: `Ajuste en libros saldo moneda extranjera`,
          debit: 0,
          credit: absDiff,
        },
      ];
    }

    const entry = await AccountingEngine.createJournalEntry({
      companyId,
      date: new Date(),
      description: `Reexpresión y ajuste TRM de cierre (${data.currency} ${data.foreignBalance} @ $${data.currentTrm})`,
      reference: `TRM-${data.currency}-${Date.now().toString().slice(-4)}`,
      type: "MANUAL",
      lines,
    });

    return {
      difference,
      isGain,
      entry,
    };
  }
}
