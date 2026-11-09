/**
 * @file settings/page.tsx
 * @description Página de Configuración del Sistema — Veltrix ERP.
 *
 * Permite al usuario administrar:
 *   - Datos básicos de la empresa (razón social, NIT, moneda, cierre fiscal).
 *   - Parámetros de facturación electrónica (prefijo, consecutivo, IVA, plazos).
 *   - Automatizaciones (depreciación mensual, respaldos automáticos).
 *   - Preferencia de tema visual (claro / oscuro).
 *
 * Notas de implementación:
 *   - El formulario es controlado: cada campo tiene su propio estado en `form`.
 *   - El guardado es simulado en este prototipo (muestra un banner de éxito
 *     durante 3 segundos). En producción debe conectarse a la API `/api/settings`.
 *   - El toggle de tema interactúa con `ThemeProvider` para persistir la
 *     preferencia en localStorage y aplicar la clase `.dark` en `<html>`.
 */

"use client";

import React, { useState } from "react";
import {
  Settings,
  Building2,
  Receipt,
  ShieldCheck,
  Save,
  CheckCircle,
  Palette,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Estructura del formulario de configuración.
 * Refleja los campos editables de la empresa y del sistema.
 */
interface SettingsForm {
  companyName: string;
  taxId: string;
  currency: string;
  fiscalYearEnd: string;
  invoicePrefix: string;
  invoiceNextNumber: number;
  defaultTaxRate: number;
  defaultPaymentDays: number;
  autoDepreciation: boolean;
  autoClosing: boolean;
  backupEnabled: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * `SettingsPage`
 *
 * Página de configuración completa del sistema Veltrix.
 * Solo accesible para usuarios con sesión activa (protegido por el layout
 * del dashboard).
 */
export default function SettingsPage() {
  /* ── Hook de tema ───────────────────────────────────────────────────────── */

  /**
   * Accedemos al tema actual y a la función para cambiarlo.
   * El tema se persiste en localStorage a través de `ThemeProvider`.
   */
  const { theme, setTheme } = useTheme();

  /* ── Estado del formulario ──────────────────────────────────────────────── */

  /**
   * Indicador de guardado exitoso.
   * Se activa por 3 segundos tras un guardado correcto y luego se oculta
   * automáticamente para no saturar la UI con mensajes persistentes.
   */
  const [saved, setSaved] = useState(false);

  /**
   * Estado del formulario de configuración con valores predeterminados.
   * En producción estos valores deben cargarse desde la API al montar el componente.
   */
  const [form, setForm] = useState<SettingsForm>({
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

  /* ── Manejadores ────────────────────────────────────────────────────────── */

  /**
   * `handleSave`
   *
   * Previene el envío por defecto del formulario, simula un guardado
   * y muestra un banner de confirmación temporal.
   *
   * @param e - Evento de envío del formulario HTML
   */
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Conectar con `PUT /api/settings` para persistir cambios en BD
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  /**
   * `handleFieldChange`
   *
   * Función genérica para actualizar cualquier campo del formulario.
   * Preserva el resto del estado mediante el spread del objeto `form`.
   *
   * @param field - Clave del campo a actualizar
   * @param value - Nuevo valor del campo
   */
  const handleFieldChange = <K extends keyof SettingsForm>(
    field: K,
    value: SettingsForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div style={{ maxWidth: "900px" }}>

      {/* ── Encabezado de la página ──────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <Settings size={28} color="var(--primary)" aria-hidden="true" />
            Configuración del Sistema
          </h1>
          <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
            Parámetros de la compañía, facturación electrónica y automatizaciones
          </p>
        </div>
      </div>

      {/* ── Banner de confirmación (visible 3 s tras guardar) ────────────── */}
      {saved && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(34, 197, 94, 0.12)",
            color: "var(--success)",
            padding: "1rem",
            borderRadius: "var(--radius)",
            marginBottom: "1.5rem",
            border: "1px solid var(--success)",
          }}
        >
          <CheckCircle size={20} aria-hidden="true" />
          <span>Configuración guardada correctamente.</span>
        </div>
      )}

      <form onSubmit={handleSave}>

        {/* ── Sección: Datos de la Empresa ─────────────────────────────── */}
        <div
          className="glass-panel"
          style={{
            padding: "1.5rem",
            borderRadius: "var(--radius)",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Building2 size={20} color="var(--primary)" aria-hidden="true" />
            Datos de la Empresa
          </h3>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
          >
            {/* Razón Social */}
            <div className="form-group">
              <label htmlFor="companyName" className="form-label">
                Razón Social
              </label>
              <input
                id="companyName"
                type="text"
                className="premium-input"
                value={form.companyName}
                onChange={(e) => handleFieldChange("companyName", e.target.value)}
                required
              />
            </div>

            {/* NIT */}
            <div className="form-group">
              <label htmlFor="taxId" className="form-label">
                NIT / Identificación Fiscal
              </label>
              <input
                id="taxId"
                type="text"
                className="premium-input"
                value={form.taxId}
                onChange={(e) => handleFieldChange("taxId", e.target.value)}
                required
              />
            </div>

            {/* Moneda */}
            <div className="form-group">
              <label htmlFor="currency" className="form-label">
                Moneda Principal
              </label>
              <input
                id="currency"
                type="text"
                className="premium-input"
                value={form.currency}
                onChange={(e) => handleFieldChange("currency", e.target.value)}
              />
            </div>

            {/* Mes de cierre fiscal */}
            <div className="form-group">
              <label htmlFor="fiscalYearEnd" className="form-label">
                Mes de Cierre Fiscal
              </label>
              <input
                id="fiscalYearEnd"
                type="number"
                min="1"
                max="12"
                className="premium-input"
                value={form.fiscalYearEnd}
                onChange={(e) => handleFieldChange("fiscalYearEnd", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Sección: Parámetros de Facturación ───────────────────────── */}
        <div
          className="glass-panel"
          style={{
            padding: "1.5rem",
            borderRadius: "var(--radius)",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Receipt size={20} color="var(--primary)" aria-hidden="true" />
            Parámetros de Facturación
          </h3>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
          >
            {/* Prefijo de factura */}
            <div className="form-group">
              <label htmlFor="invoicePrefix" className="form-label">
                Prefijo de Factura
              </label>
              <input
                id="invoicePrefix"
                type="text"
                className="premium-input"
                value={form.invoicePrefix}
                onChange={(e) => handleFieldChange("invoicePrefix", e.target.value)}
              />
            </div>

            {/* Consecutivo siguiente */}
            <div className="form-group">
              <label htmlFor="invoiceNextNumber" className="form-label">
                Consecutivo Siguiente
              </label>
              <input
                id="invoiceNextNumber"
                type="number"
                className="premium-input"
                value={form.invoiceNextNumber}
                onChange={(e) =>
                  handleFieldChange("invoiceNextNumber", Number(e.target.value))
                }
              />
            </div>

            {/* IVA predeterminado */}
            <div className="form-group">
              <label htmlFor="defaultTaxRate" className="form-label">
                IVA Predeterminado (%)
              </label>
              <input
                id="defaultTaxRate"
                type="number"
                step="0.01"
                className="premium-input"
                value={form.defaultTaxRate}
                onChange={(e) =>
                  handleFieldChange("defaultTaxRate", Number(e.target.value))
                }
              />
            </div>

            {/* Días de plazo */}
            <div className="form-group">
              <label htmlFor="defaultPaymentDays" className="form-label">
                Días de Plazo Predeterminados
              </label>
              <input
                id="defaultPaymentDays"
                type="number"
                className="premium-input"
                value={form.defaultPaymentDays}
                onChange={(e) =>
                  handleFieldChange("defaultPaymentDays", Number(e.target.value))
                }
              />
            </div>
          </div>
        </div>

        {/* ── Sección: Automatizaciones y Respaldo ─────────────────────── */}
        <div
          className="glass-panel"
          style={{
            padding: "1.5rem",
            borderRadius: "var(--radius)",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <ShieldCheck size={20} color="var(--primary)" aria-hidden="true" />
            Automatizaciones y Respaldo
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Toggle: Depreciación automática mensual */}
            <label
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={form.autoDepreciation}
                onChange={(e) => handleFieldChange("autoDepreciation", e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                aria-describedby="autoDepreciation-desc"
              />
              <div>
                <div style={{ fontWeight: 500 }}>Depreciación automática mensual</div>
                <div
                  id="autoDepreciation-desc"
                  style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)" }}
                >
                  Calcula y contabiliza la depreciación de activos fijos al final de cada período.
                </div>
              </div>
            </label>

            {/* Toggle: Copias de seguridad automáticas */}
            <label
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={form.backupEnabled}
                onChange={(e) => handleFieldChange("backupEnabled", e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                aria-describedby="backupEnabled-desc"
              />
              <div>
                <div style={{ fontWeight: 500 }}>Copias de seguridad automáticas</div>
                <div
                  id="backupEnabled-desc"
                  style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)" }}
                >
                  Genera respaldos periódicos de la base de datos contable.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* ── Sección: Apariencia y Tema ───────────────────────────────── */}
        <div
          className="glass-panel"
          style={{
            padding: "1.5rem",
            borderRadius: "var(--radius)",
            marginBottom: "2rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Palette size={20} color="var(--primary)" aria-hidden="true" />
            Apariencia y Tema
          </h3>

          <p style={{ fontSize: "0.875rem", color: "var(--secondary-foreground)", marginBottom: "1rem" }}>
            Selecciona el modo visual que prefieres. La preferencia se guarda en este
            navegador y se aplica automáticamente en futuros accesos.
          </p>

          {/* Selector de tema: dos botones tipo "toggle card" */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>

            {/* Botón: Modo Claro */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem 1.5rem",
                borderRadius: "var(--radius)",
                border: `2px solid ${theme === "light" ? "var(--primary)" : "var(--border)"}`,
                background: theme === "light" ? "rgba(79, 70, 229, 0.08)" : "var(--background)",
                color: "var(--foreground)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minWidth: "120px",
                fontWeight: theme === "light" ? 700 : 400,
              }}
            >
              {/* Círculo que simula el sol (modo claro) */}
              <span style={{ fontSize: "1.5rem" }}>☀️</span>
              <span style={{ fontSize: "0.875rem" }}>Modo Claro</span>
              {theme === "light" && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--primary)",
                    fontWeight: 600,
                  }}
                >
                  ✓ Activo
                </span>
              )}
            </button>

            {/* Botón: Modo Oscuro */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem 1.5rem",
                borderRadius: "var(--radius)",
                border: `2px solid ${theme === "dark" ? "var(--primary)" : "var(--border)"}`,
                background: theme === "dark" ? "rgba(129, 140, 248, 0.12)" : "var(--background)",
                color: "var(--foreground)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minWidth: "120px",
                fontWeight: theme === "dark" ? 700 : 400,
              }}
            >
              {/* Luna (modo oscuro) */}
              <span style={{ fontSize: "1.5rem" }}>🌙</span>
              <span style={{ fontSize: "0.875rem" }}>Modo Oscuro</span>
              {theme === "dark" && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--primary)",
                    fontWeight: 600,
                  }}
                >
                  ✓ Activo
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Botón de guardar cambios ─────────────────────────────────── */}
        <button type="submit" className="premium-btn">
          <Save size={18} aria-hidden="true" />
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
