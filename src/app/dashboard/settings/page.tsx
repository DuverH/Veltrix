"use client";

import React, { useState } from "react";
import { Settings, Building2, Receipt, ShieldCheck, Database, Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    companyName: "Mi Empresa S.A.S.",
    taxId: "900.876.543-1",
    currency: "COP",
    fiscalYearEnd: "12",
    invoicePrefix: "FAC",
    invoiceNextNumber: 1001,
    defaultTaxRate: 19,
    defaultPaymentDays: 30,
    autoDepreciation: true,
    autoClosing: false,
    backupEnabled: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Settings size={28} color="var(--primary)" />
            Configuración del Sistema
          </h1>
          <p style={{ color: "var(--secondary-foreground)" }}>Parámetros de la compañía, facturación electrónica y automatizaciones contables</p>
        </div>
      </div>

      {saved && (
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
          <span>Configuración guardada correctamente.</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Información General */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius)", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building2 size={20} color="var(--primary)" />
            Datos de la Empresa
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Razón Social</label>
              <input
                type="text"
                className="premium-input"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">NIT / Identificación Fiscal</label>
              <input
                type="text"
                className="premium-input"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Moneda Principal</label>
              <input
                type="text"
                className="premium-input"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mes de Cierre Fiscal</label>
              <input
                type="number"
                min="1"
                max="12"
                className="premium-input"
                value={form.fiscalYearEnd}
                onChange={(e) => setForm({ ...form, fiscalYearEnd: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Facturación Electrónica */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius)", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Receipt size={20} color="var(--primary)" />
            Parámetros de Facturación
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Prefijo de Factura</label>
              <input
                type="text"
                className="premium-input"
                value={form.invoicePrefix}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Consecutivo Siguiente</label>
              <input
                type="number"
                className="premium-input"
                value={form.invoiceNextNumber}
                onChange={(e) => setForm({ ...form, invoiceNextNumber: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IVA Predeterminado (%)</label>
              <input
                type="number"
                step="0.01"
                className="premium-input"
                value={form.defaultTaxRate}
                onChange={(e) => setForm({ ...form, defaultTaxRate: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Días de Plazo Predeterminados</label>
              <input
                type="number"
                className="premium-input"
                value={form.defaultPaymentDays}
                onChange={(e) => setForm({ ...form, defaultPaymentDays: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Automatizaciones y Seguridad */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius)", marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldCheck size={20} color="var(--primary)" />
            Automatizaciones y Respaldo
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.autoDepreciation}
                onChange={(e) => setForm({ ...form, autoDepreciation: e.target.checked })}
                style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Depreciación automática mensual</div>
                <div style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)" }}>Calcula y contabiliza la depreciación de activos fijos al final de cada periodo.</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.backupEnabled}
                onChange={(e) => setForm({ ...form, backupEnabled: e.target.checked })}
                style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Copias de seguridad automáticas</div>
                <div style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)" }}>Genera respaldos periódicos de la base de datos contable.</div>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" className="premium-btn">
          <Save size={18} />
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
