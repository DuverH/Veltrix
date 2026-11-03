import { prisma } from "../prisma";
import { AccountingEngine } from "../accounting/double-entry";
import { createHash } from "crypto";

export interface Employee {
  id: string;
  name: string;
  docType: string;
  docNumber: string;
  position: string;
  contractType: "INDEFINIDO" | "TERMINO_FIJO" | "OBRA_LABOR" | "APRENDIZAJE";
  baseSalary: number;
  hasTransportAllowance: boolean;
  eps: string;
  pensionFund: string;
  arlRiskLevel: number; // 1 (0.522%) to 5 (6.960%)
  bankAccount?: string;
  hireDate: string;
}

export interface PayrollOvertime {
  diurnaHours?: number; // 25% recargo
  nocturnaHours?: number; // 75% recargo
  festivaHours?: number; // 100% recargo
  bonuses?: number;
}

export interface PayrollSettlementItem {
  employee: Employee;
  daysWorked: number;
  baseEarned: number;
  transportAllowance: number;
  overtimeAmount: number;
  bonuses: number;
  totalEarnings: number; // Devengado

  // Deducciones
  healthEmployee: number; // 4%
  pensionEmployee: number; // 4%
  totalDeductions: number;

  netPay: number; // Neto pagado

  // Aportes de la empresa y parafiscales
  pensionEmployer: number; // 12%
  arlEmployer: number; // según riesgo
  cajaCompensacion: number; // 4%

  // Provisiones de prestaciones sociales
  cesantias: number; // 8.33%
  interesesCesantias: number; // 1% mensual del saldo cesantías
  primaServicios: number; // 8.33%
  vacaciones: number; // 4.17%

  totalCompanyCost: number;
  cune: string; // Código Único de Nómina Electrónica
}

// Parámetros legales Colombia 2026 (proyectados)
export const SMMLV_2026 = 1450000;
export const AUX_TRANSPORTE_2026 = 175000;

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP-001",
    name: "Carlos Andrés Rodríguez",
    docType: "CC",
    docNumber: "1018456789",
    position: "Ingeniero de Software Senior",
    contractType: "INDEFINIDO",
    baseSalary: 6200000,
    hasTransportAllowance: false, // Supera 2 SMMLV
    eps: "Sanitas EPS",
    pensionFund: "Porvenir",
    arlRiskLevel: 1,
    bankAccount: "Bancolombia Ahorros # 458-102938-2",
    hireDate: "2024-01-15",
  },
  {
    id: "EMP-002",
    name: "Diana Marcela Pérez",
    docType: "CC",
    docNumber: "1032987654",
    position: "Contadora General",
    contractType: "INDEFINIDO",
    baseSalary: 4500000,
    hasTransportAllowance: false,
    eps: "Sura EPS",
    pensionFund: "Protección",
    arlRiskLevel: 1,
    bankAccount: "Davivienda Corriente # 0029-8761-00",
    hireDate: "2024-03-01",
  },
  {
    id: "EMP-003",
    name: "Jhon Alexander Gómez",
    docType: "CC",
    docNumber: "80456123",
    position: "Técnico Operario de Producción",
    contractType: "TERMINO_FIJO",
    baseSalary: 1650000,
    hasTransportAllowance: true, // Menor a 2 SMMLV
    eps: "Compensar EPS",
    pensionFund: "Colfondos",
    arlRiskLevel: 2, // 1.044%
    bankAccount: "Bancolombia Ahorros # 102-998877-1",
    hireDate: "2025-06-01",
  },
  {
    id: "EMP-004",
    name: "Laura Camila Suárez",
    docType: "CC",
    docNumber: "1026543210",
    position: "Asistente Administrativa y Facturación",
    contractType: "INDEFINIDO",
    baseSalary: 1800000,
    hasTransportAllowance: true,
    eps: "Sanitas EPS",
    pensionFund: "Porvenir",
    arlRiskLevel: 1,
    bankAccount: "BBVA Ahorros # 981-223344-0",
    hireDate: "2025-08-15",
  },
];

export class PayrollService {
  /**
   * Get all active employees
   */
  static getEmployees(): Employee[] {
    return INITIAL_EMPLOYEES;
  }

  /**
   * Calculate single employee settlement
   */
  static settleEmployee(
    employee: Employee,
    daysWorked = 30,
    overtime: PayrollOvertime = {},
    period = "2026-02"
  ): PayrollSettlementItem {
    const hourlyRate = employee.baseSalary / 240; // 240 horas mensuales estándar

    const baseEarned = Math.round((employee.baseSalary / 30) * daysWorked);
    const transportAllowance = employee.hasTransportAllowance
      ? Math.round((AUX_TRANSPORTE_2026 / 30) * daysWorked)
      : 0;

    // Horas extras
    const diurna = (overtime.diurnaHours || 0) * hourlyRate * 1.25;
    const nocturna = (overtime.nocturnaHours || 0) * hourlyRate * 1.75;
    const festiva = (overtime.festivaHours || 0) * hourlyRate * 2.0;
    const overtimeAmount = Math.round(diurna + nocturna + festiva);
    const bonuses = overtime.bonuses || 0;

    const totalEarnings = baseEarned + transportAllowance + overtimeAmount + bonuses;

    // Base de cotización a seguridad social (no incluye auxilio de transporte)
    const sbc = baseEarned + overtimeAmount + bonuses;

    // Deducciones empleado
    const healthEmployee = Math.round(sbc * 0.04);
    const pensionEmployee = Math.round(sbc * 0.04);
    const totalDeductions = healthEmployee + pensionEmployee;

    const netPay = totalEarnings - totalDeductions;

    // Aportes empleador
    const pensionEmployer = Math.round(sbc * 0.12);
    const arlRates = [0.00522, 0.01044, 0.02436, 0.0435, 0.0696];
    const arlRate = arlRates[Math.max(0, (employee.arlRiskLevel || 1) - 1)];
    const arlEmployer = Math.round(sbc * arlRate);
    const cajaCompensacion = Math.round(sbc * 0.04);

    // Provisiones prestaciones sociales (base incluye auxilio transporte excepto vacaciones)
    const basePrestaciones = totalEarnings;
    const cesantias = Math.round(basePrestaciones * 0.0833);
    const interesesCesantias = Math.round(cesantias * 0.01);
    const primaServicios = Math.round(basePrestaciones * 0.0833);
    const vacaciones = Math.round(baseEarned * 0.0417);

    const totalCompanyCost =
      totalEarnings +
      pensionEmployer +
      arlEmployer +
      cajaCompensacion +
      cesantias +
      interesesCesantias +
      primaServicios +
      vacaciones;

    // Generar CUNE (Código Único de Nómina Electrónica)
    const rawCune = `${employee.docNumber}|${period}|${totalEarnings}|${netPay}|${Date.now()}`;
    const cune = createHash("sha384").update(rawCune).digest("hex").toUpperCase();

    return {
      employee,
      daysWorked,
      baseEarned,
      transportAllowance,
      overtimeAmount,
      bonuses,
      totalEarnings,
      healthEmployee,
      pensionEmployee,
      totalDeductions,
      netPay,
      pensionEmployer,
      arlEmployer,
      cajaCompensacion,
      cesantias,
      interesesCesantias,
      primaServicios,
      vacaciones,
      totalCompanyCost,
      cune,
    };
  }

  /**
   * Run full payroll settlement for all employees for a given month
   */
  static settleFullPayroll(period = "2026-02", days = 30) {
    const items = INITIAL_EMPLOYEES.map((emp) => this.settleEmployee(emp, days, {}, period));

    const totalGross = items.reduce((s, i) => s + i.totalEarnings, 0);
    const totalNet = items.reduce((s, i) => s + i.netPay, 0);
    const totalDeductions = items.reduce((s, i) => s + i.totalDeductions, 0);
    const totalEmployerSocialSecurity = items.reduce(
      (s, i) => s + i.pensionEmployer + i.arlEmployer + i.cajaCompensacion,
      0
    );
    const totalProvisions = items.reduce(
      (s, i) => s + i.cesantias + i.interesesCesantias + i.primaServicios + i.vacaciones,
      0
    );
    const grandTotalCost = items.reduce((s, i) => s + i.totalCompanyCost, 0);

    return {
      period,
      employeeCount: items.length,
      items,
      totals: {
        totalGross,
        totalNet,
        totalDeductions,
        totalEmployerSocialSecurity,
        totalProvisions,
        grandTotalCost,
      },
    };
  }

  /**
   * Post Payroll into Accounting Journal
   */
  static async postPayrollEntry(companyId: string, settlement: ReturnType<typeof PayrollService.settleFullPayroll>) {
    // Buscar cuentas del PUC: 5105 (Gasto Personal), 2370 (Seguridad Social), 2505 (Salarios por pagar), 1110 (Bancos)
    const [expenseAcc, liabilityAcc, bankAcc] = await Promise.all([
      prisma.account.findFirst({ where: { companyId, code: { startsWith: "5105" } } }),
      prisma.account.findFirst({ where: { companyId, code: { startsWith: "2370" } } }),
      prisma.account.findFirst({ where: { companyId, code: { startsWith: "1110" } } }),
    ]);

    if (!expenseAcc || !bankAcc) {
      throw new Error("No se encontraron las cuentas contables de Gastos de Personal (5105) o Bancos (1110)");
    }

    const { totals } = settlement;

    const lines = [
      // 1. Débito a Gasto de Nómina (Total Devengado)
      {
        accountId: expenseAcc.id,
        description: `Costo devengado nómina período ${settlement.period} (${settlement.employeeCount} empleados)`,
        debit: totals.totalGross,
        credit: 0,
      },
      // 2. Crédito a Retenciones de Seguridad Social (Salud y Pensión Empleado)
      {
        accountId: liabilityAcc ? liabilityAcc.id : expenseAcc.id,
        description: `Deducciones de ley salud y pensión retenidas a empleados`,
        debit: 0,
        credit: totals.totalDeductions,
      },
      // 3. Crédito a Banco / Salarios por Pagar (Neto a pagar en cuentas)
      {
        accountId: bankAcc.id,
        description: `Dispersión electrónica nómina ${settlement.period}`,
        debit: 0,
        credit: totals.totalNet,
      },
    ];

    const entry = await AccountingEngine.createJournalEntry({
      companyId,
      date: new Date(),
      description: `Liquidación y dispersión de Nómina Electrónica Período ${settlement.period}`,
      reference: `NOM-${settlement.period}`,
      type: "MANUAL",
      lines,
    });

    return entry;
  }

  /**
   * Generate DIAN Electronic Payroll XML container
   */
  static generateDianPayrollXML(item: PayrollSettlementItem, period: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<NominaIndividual xmlns="dian:gov:co:facturaelectronica:NominaIndividual">
  <Novedad>false</Novedad>
  <Periodo>${period}</Periodo>
  <NumeroSecuenciaXML>NOM-${period}-${item.employee.docNumber}</NumeroSecuenciaXML>
  <CUNE>${item.cune}</CUNE>
  <Trabajador>
    <TipoDocumento>${item.employee.docType}</TipoDocumento>
    <NumeroDocumento>${item.employee.docNumber}</NumeroDocumento>
    <Nombre>${item.employee.name}</Nombre>
    <Cargo>${item.employee.position}</Cargo>
    <TipoContrato>${item.employee.contractType}</TipoContrato>
    <SalarioBase>${item.employee.baseSalary}</SalarioBase>
  </Trabajador>
  <Devengados>
    <Basico>${item.baseEarned}</Basico>
    <AuxilioTransporte>${item.transportAllowance}</AuxilioTransporte>
    <HorasExtras>${item.overtimeAmount}</HorasExtras>
    <Bonificaciones>${item.bonuses}</Bonificaciones>
    <TotalDevengado>${item.totalEarnings}</TotalDevengado>
  </Devengados>
  <Deducciones>
    <Salud>${item.healthEmployee}</Salud>
    <Pension>${item.pensionEmployee}</Pension>
    <TotalDeducciones>${item.totalDeductions}</TotalDeducciones>
  </Deducciones>
  <ValoresTotales>
    <ComprobanteTotal>${item.totalEarnings}</ComprobanteTotal>
    <DevengadosTotal>${item.totalEarnings}</DevengadosTotal>
    <DeduccionesTotal>${item.totalDeductions}</DeduccionesTotal>
    <SueldoNeto>${item.netPay}</SueldoNeto>
  </ValoresTotales>
</NominaIndividual>`;
  }
}
