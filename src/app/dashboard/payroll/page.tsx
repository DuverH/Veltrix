"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  Send,
  Calendar,
  CheckCircle,
  FileText,
  Printer,
  Sparkles,
  ShieldCheck,
  Building,
  Plus,
  ArrowRight,
  Clock,
  Briefcase,
  X,
} from "lucide-react";

export default function PayrollPage() {
  const [period, setPeriod] = useState("2026-02");
  const [payrollData, setPayrollData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Colilla de Pago / Desprendible
  const [selectedPaySlip, setSelectedPaySlip] = useState<any>(null);

  const loadPayroll = () => {
    setLoading(true);
    fetch(`/api/payroll?period=${period}`)
      .then((r) => r.json())
      .then((data) => setPayrollData(data))
      .catch((err) => console.error("Error cargando nómina:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayroll();
  }, [period]);

  const handlePostJournal = async () => {
    if (!confirm(`¿Deseas contabilizar la nómina del período ${period} en el libro diario? Se generará el débito a Gastos de Personal (5105) y los créditos a Seguridad Social (2370) y Bancos (1110).`)) {
      return;
    }

    setIsPosting(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "post-journal",
          period,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Nómina de ${period} asentada exitosamente en el Libro Diario contable. Registro generado: Comprobante #${data.entry.number || data.entry.id}`);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        alert(data.error || "Error al contabilizar la nómina.");
      }
    } catch (err) {
      console.error("Error contabilizando nómina:", err);
    } finally {
      setIsPosting(false);
    }
  };

  const totals = payrollData?.totals || {
    totalGross: 0,
    totalNet: 0,
    totalDeductions: 0,
    totalEmployerSocialSecurity: 0,
    totalProvisions: 0,
    grandTotalCost: 0,
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Users size={28} color="var(--primary)" />
            Nómina Electrónica y Liquidación Laboral
          </h1>
          <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
            Devengados, deducciones de ley, seguridad social, provisiones de prestaciones y CUNE DIAN
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handlePostJournal}
            disabled={isPosting}
            className="premium-btn"
          >
            <Send size={18} />
            {isPosting ? "Contabilizando..." : "Asentar Nómina en Libro Diario"}
          </button>
        </div>
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

      {/* Selector de Período y KPIs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Calendar size={18} color="var(--primary)" />
          <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>Período a Liquidar:</label>
          <input
            type="month"
            className="premium-input"
            style={{ fontWeight: 600, padding: "0.4rem 0.8rem" }}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)" }}>
          {payrollData?.employeeCount || 0} Empleados activos en nómina
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>
        <div className="metric-card">
          <div className="metric-title">Total Devengado (Salario Bruto)</div>
          <div className="metric-value" style={{ color: "var(--foreground)" }}>
            ${totals.totalGross.toLocaleString()}
          </div>
          <div className="metric-trend">Básicos + Aux. Transporte</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Deducciones Empleados (4% + 4%)</div>
          <div className="metric-value" style={{ color: "var(--destructive)" }}>
            -${totals.totalDeductions.toLocaleString()}
          </div>
          <div className="metric-trend">Aportes a Salud y Pensión</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Neto a Pagar (Bancos)</div>
          <div className="metric-value" style={{ color: "var(--success)" }}>
            ${totals.totalNet.toLocaleString()}
          </div>
          <div className="metric-trend" style={{ color: "var(--success)" }}>
            Valor líquido transferido
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Costo Total Empresa (Con Cargas)</div>
          <div className="metric-value" style={{ color: "var(--primary)" }}>
            ${totals.grandTotalCost.toLocaleString()}
          </div>
          <div className="metric-trend">Incluye Aportes y Prestaciones NIIF</div>
        </div>
      </div>

      {/* Tabla de Empleados y Liquidación */}
      <div className="table-container">
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Planilla General de Liquidación ({period})</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)" }}>
              Haz clic en "Colilla de Pago" para emitir el desprendible individual oficial o consultar el CUNE DIAN
            </p>
          </div>
        </div>

        <table className="premium-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Identificación</th>
              <th>Cargo</th>
              <th style={{ textAlign: "right" }}>Salario Básico</th>
              <th style={{ textAlign: "right" }}>Aux. Transporte</th>
              <th style={{ textAlign: "right" }}>Total Devengado</th>
              <th style={{ textAlign: "right" }}>Deducciones (8%)</th>
              <th style={{ textAlign: "right" }}>Neto a Pagar</th>
              <th style={{ textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  Calculando liquidación de nómina...
                </td>
              </tr>
            ) : (
              payrollData?.items?.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Briefcase size={16} color="var(--primary)" />
                      {item.employee.name}
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace" }}>
                    {item.employee.docType} {item.employee.docNumber}
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)" }}>
                    {item.employee.position}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    ${item.employee.baseSalary.toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right", color: item.transportAllowance > 0 ? "var(--success)" : "var(--secondary-foreground)" }}>
                    {item.transportAllowance > 0 ? `$${item.transportAllowance.toLocaleString()}` : "-"}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    ${item.totalEarnings.toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right", color: "var(--destructive)" }}>
                    -${item.totalDeductions.toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 800, color: "var(--primary)" }}>
                    ${item.netPay.toLocaleString()}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => setSelectedPaySlip(item)}
                      style={{
                        background: "rgba(79, 70, 229, 0.1)",
                        color: "var(--primary)",
                        border: "none",
                        padding: "0.35rem 0.7rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <FileText size={14} /> Colilla de Pago
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: COLILLA / DESPRENDIBLE DE PAGO INDIVIDUAL (NORMATIVA DIAN) */}
      {selectedPaySlip && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            className="glass-panel"
            style={{
              background: "var(--card)",
              padding: "2.5rem",
              borderRadius: "var(--radius)",
              maxWidth: "750px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
                  COMPROBANTE DE PAGO DE NÓMINA INDIVIDUAL
                </span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "0.25rem" }}>
                  {selectedPaySlip.employee.name}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)" }}>
                  Período: <strong>{period}</strong> | Días liquidados: <strong>{selectedPaySlip.daysWorked} días</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedPaySlip(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--secondary-foreground)" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Datos del Empleado */}
            <div style={{ background: "var(--secondary)", padding: "1rem", borderRadius: "var(--radius)", marginBottom: "1.5rem", fontSize: "0.85rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div><strong>Documento:</strong> {selectedPaySlip.employee.docType} {selectedPaySlip.employee.docNumber}</div>
              <div><strong>Cargo:</strong> {selectedPaySlip.employee.position}</div>
              <div><strong>Tipo Contrato:</strong> {selectedPaySlip.employee.contractType}</div>
              <div><strong>EPS / Pensión:</strong> {selectedPaySlip.employee.eps} / {selectedPaySlip.employee.pensionFund}</div>
              <div style={{ gridColumn: "span 2" }}><strong>Cuenta de Pago:</strong> {selectedPaySlip.employee.bankAccount || "Transferencia Electrónica"}</div>
            </div>

            {/* Desglose Devengados vs Deducciones */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              {/* Devengados */}
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--success)", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                  (+) Conceptos Devengados
                </h4>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0.3rem 0" }}>
                  <span>Sueldo Básico</span>
                  <span style={{ fontWeight: 600 }}>${selectedPaySlip.baseEarned.toLocaleString()}</span>
                </div>
                {selectedPaySlip.transportAllowance > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0.3rem 0" }}>
                    <span>Auxilio de Transporte</span>
                    <span style={{ fontWeight: 600 }}>${selectedPaySlip.transportAllowance.toLocaleString()}</span>
                  </div>
                )}
                {selectedPaySlip.overtimeAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0.3rem 0" }}>
                    <span>Horas Extras y Recargos</span>
                    <span style={{ fontWeight: 600 }}>${selectedPaySlip.overtimeAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.95rem", borderTop: "1px solid var(--border)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                  <span>Total Devengado:</span>
                  <span style={{ color: "var(--success)" }}>${selectedPaySlip.totalEarnings.toLocaleString()}</span>
                </div>
              </div>

              {/* Deducciones */}
              <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem" }}>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--destructive)", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                  (-) Deducciones de Nómina
                </h4>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0.3rem 0" }}>
                  <span>Aporte Salud (4%)</span>
                  <span style={{ fontWeight: 600 }}>${selectedPaySlip.healthEmployee.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0.3rem 0" }}>
                  <span>Aporte Pensión (4%)</span>
                  <span style={{ fontWeight: 600 }}>${selectedPaySlip.pensionEmployee.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.95rem", borderTop: "1px solid var(--border)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                  <span>Total Deducido:</span>
                  <span style={{ color: "var(--destructive)" }}>-${selectedPaySlip.totalDeductions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Total Neto */}
            <div style={{ background: "rgba(79, 70, 229, 0.08)", border: "1px solid rgba(79, 70, 229, 0.3)", borderRadius: "var(--radius)", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>NETO A PAGAR:</div>
              <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--primary)" }}>
                ${selectedPaySlip.netPay.toLocaleString()}
              </div>
            </div>

            {/* CUNE DIAN */}
            <div style={{ background: "var(--secondary)", padding: "0.75rem 1rem", borderRadius: "var(--radius)", marginBottom: "1.5rem", fontSize: "0.75rem" }}>
              <div style={{ fontWeight: 700, color: "var(--primary)", marginBottom: "0.2rem" }}>
                CÓDIGO ÚNICO DE NÓMINA ELECTRÓNICA (CUNE DIAN):
              </div>
              <div style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                {selectedPaySlip.cune}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => setSelectedPaySlip(null)}
                className="premium-btn"
                style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
              >
                Cerrar
              </button>
              <button onClick={() => window.print()} className="premium-btn">
                <Printer size={16} /> Imprimir Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
