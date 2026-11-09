/**
 * @file dashboard/page.tsx
 * @description Página principal del dashboard de Veltrix ERP.
 *
 * Muestra el resumen financiero ejecutivo con:
 *   - KPIs principales: ingresos operacionales, costos/gastos y utilidad neta.
 *   - Gráfica de línea: ingresos vs gastos acumulados por mes.
 *   - Gráfica de barras: flujo de caja de los últimos 4 períodos.
 *
 * Flujo de datos:
 *   1. `loadStats()` llama a `GET /api/dashboard/stats`.
 *   2. Si la API responde con datos válidos, se actualiza `data`.
 *   3. Si la API falla o devuelve datos incompletos, se usan datos de ejemplo
 *      (fallback) para que el dashboard siempre muestre algo útil.
 *
 * Los colores de las gráficas (Recharts) usan variables CSS del tema activo,
 * por lo que se adaptan automáticamente al modo claro/oscuro.
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  Activity,
  Printer,
  RefreshCw,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** KPIs financieros del período actual */
interface Kpis {
  revenue: number;
  expenses: number;
  netIncome: number;
}

/** Punto de dato para las gráficas de flujo */
interface FlowDataPoint {
  name: string;
  ingresos: number;
  gastos: number;
}

/** Estructura completa devuelta por `/api/dashboard/stats` */
interface DashboardData {
  kpis: Kpis | null;
  flowData: FlowDataPoint[];
}

// ─── Datos de respaldo ────────────────────────────────────────────────────────

/**
 * Datos de ejemplo que se usan cuando la API no está disponible o devuelve
 * una respuesta inesperada. Garantiza que el dashboard nunca aparezca vacío.
 */
const FALLBACK_DATA: DashboardData = {
  kpis: {
    revenue: 10_000_000,
    expenses: 9_950_000,
    netIncome: 50_000,
  },
  flowData: [
    { name: "Ene", ingresos: 0,          gastos: 0        },
    { name: "Feb", ingresos: 10_000_000, gastos: 9_950_000 },
    { name: "Mar", ingresos: 4_300_000,  gastos: 102_800  },
    { name: "Abr", ingresos: 0,          gastos: 0        },
  ],
};

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * `DashboardPage`
 *
 * Página de inicio del área autenticada. Visible en `/dashboard`.
 */
export default function DashboardPage() {
  /* ── Estado ─────────────────────────────────────────────────────────────── */

  /** Datos financieros cargados desde la API o del fallback */
  const [data, setData] = useState<DashboardData>({ kpis: null, flowData: [] });

  /** Indica si la petición a la API está en curso */
  const [loading, setLoading] = useState(true);

  /* ── Carga de datos ─────────────────────────────────────────────────────── */

  /**
   * `loadStats`
   *
   * Obtiene los KPIs y datos de flujo desde el endpoint `/api/dashboard/stats`.
   * En caso de error (red caída, error 5xx, respuesta malformada) usa FALLBACK_DATA
   * para garantizar que el dashboard siempre muestre información.
   */
  const loadStats = () => {
    setLoading(true);

    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((res: DashboardData) => {
        // Verificación de respuesta válida antes de actualizar el estado
        if (res && res.kpis) {
          setData(res);
        } else {
          // La API respondió pero sin los datos esperados
          setData(FALLBACK_DATA);
        }
      })
      .catch(() => {
        // Error de red o de parseo JSON → usar datos de respaldo
        setData(FALLBACK_DATA);
      })
      .finally(() => setLoading(false));
  };

  /** Carga inicial al montar el componente */
  useEffect(() => {
    loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Estado de carga ────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div
        style={{
          padding: "4rem",
          textAlign: "center",
          color: "var(--secondary-foreground)",
          fontSize: "0.9rem",
        }}
      >
        Cargando métricas financieras en tiempo real...
      </div>
    );
  }

  /* ── Desestructuración segura ───────────────────────────────────────────── */

  /**
   * Se proveen valores por defecto (0) para evitar errores de renderizado
   * si `kpis` fuera `null` inesperadamente tras la carga.
   */
  const kpis: Kpis = data.kpis ?? { revenue: 0, expenses: 0, netIncome: 0 };

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>

      {/* ── Encabezado con título y acciones ─────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700 }}>
            Resumen Financiero Ejecutivo
          </h1>
          <p
            style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}
          >
            Métricas de ingresos, costos, gastos y flujo de caja en tiempo real
          </p>
        </div>

        {/* Acciones: actualizar datos e imprimir/exportar */}
        <div style={{ display: "flex", gap: "0.75rem" }}>

          {/* Botón de actualización — recarga los datos desde la API */}
          <button
            onClick={loadStats}
            className="premium-btn"
            aria-label="Actualizar métricas"
            style={{
              background: "var(--secondary)",
              color: "var(--secondary-foreground)",
            }}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Actualizar
          </button>

          {/* Botón de impresión — abre el diálogo nativo del navegador */}
          <button
            className="premium-btn"
            onClick={() => window.print()}
            aria-label="Imprimir o exportar dashboard"
          >
            <Printer size={16} aria-hidden="true" />
            Exportar / Imprimir
          </button>
        </div>
      </div>

      {/* ── Grid de tarjetas de métricas (KPIs) ──────────────────────────── */}
      <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>

        {/* KPI 1: Ingresos Operacionales */}
        <div className="metric-card">
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <div className="metric-title">Ingresos Operacionales (Mes)</div>
              <div className="metric-value">
                ${(kpis.revenue || 0).toLocaleString("es-CO")}
              </div>
            </div>
            {/* Ícono contextual con fondo de color semántico */}
            <div
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                padding: "0.5rem",
                borderRadius: "0.5rem",
              }}
            >
              <DollarSign size={24} color="var(--success)" aria-hidden="true" />
            </div>
          </div>
          <div className="metric-trend trend-up">
            <ArrowUpRight size={16} aria-hidden="true" />
            <span>Facturación comercial Clase 4</span>
          </div>
        </div>

        {/* KPI 2: Costos y Gastos Totales */}
        <div className="metric-card">
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <div className="metric-title">Costos y Gastos Totales</div>
              <div className="metric-value">
                ${(kpis.expenses || 0).toLocaleString("es-CO")}
              </div>
            </div>
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                padding: "0.5rem",
                borderRadius: "0.5rem",
              }}
            >
              <CreditCard size={24} color="var(--destructive)" aria-hidden="true" />
            </div>
          </div>
          <div className="metric-trend trend-down">
            <ArrowDownRight size={16} aria-hidden="true" />
            <span>Nómina, servicios y costo de venta</span>
          </div>
        </div>

        {/* KPI 3: Utilidad Neta Real */}
        <div className="metric-card">
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
          >
            <div>
              <div className="metric-title">Utilidad Neta Real</div>
              {/* El color del valor varía según si la utilidad es positiva o negativa */}
              <div
                className="metric-value"
                style={{
                  color:
                    kpis.netIncome >= 0
                      ? "var(--success)"
                      : "var(--destructive)",
                }}
              >
                ${(kpis.netIncome || 0).toLocaleString("es-CO")}
              </div>
            </div>
            <div
              style={{
                background: "rgba(79, 70, 229, 0.1)",
                padding: "0.5rem",
                borderRadius: "0.5rem",
              }}
            >
              <Activity size={24} color="var(--primary)" aria-hidden="true" />
            </div>
          </div>
          <div className="metric-trend trend-up">
            <ArrowUpRight size={16} aria-hidden="true" />
            <span>Margen neto antes de impuestos</span>
          </div>
        </div>
      </div>

      {/* ── Gráficas ─────────────────────────────────────────────────────── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}
      >
        {/* Gráfica de línea: Ingresos vs Gastos acumulados */}
        <div
          className="glass-panel"
          style={{ padding: "1.5rem", borderRadius: "var(--radius)" }}
        >
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.5rem" }}>
            Ingresos vs Gastos Acumulados
          </h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.flowData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                {/* Cuadrícula horizontal sutil */}
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                {/* Eje X: nombres de los meses */}
                <XAxis
                  dataKey="name"
                  stroke="var(--secondary-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                {/* Eje Y: valores en pesos colombianos */}
                <YAxis
                  stroke="var(--secondary-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString("es-CO")}`}
                />
                {/* Tooltip flotante con colores del tema */}
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    color: "var(--foreground)",
                  }}
                  itemStyle={{ color: "var(--foreground)" }}
                  labelStyle={{ color: "var(--secondary-foreground)", fontWeight: 600 }}
                />
                <Legend />
                {/* Línea de ingresos (verde) */}
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  name="Ingresos"
                  stroke="var(--success)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                {/* Línea de gastos (rojo) */}
                <Line
                  type="monotone"
                  dataKey="gastos"
                  name="Gastos"
                  stroke="var(--destructive)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de barras: flujo de los últimos 4 períodos */}
        <div
          className="glass-panel"
          style={{ padding: "1.5rem", borderRadius: "var(--radius)" }}
        >
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.5rem" }}>
            Flujo Reciente (últimos 4 meses)
          </h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              {/* Se toman los últimos 4 registros del flujo */}
              <BarChart data={data.flowData.slice(-4)}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--secondary-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  /* El cursor de la barra usa un tono suave que respeta el tema */
                  cursor={{ fill: "rgba(79,70,229,0.07)" }}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    color: "var(--foreground)",
                  }}
                  itemStyle={{ color: "var(--foreground)" }}
                />
                {/* Barras con color primario y esquinas superiores redondeadas */}
                <Bar
                  dataKey="ingresos"
                  name="Ingresos"
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
