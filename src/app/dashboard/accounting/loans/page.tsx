"use client";

import React, { useState } from "react";
import {
  Landmark,
  Calculator,
  Calendar,
  DollarSign,
  CheckCircle,
  Percent,
  Clock,
  ArrowRight,
  Download,
  AlertCircle,
} from "lucide-react";
import { AmortizationService } from "@/lib/automation/amortization";

export default function LoansPage() {
  const [principal, setPrincipal] = useState(25000000);
  const [annualRate, setAnnualRate] = useState(16.5); // % E.A.
  const [termMonths, setTermMonths] = useState(12);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [bankEntity, setBankEntity] = useState("Bancolombia - Crédito Ordinario");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidPeriods, setPaidPeriods] = useState<number[]>([]);

  // Calcular tabla con el servicio de amortización
  const schedule = AmortizationService.calculateLoanAmortization(
    Number(principal) || 0,
    (Number(annualRate) || 0) / 100,
    Number(termMonths) || 1,
    new Date(startDate)
  );

  const monthlyPayment = schedule[0]?.payment || 0;
  const totalInterest = schedule.reduce((sum, s) => sum + s.interest, 0);
  const totalRepayment = principal + totalInterest;

  // Desembolsar crédito en contabilidad
  const handleDisburseLoan = async () => {
    if (!confirm(`¿Deseas contabilizar el desembolso de este crédito por $${principal.toLocaleString()} en la cuenta de Bancos (1110) vs Obligaciones Financieras (2105)?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      // Obtener cuentas 1110 y 2105
      const accountsRes = await fetch("/api/accounts");
      const accounts = await accountsRes.json();
      const bankAcc = accounts.find((a: any) => a.code.startsWith("1110"));
      const liabilityAcc = accounts.find((a: any) => a.code.startsWith("2105"));

      if (!bankAcc || !liabilityAcc) {
        alert("No se encontraron las cuentas contables 1110 (Bancos) o 2105 (Obligaciones Financieras).");
        return;
      }

      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: startDate,
          description: `Desembolso crédito bancario ${bankEntity} a ${termMonths} meses`,
          reference: "PAGARE-CRED-01",
          lines: [
            { accountId: bankAcc.id, description: `Ingreso por crédito ${bankEntity}`, debit: principal, credit: 0 },
            { accountId: liabilityAcc.id, description: `Obligación financiera pagaré bancario`, debit: 0, credit: principal },
          ],
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Desembolso contabilizado exitosamente: Débito a Banco $${principal.toLocaleString()} y Crédito a Obligaciones Financieras.`);
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error("Error desembolsando préstamo:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Contabilizar pago de cuota
  const handlePayInstallment = async (item: (typeof schedule)[0]) => {
    setIsProcessing(true);
    try {
      const accountsRes = await fetch("/api/accounts");
      const accounts = await accountsRes.json();
      const bankAcc = accounts.find((a: any) => a.code.startsWith("1110"));
      const liabilityAcc = accounts.find((a: any) => a.code.startsWith("2105"));
      const interestAcc = accounts.find((a: any) => a.code.startsWith("5305"));

      if (!bankAcc || !liabilityAcc || !interestAcc) {
        alert("Faltan cuentas contables configuradas (1110, 2105 o 5305).");
        return;
      }

      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(item.date).toISOString().split("T")[0],
          description: `Pago cuota #${item.period} crédito ${bankEntity}`,
          reference: `CUOTA-${item.period}`,
          lines: [
            { accountId: liabilityAcc.id, description: `Abono a capital cuota #${item.period}`, debit: item.principal, credit: 0 },
            { accountId: interestAcc.id, description: `Gasto intereses cuota #${item.period}`, debit: item.interest, credit: 0 },
            { accountId: bankAcc.id, description: `Pago por transferencia cuota #${item.period}`, debit: 0, credit: item.payment },
          ],
        }),
      });

      if (res.ok) {
        setPaidPeriods([...paidPeriods, item.period]);
        setSuccessMsg(`Cuota #${item.period} contabilizada exitosamente: Capital $${item.principal.toLocaleString()}, Interés $${item.interest.toLocaleString()}, Total $${item.payment.toLocaleString()}.`);
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error("Error contabilizando cuota:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Landmark size={28} color="var(--primary)" />
            Préstamos Bancarios y Tablas de Amortización
          </h1>
          <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
            Simula financiamientos (sistema francés), contabiliza desembolsos y asienta pagos de cuotas con discriminación de capital e interés
          </p>
        </div>

        <button onClick={handleDisburseLoan} disabled={isProcessing} className="premium-btn">
          <DollarSign size={18} />
          Desembolsar y Contabilizar Crédito
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(34, 197, 94, 0.15)",
            color: "var(--success)",
            padding: "1rem",
            borderRadius: "var(--radius)",
            marginBottom: "1.5rem",
            border: "1px solid var(--success)",
          }}
        >
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Parámetros del Crédito */}
      <div className="glass-panel" style={{ padding: "1.75rem", borderRadius: "var(--radius)", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calculator size={20} color="var(--primary)" />
          Parámetros del Financiamiento
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div>
            <label className="form-label">Entidad Bancaria / Línea</label>
            <input
              type="text"
              className="premium-input"
              value={bankEntity}
              onChange={(e) => setBankEntity(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Monto Principal ($ COP)</label>
            <input
              type="number"
              min="100000"
              step="100000"
              className="premium-input"
              value={principal}
              onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
            />
          </div>

          <div>
            <label className="form-label">Tasa Nominal Anual (%)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              className="premium-input"
              value={annualRate}
              onChange={(e) => setAnnualRate(Math.max(0, Number(e.target.value)))}
            />
          </div>

          <div>
            <label className="form-label">Plazo (Meses)</label>
            <input
              type="number"
              min="1"
              max="120"
              className="premium-input"
              value={termMonths}
              onChange={(e) => setTermMonths(Math.max(1, Number(e.target.value)))}
            />
          </div>

          <div>
            <label className="form-label">Fecha Primer Vencimiento</label>
            <input
              type="date"
              className="premium-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards del Préstamo */}
      <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>
        <div className="metric-card">
          <div className="metric-title">Cuota Fija Mensual</div>
          <div className="metric-value" style={{ color: "var(--primary)" }}>
            ${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="metric-trend">Capital + Interés mensual</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Intereses Totales Proyectados</div>
          <div className="metric-value" style={{ color: "var(--destructive)" }}>
            ${totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="metric-trend">Costo financiero deducible (5305)</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Total a Pagar (Capital + Interés)</div>
          <div className="metric-value">
            ${totalRepayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="metric-trend">Valor total del compromiso crediticio</div>
        </div>
      </div>

      {/* Tabla de Amortización Francesa */}
      <div className="table-container">
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Cronograma de Cuotas (Amortización Francesa)</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)" }}>
              Haz clic en "Contabilizar Cuota" para generar el asiento contable del mes correspondiente
            </p>
          </div>
        </div>

        <table className="premium-table">
          <thead>
            <tr>
              <th style={{ textAlign: "center" }}>Cuota #</th>
              <th>Fecha de Pago</th>
              <th style={{ textAlign: "right" }}>Valor Cuota</th>
              <th style={{ textAlign: "right" }}>Abono a Capital</th>
              <th style={{ textAlign: "right" }}>Intereses</th>
              <th style={{ textAlign: "right" }}>Saldo Pendiente</th>
              <th style={{ textAlign: "center" }}>Acción Contable</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item) => {
              const isPaid = paidPeriods.includes(item.period);
              return (
                <tr key={item.period} style={{ background: isPaid ? "rgba(34, 197, 94, 0.03)" : "transparent" }}>
                  <td style={{ textAlign: "center", fontWeight: 700, fontFamily: "monospace" }}>
                    {item.period}
                  </td>
                  <td>
                    {new Date(item.date).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" })}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    ${item.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--primary)", fontWeight: 600 }}>
                    ${item.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--destructive)" }}>
                    ${item.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    ${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {isPaid ? (
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--success)", display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "rgba(34, 197, 94, 0.1)", padding: "0.25rem 0.5rem", borderRadius: "1rem" }}>
                        <CheckCircle size={12} /> Contabilizada
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePayInstallment(item)}
                        disabled={isProcessing}
                        style={{
                          background: "var(--primary)",
                          color: "white",
                          border: "none",
                          padding: "0.35rem 0.75rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Contabilizar Cuota
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
