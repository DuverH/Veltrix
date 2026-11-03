"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Landmark,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  FileText,
  RefreshCw,
  Globe,
} from "lucide-react";

export default function TreasuryPage() {
  const [activeTab, setActiveTab] = useState<"aging" | "forecast" | "trm">("aging");
  const [agingType, setAgingType] = useState<"RECEIVABLE" | "PAYABLE">("RECEIVABLE");
  const [loading, setLoading] = useState(true);
  const [treasuryData, setTreasuryData] = useState<any>(null);

  // TRM revaluation state
  const [trmForm, setTrmForm] = useState({
    accountCode: "111005",
    currency: "USD",
    foreignBalance: 15000, // $15,000 USD
    bookTrm: 4150,
    currentTrm: 4280,
  });
  const [trmLoading, setTrmLoading] = useState(false);
  const [trmResult, setTrmResult] = useState<any>(null);

  // Cobro modal state
  const [selectedNotice, setSelectedNotice] = useState<any>(null);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val || 0);

  const fetchTreasury = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/treasury");
      const data = await res.json();
      setTreasuryData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreasury();
  }, []);

  const handleRevalueTrm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTrmLoading(true);
      setTrmResult(null);
      const res = await fetch("/api/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revalue_trm", ...trmForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTrmResult(data.result);
      fetchTreasury();
    } catch (err: any) {
      alert("Error en reexpresión TRM: " + err.message);
    } finally {
      setTrmLoading(false);
    }
  };

  const currentAging = agingType === "RECEIVABLE" ? treasuryData?.arAging : treasuryData?.apAging;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={28} />
            Tesorería Avanzada & Multimoneda TRM
          </h1>
          <p className="text-muted-foreground text-sm">
            Aging de cartera y proveedores, flujo de caja proyectado a 30/60/90 días y reexpresión por diferencia en cambio (NIC 21).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("aging")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "aging"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock size={16} />
          Antigüedad de Saldos (Aging Matrix)
        </button>
        <button
          onClick={() => setActiveTab("forecast")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "forecast"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar size={16} />
          Flujo de Caja Proyectado (30/60/90 Días)
        </button>
        <button
          onClick={() => setActiveTab("trm")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "trm"
              ? "border-blue-500 text-blue-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe size={16} />
          Multimoneda & Ajuste TRM
        </button>
      </div>

      {/* PESTAÑA 1: AGING REPORT */}
      {activeTab === "aging" && (
        <div className="space-y-6">
          {/* Selector Clientes vs Proveedores */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setAgingType("RECEIVABLE")}
                className={`btn text-xs ${
                  agingType === "RECEIVABLE" ? "btn-primary" : "btn-secondary"
                }`}
              >
                Cartera Clientes (Cuentas por Cobrar CXC)
              </button>
              <button
                onClick={() => setAgingType("PAYABLE")}
                className={`btn text-xs ${
                  agingType === "PAYABLE" ? "btn-primary" : "btn-secondary"
                }`}
              >
                Proveedores (Cuentas por Pagar CXP)
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              Total Cartera: <strong className="text-foreground">{formatCOP(currentAging?.summary?.total || 0)}</strong>
            </span>
          </div>

          {/* Tarjetas de Rangos de Vencimiento (Buckets) */}
          {currentAging && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <span className="text-xs text-muted-foreground block">Corriente (Al Día)</span>
                <span className="text-lg font-bold text-emerald-600 font-mono">
                  {formatCOP(currentAging.summary.current)}
                </span>
                <span className="text-[10px] text-muted-foreground">Vencimientos futuros</span>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <span className="text-xs text-muted-foreground block">Mora 1 - 30 Días</span>
                <span className="text-lg font-bold text-blue-600 font-mono">
                  {formatCOP(currentAging.summary.days1to30)}
                </span>
                <span className="text-[10px] text-muted-foreground">Mora preventiva</span>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <span className="text-xs text-muted-foreground block">Mora 31 - 60 Días</span>
                <span className="text-lg font-bold text-amber-600 font-mono">
                  {formatCOP(currentAging.summary.days31to60)}
                </span>
                <span className="text-[10px] text-muted-foreground">Cobro administrativo</span>
              </div>

              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <span className="text-xs text-muted-foreground block">Mora 61 - 90 Días</span>
                <span className="text-lg font-bold text-orange-600 font-mono">
                  {formatCOP(currentAging.summary.days61to90)}
                </span>
                <span className="text-[10px] text-muted-foreground">Alerta de provisión</span>
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <span className="text-xs text-muted-foreground block">+90 Días (Vencida)</span>
                <span className="text-lg font-bold text-red-600 font-mono">
                  {formatCOP(currentAging.summary.daysOver90)}
                </span>
                <span className="text-[10px] text-muted-foreground">Cobro jurídico / Deterioro</span>
              </div>
            </div>
          )}

          {/* Tabla de Terceros en Aging */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tercero / Razón Social</th>
                  <th>Identificación</th>
                  <th style={{ textAlign: "right" }}>Corriente</th>
                  <th style={{ textAlign: "right" }}>1-30 Días</th>
                  <th style={{ textAlign: "right" }}>31-60 Días</th>
                  <th style={{ textAlign: "right" }}>61-90 Días</th>
                  <th style={{ textAlign: "right" }}>+90 Días</th>
                  <th style={{ textAlign: "right" }}>Saldo Total</th>
                  <th style={{ textAlign: "center" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {currentAging?.contacts?.length > 0 ? (
                  currentAging.contacts.map((c: any) => (
                    <tr key={c.contactId} className="hover:bg-accent/40 font-mono text-xs">
                      <td className="font-sans font-semibold text-foreground">
                        {c.contactName}
                      </td>
                      <td className="text-muted-foreground">{c.taxId}</td>
                      <td style={{ textAlign: "right" }} className={c.buckets.current > 0 ? "text-emerald-600" : "text-muted-foreground"}>
                        {formatCOP(c.buckets.current)}
                      </td>
                      <td style={{ textAlign: "right" }} className={c.buckets.days1to30 > 0 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
                        {formatCOP(c.buckets.days1to30)}
                      </td>
                      <td style={{ textAlign: "right" }} className={c.buckets.days31to60 > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                        {formatCOP(c.buckets.days31to60)}
                      </td>
                      <td style={{ textAlign: "right" }} className={c.buckets.days61to90 > 0 ? "text-orange-600 font-bold" : "text-muted-foreground"}>
                        {formatCOP(c.buckets.days61to90)}
                      </td>
                      <td style={{ textAlign: "right" }} className={c.buckets.daysOver90 > 0 ? "text-red-600 font-bold" : "text-muted-foreground"}>
                        {formatCOP(c.buckets.daysOver90)}
                      </td>
                      <td style={{ textAlign: "right" }} className="font-bold text-foreground">
                        {formatCOP(c.buckets.total)}
                      </td>
                      <td style={{ textAlign: "center" }} className="font-sans">
                        <button
                          onClick={() => setSelectedNotice(c)}
                          className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 mx-auto"
                        >
                          <FileText size={12} />
                          Aviso Cobro
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground">
                      No hay facturas pendientes de cobro o pago en este momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: FLUJO DE CAJA PROYECTADO */}
      {activeTab === "forecast" && treasuryData?.cashForecast && (
        <div className="space-y-6">
          <div className="card p-5 bg-card/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs text-muted-foreground block">Posición Actual de Caja & Bancos (Cuentas 1105 / 1110)</span>
              <span className="text-2xl font-bold font-mono text-emerald-600">
                {formatCOP(treasuryData.cashForecast.startingCash)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Caja Proyectada al Día 90</span>
              <span className="text-2xl font-bold font-mono text-blue-500">
                {formatCOP(treasuryData.cashForecast.finalProjectedCash)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {treasuryData.cashForecast.forecastPeriods.map((p: any, idx: number) => (
              <div key={p.key} className="card p-5 space-y-4 border-t-4 border-blue-500">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="font-bold text-sm">{p.label}</span>
                  <span className="badge badge-secondary text-xs">Periodo {idx + 1}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ArrowUpRight size={14} className="text-emerald-500" /> Cobros Previstos (CXC):
                    </span>
                    <span className="font-mono font-semibold text-emerald-600">
                      +{formatCOP(p.expectedInflow)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ArrowDownRight size={14} className="text-amber-500" /> Pagos Proveedores (CXP):
                    </span>
                    <span className="font-mono font-semibold text-amber-600">
                      -{formatCOP(p.suppliersOutflow)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ArrowDownRight size={14} className="text-red-500" /> Nómina y Operación Est.:
                    </span>
                    <span className="font-mono font-semibold text-red-600">
                      -{formatCOP(p.payrollOutflow)}
                    </span>
                  </div>

                  <div className="border-t border-border pt-2 flex justify-between items-center font-bold">
                    <span>Variación Neta de Caja:</span>
                    <span
                      className={`font-mono ${
                        p.netCashChange >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {p.netCashChange >= 0 ? "+" : ""}
                      {formatCOP(p.netCashChange)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-accent/40 rounded-lg border border-border flex justify-between items-center mt-3">
                    <span className="font-semibold text-foreground">Saldo Final Proyectado:</span>
                    <span className="font-mono font-bold text-blue-500 text-sm">
                      {formatCOP(p.projectedEndingCash)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: MULTIMONEDA & AJUSTE TRM */}
      {activeTab === "trm" && (
        <div className="max-w-2xl mx-auto card p-6 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Globe className="text-blue-500" size={20} />
              Reexpresión Contable de Moneda Extranjera (TRM)
            </h2>
            <p className="text-xs text-muted-foreground">
              Ajuste de cierre conforme a NIC 21 (Efectos de las Variaciones en las Tasas de Cambio).
            </p>
          </div>

          {trmResult && (
            <div
              className={`p-4 rounded-lg border text-xs space-y-1.5 ${
                trmResult.isGain
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <div className="font-bold text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className={trmResult.isGain ? "text-emerald-600" : "text-red-600"} />
                {trmResult.isGain ? "Ganancia por Diferencia en Cambio" : "Pérdida por Diferencia en Cambio"}:{" "}
                {formatCOP(Math.abs(trmResult.difference))}
              </div>
              <p className="text-muted-foreground">
                Asiento contable #{trmResult.entry?.number} generado automáticamente en Libro Diario (
                {trmResult.isGain ? "Abono a Cuenta 421020 Diferencia en Cambio Ingresos" : "Débito a Cuenta 530525 Gastos Financieros"}).
              </p>
            </div>
          )}

          <form onSubmit={handleRevalueTrm} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Moneda</label>
                <select
                  value={trmForm.currency}
                  onChange={(e) => setTrmForm({ ...trmForm, currency: e.target.value })}
                  className="input w-full"
                >
                  <option value="USD">Dólares Estadounidenses (USD)</option>
                  <option value="EUR">Euros (EUR)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Cuenta Contable PUC</label>
                <input
                  type="text"
                  value={trmForm.accountCode}
                  onChange={(e) => setTrmForm({ ...trmForm, accountCode: e.target.value })}
                  className="input w-full font-mono"
                  placeholder="111005"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Saldo en Moneda Extranjera ({trmForm.currency})</label>
              <input
                type="number"
                min="1"
                value={trmForm.foreignBalance}
                onChange={(e) => setTrmForm({ ...trmForm, foreignBalance: Number(e.target.value) })}
                className="input w-full font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">TRM Histórica en Libros (COP)</label>
                <input
                  type="number"
                  min="1"
                  value={trmForm.bookTrm}
                  onChange={(e) => setTrmForm({ ...trmForm, bookTrm: Number(e.target.value) })}
                  className="input w-full font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">TRM Oficial de Cierre (COP)</label>
                <input
                  type="number"
                  min="1"
                  value={trmForm.currentTrm}
                  onChange={(e) => setTrmForm({ ...trmForm, currentTrm: Number(e.target.value) })}
                  className="input w-full font-mono"
                  required
                />
              </div>
            </div>

            <div className="p-3.5 bg-accent/30 rounded-lg border border-border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor en libros histórico:</span>
                <span className="font-mono">{formatCOP(trmForm.foreignBalance * trmForm.bookTrm)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor reexpresado a TRM actual:</span>
                <span className="font-mono font-bold text-foreground">{formatCOP(trmForm.foreignBalance * trmForm.currentTrm)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-bold">
                <span>Variación por Diferencia en Cambio:</span>
                <span
                  className={`font-mono ${
                    trmForm.currentTrm >= trmForm.bookTrm ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {formatCOP((trmForm.currentTrm - trmForm.bookTrm) * trmForm.foreignBalance)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={trmLoading}
              className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} className={trmLoading ? "animate-spin" : ""} />
              {trmLoading ? "Calculando y Contabilizando..." : "Ejecutar Reexpresión y Generar Asiento"}
            </button>
          </form>
        </div>
      )}

      {/* Modal de Aviso de Cobro Formal */}
      {selectedNotice && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div className="card max-w-xl w-full p-6 space-y-4 bg-card">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Notificación Formal de Estado de Cuenta y Cobro
              </h3>
              <button onClick={() => setSelectedNotice(null)} className="btn btn-secondary text-xs">
                Cerrar
              </button>
            </div>

            <div className="bg-white text-black p-6 rounded font-serif text-xs leading-relaxed space-y-3 border">
              <div className="text-center font-bold text-sm border-b pb-2">
                ESTADO DE CUENTA Y RECORDATORIO DE PAGO
              </div>
              <div>
                <strong>Señores:</strong> {selectedNotice.contactName}<br />
                <strong>NIT / CC:</strong> {selectedNotice.taxId}<br />
                <strong>Fecha de Expedición:</strong> {new Date().toLocaleDateString("es-CO")}
              </div>
              <p>
                De manera atenta nos permitimos informar que en nuestros registros contables figura un saldo pendiente por valor de:
              </p>
              <div className="text-center font-bold text-base py-2 bg-gray-100 rounded font-mono">
                {formatCOP(selectedNotice.buckets.total)}
              </div>
              <div className="border p-2 rounded text-[11px] font-sans">
                <strong>Desglose por Antigüedad:</strong>
                <ul className="list-disc ml-4 mt-1">
                  <li>Corriente (No vencido): {formatCOP(selectedNotice.buckets.current)}</li>
                  <li>Mora 1 - 30 días: {formatCOP(selectedNotice.buckets.days1to30)}</li>
                  <li>Mora 31 - 60 días: {formatCOP(selectedNotice.buckets.days31to60)}</li>
                  <li>Mora superior a 60 días: {formatCOP(selectedNotice.buckets.days61to90 + selectedNotice.buckets.daysOver90)}</li>
                </ul>
              </div>
              <p>
                Agradecemos gestionar la cancelación oportuna mediante transferencia bancaria a nuestra cuenta corriente Bancolombia No. 458-102938-2. Si ya efectuó el pago, por favor remita el comprobante a contabilidad@empresa.com.
              </p>
              <div className="pt-4 border-t text-center font-sans text-[10px] text-gray-500">
                Departamento de Cartera y Tesorería — Veltrix ERP Colombiano
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                <FileText size={14} /> Imprimir / Exportar Notificación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
