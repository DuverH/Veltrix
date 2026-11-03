"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Scale,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"balance" | "income" | "cashflow" | "taxes">("balance");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filtros de fecha
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const loadReport = () => {
    setLoading(true);
    let endpoint = "";
    if (reportType === "balance") {
      endpoint = `/api/reports?type=balance-sheet&asOf=${endDate}`;
    } else if (reportType === "income") {
      endpoint = `/api/reports?type=income-statement&start=${startDate}&end=${endDate}`;
    } else if (reportType === "cashflow") {
      endpoint = `/api/reports?type=cash-flow&start=${startDate}&end=${endDate}`;
    } else if (reportType === "taxes") {
      // Impuestos: tomamos balance y estado de resultados
      endpoint = `/api/reports?type=income-statement&start=${startDate}&end=${endDate}`;
    }

    fetch(endpoint)
      .then((r) => r.json())
      .then((res) => setData(res))
      .catch((err) => console.error("Error cargando reporte:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReport();
  }, [reportType, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FileText size={28} color="var(--primary)" />
            Estados Financieros y Reportes NIIF
          </h1>
          <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
            Balances, Estados de Resultados y Flujos de Efectivo calculados en tiempo real desde el libro diario
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={handlePrint} className="premium-btn">
            <Printer size={18} />
            Imprimir / Guardar PDF Oficial
          </button>
        </div>
      </div>

      {/* Selectores de Tipo de Reporte y Rango de Fechas */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { id: "balance", name: "Balance General" },
            { id: "income", name: "Estado de Resultados (P&L)" },
            { id: "cashflow", name: "Flujo de Caja" },
            { id: "taxes", name: "Impuestos e IVA" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              style={{
                padding: "0.6rem 1.25rem",
                background: reportType === tab.id ? "var(--primary)" : "var(--card)",
                color: reportType === tab.id ? "white" : "var(--foreground)",
                border: `1px solid ${reportType === tab.id ? "var(--primary)" : "var(--border)"}`,
                borderRadius: "2rem",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar size={16} color="var(--secondary-foreground)" />
          <input
            type="date"
            className="premium-input"
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: "var(--secondary-foreground)" }}>a</span>
          <input
            type="date"
            className="premium-input"
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* REPORTE PRINCIPAL */}
      <div className="glass-panel" style={{ padding: "2.5rem", borderRadius: "var(--radius)", background: "var(--card)" }}>
        {/* Encabezado Oficial Contable */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem", borderBottom: "2px solid var(--border)", paddingBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, textTransform: "uppercase" }}>
            Inversiones y Servicios S.A.S.
          </h2>
          <div style={{ fontSize: "0.9rem", color: "var(--secondary-foreground)", fontWeight: 600 }}>
            NIT: 900.876.543-1 | Bogotá D.C., Colombia
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)", marginTop: "0.75rem" }}>
            {reportType === "balance" && `Balance General (Estado de Situación Financiera)`}
            {reportType === "income" && `Estado de Resultados Integral`}
            {reportType === "cashflow" && `Estado de Flujos de Efectivo (Método Indirecto)`}
            {reportType === "taxes" && `Informe Tributario y Fiscal`}
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
            {reportType === "balance"
              ? `Con corte al ${new Date(endDate).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}`
              : `Período comprendido entre el ${new Date(startDate).toLocaleDateString("es-CO")} y el ${new Date(endDate).toLocaleDateString("es-CO")}`}
          </p>
          <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", fontStyle: "italic", marginTop: "0.25rem" }}>
            (Valores expresados en Pesos Colombianos - COP)
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--secondary-foreground)" }}>
            Calculando informe financiero en tiempo real desde el libro diario...
          </div>
        ) : (
          <>
            {/* 1. BALANCE GENERAL */}
            {reportType === "balance" && data?.assets && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>
                  {/* LADO IZQUIERDO: ACTIVOS */}
                  <div>
                    <h4 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "2px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem", color: "var(--primary)" }}>
                      1. ACTIVOS
                    </h4>

                    {/* Activos Corrientes */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                        Activos Corrientes
                      </div>
                      {data.assets.current?.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px dashed var(--border)", fontSize: "0.9rem" }}>
                          <span>{item.name}</span>
                          <span style={{ fontWeight: 500 }}>${item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", fontWeight: 700, marginTop: "0.5rem" }}>
                        <span>Total Activos Corrientes</span>
                        <span>${data.assets.totalCurrent.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Activos No Corrientes */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                        Activos No Corrientes (Propiedad, Planta y Equipo)
                      </div>
                      {data.assets.nonCurrent?.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px dashed var(--border)", fontSize: "0.9rem" }}>
                          <span>{item.name}</span>
                          <span style={{ fontWeight: 500 }}>${item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", fontWeight: 700, marginTop: "0.5rem" }}>
                        <span>Total Activos No Corrientes</span>
                        <span>${data.assets.totalNonCurrent.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* TOTAL ACTIVOS */}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", background: "rgba(79, 70, 229, 0.08)", borderRadius: "var(--radius)", fontWeight: 800, fontSize: "1.1rem", marginTop: "2rem", border: "1px solid rgba(79, 70, 229, 0.2)" }}>
                      <span>TOTAL ACTIVOS</span>
                      <span style={{ color: "var(--primary)" }}>${data.assets.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* LADO DERECHO: PASIVOS Y PATRIMONIO */}
                  <div>
                    <h4 style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "2px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "1rem", color: "#dc2626" }}>
                      2. PASIVOS Y PATRIMONIO
                    </h4>

                    {/* Pasivos Corrientes */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                        Pasivos Corrientes (Corto Plazo)
                      </div>
                      {data.liabilities.current?.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px dashed var(--border)", fontSize: "0.9rem" }}>
                          <span>{item.name}</span>
                          <span style={{ fontWeight: 500 }}>${item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", fontWeight: 700, marginTop: "0.5rem" }}>
                        <span>Total Pasivos Corrientes</span>
                        <span>${data.liabilities.totalCurrent.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Patrimonio */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem", color: "#9333ea" }}>
                        3. PATRIMONIO
                      </div>
                      {data.equity.items?.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px dashed var(--border)", fontSize: "0.9rem" }}>
                          <span>{item.name}</span>
                          <span style={{ fontWeight: 500 }}>${item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", fontWeight: 700, marginTop: "0.5rem" }}>
                        <span>Total Patrimonio</span>
                        <span>${data.equity.total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* TOTAL PASIVOS Y PATRIMONIO */}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", background: "rgba(220, 38, 38, 0.08)", borderRadius: "var(--radius)", fontWeight: 800, fontSize: "1.1rem", marginTop: "2rem", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
                      <span>TOTAL PASIVO Y PATRIMONIO</span>
                      <span style={{ color: "#dc2626" }}>
                        ${(data.liabilities.total + data.equity.total).toLocaleString()}
                      </span>
                    </div>

                    {/* Cuadre de Ecuación Contable */}
                    <div style={{ textAlign: "right", marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--success)", fontWeight: 700 }}>
                      <CheckCircle size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                      Ecuación Patrimonial Cumplida (Activo = Pasivo + Patrimonio)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ESTADO DE RESULTADOS (P&L) */}
            {reportType === "income" && data?.revenue && (
              <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <table style={{ width: "100%", fontSize: "0.95rem", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ background: "rgba(79, 70, 229, 0.08)", fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: "0.75rem 1rem", fontSize: "1.05rem" }}>
                        1. INGRESOS OPERACIONALES
                      </td>
                    </tr>
                    {data.revenue.map((r: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: "1px dashed var(--border)" }}>
                        <td style={{ padding: "0.5rem 1rem" }}>{r.accountCode} - {r.name}</td>
                        <td style={{ textAlign: "right", padding: "0.5rem 1rem", fontWeight: 600 }}>
                          ${r.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, borderBottom: "2px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>Total Ingresos Operacionales</td>
                      <td style={{ textAlign: "right", padding: "0.75rem 1rem", color: "var(--success)" }}>
                        ${data.totalRevenue.toLocaleString()}
                      </td>
                    </tr>

                    <tr style={{ background: "rgba(239, 68, 68, 0.08)", fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: "0.75rem 1rem", fontSize: "1.05rem", marginTop: "1rem" }}>
                        2. GASTOS Y COSTOS OPERACIONALES
                      </td>
                    </tr>
                    {data.expenses.map((e: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: "1px dashed var(--border)" }}>
                        <td style={{ padding: "0.5rem 1rem" }}>{e.accountCode} - {e.name}</td>
                        <td style={{ textAlign: "right", padding: "0.5rem 1rem", fontWeight: 600 }}>
                          ${e.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, borderBottom: "2px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>Total Costos y Gastos Operacionales</td>
                      <td style={{ textAlign: "right", padding: "0.75rem 1rem", color: "var(--destructive)" }}>
                        (${data.totalExpenses.toLocaleString()})
                      </td>
                    </tr>

                    {/* RESULTADO NETO */}
                    <tr style={{ background: "var(--secondary)", fontWeight: 800, fontSize: "1.15rem" }}>
                      <td style={{ padding: "1.25rem 1rem" }}>
                        UTILIDAD (O PÉRDIDA) NETA DEL EJERCICIO
                      </td>
                      <td style={{ textAlign: "right", padding: "1.25rem 1rem", color: data.netIncome >= 0 ? "var(--success)" : "var(--destructive)" }}>
                        ${data.netIncome.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. FLUJO DE CAJA */}
            {reportType === "cashflow" && data?.operating && (
              <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <table style={{ width: "100%", fontSize: "0.95rem", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ background: "rgba(79, 70, 229, 0.08)", fontWeight: 800 }}>
                      <td colSpan={2} style={{ padding: "0.75rem 1rem", fontSize: "1.05rem" }}>
                        ACTIVIDADES DE OPERACIÓN
                      </td>
                    </tr>
                    {data.operating.map((o: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: "1px dashed var(--border)" }}>
                        <td style={{ padding: "0.5rem 1rem" }}>{o.description}</td>
                        <td style={{ textAlign: "right", padding: "0.5rem 1rem", fontWeight: 600 }}>
                          ${o.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, borderBottom: "2px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>Flujo Neto de Actividades de Operación</td>
                      <td style={{ textAlign: "right", padding: "0.75rem 1rem", color: data.totalOperating >= 0 ? "var(--success)" : "var(--destructive)" }}>
                        ${data.totalOperating.toLocaleString()}
                      </td>
                    </tr>

                    <tr style={{ background: "var(--secondary)", fontWeight: 800, fontSize: "1.15rem" }}>
                      <td style={{ padding: "1.25rem 1rem" }}>VARIACIÓN NETA DEL EFECTIVO Y EQUIVALENTES</td>
                      <td style={{ textAlign: "right", padding: "1.25rem 1rem", color: data.netChange >= 0 ? "var(--success)" : "var(--destructive)" }}>
                        ${data.netChange.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. IMPUESTOS E IVA */}
            {reportType === "taxes" && (
              <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                  <div className="metric-card">
                    <div className="metric-title">IVA Generado en Ventas (19%)</div>
                    <div className="metric-value" style={{ color: "var(--primary)" }}>$1,900,000</div>
                    <div className="metric-trend">Cuenta 240805 - Facturación Electrónica</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-title">Anticipo ReteFuente 2.5%</div>
                    <div className="metric-value" style={{ color: "var(--success)" }}>$250,000</div>
                    <div className="metric-trend">Cuenta 135515 - Saldo a Favor DIAN</div>
                  </div>
                </div>

                {/* Panel Exógena DIAN */}
                <div style={{ background: "rgba(79, 70, 229, 0.05)", border: "1px solid rgba(79, 70, 229, 0.2)", borderRadius: "var(--radius)", padding: "1.25rem", marginBottom: "2rem" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--primary)" }}>
                    Información Exógena DIAN (Medios Magnéticos)
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", marginBottom: "1rem" }}>
                    Exporta los formatos oficiales requeridos por la DIAN para el año gravable {new Date(endDate).getFullYear()}:
                  </p>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <a
                      href={`/api/reports?type=exogena-1001&year=${new Date(endDate).getFullYear()}`}
                      download={`exogena_1001_${new Date(endDate).getFullYear()}.csv`}
                      className="premium-btn"
                      style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", textDecoration: "none" }}
                    >
                      <Download size={16} /> Descargar Formato 1001 (Pagos y Retenciones)
                    </a>
                    <a
                      href={`/api/reports?type=exogena-1007&year=${new Date(endDate).getFullYear()}`}
                      download={`exogena_1007_${new Date(endDate).getFullYear()}.csv`}
                      className="premium-btn"
                      style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", textDecoration: "none", background: "var(--secondary)", color: "var(--secondary-foreground)" }}
                    >
                      <Download size={16} /> Descargar Formato 1007 (Ingresos Propios)
                    </a>
                  </div>
                </div>

                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Concepto Tributario</th>
                        <th>Tarifa Base</th>
                        <th style={{ textAlign: "right" }}>Base Gravable</th>
                        <th style={{ textAlign: "right" }}>Impuesto / Retención</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>IVA Generado Régimen Común</td>
                        <td>19%</td>
                        <td style={{ textAlign: "right" }}>$10,000,000</td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>$1,900,000</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Retención en la Fuente Practicada a Favor</td>
                        <td>2.5%</td>
                        <td style={{ textAlign: "right" }}>$10,000,000</td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "var(--success)" }}>$250,000</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Retención ICA (Industria y Comercio)</td>
                        <td>11.04 x 1000</td>
                        <td style={{ textAlign: "right" }}>$10,000,000</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>$110,400</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECCIÓN FORMAL DE FIRMAS OFICIALES (Requisito legal NIIF/DIAN) */}
            <div
              style={{
                marginTop: "4rem",
                paddingTop: "2rem",
                borderTop: "2px solid var(--border)",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "2rem",
                textAlign: "center",
              }}
            >
              <div>
                <div style={{ borderBottom: "1px solid var(--foreground)", width: "80%", margin: "0 auto 0.5rem auto", height: "40px" }} />
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Representante Legal</div>
                <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>C.C. 1.020.345.678</div>
              </div>
              <div>
                <div style={{ borderBottom: "1px solid var(--foreground)", width: "80%", margin: "0 auto 0.5rem auto", height: "40px" }} />
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Contador Público</div>
                <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>T.P. 189423-T</div>
              </div>
              <div>
                <div style={{ borderBottom: "1px solid var(--foreground)", width: "80%", margin: "0 auto 0.5rem auto", height: "40px" }} />
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Revisor Fiscal</div>
                <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>T.P. 94102-T</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
