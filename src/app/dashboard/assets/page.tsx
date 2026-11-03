"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  PlayCircle,
  Plus,
  Calendar,
  CheckCircle,
  DollarSign,
  TrendingDown,
  Layers,
} from "lucide-react";

interface FixedAsset {
  id: string;
  code?: string | null;
  name: string;
  category: string;
  cost: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationRate: number;
  accumulatedDep: number;
  netBookValue: number;
  depreciationProgress: number;
  location?: string | null;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDepreciating, setIsDepreciating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal nuevo activo
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("EQUIPMENT");
  const [cost, setCost] = useState(5000000);
  const [salvageValue, setSalvageValue] = useState(500000);
  const [usefulLifeYears, setUsefulLifeYears] = useState(5);
  const [location, setLocation] = useState("Sede Principal");

  const loadAssets = () => {
    setLoading(true);
    fetch("/api/assets")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAssets(data);
      })
      .catch((err) => console.error("Error cargando activos:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleRunDepreciation = async () => {
    if (!confirm("¿Deseas ejecutar el cálculo y registro contable de la depreciación mensual para todos los activos fijos activos?")) {
      return;
    }

    setIsDepreciating(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run-depreciation",
          companyId: "default",
          date: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Depreciación mensual ejecutada exitosamente. Total depreciado: $${Number(data.totalDepreciation || 0).toLocaleString()}`);
        setTimeout(() => setSuccessMsg(null), 5000);
        loadAssets();
      }
    } catch (err) {
      console.error("Error corriendo depreciación:", err);
    } finally {
      setIsDepreciating(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const annualRate = 1 / usefulLifeYears;
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code || undefined,
          name,
          category,
          cost: Number(cost),
          salvageValue: Number(salvageValue),
          usefulLifeYears: Number(usefulLifeYears),
          depreciationRate: annualRate,
          location,
          acquisitionDate: new Date().toISOString(),
          companyId: "default",
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setName("");
        setCode("");
        setSuccessMsg("Activo fijo registrado correctamente.");
        setTimeout(() => setSuccessMsg(null), 4000);
        loadAssets();
      }
    } catch (err) {
      console.error("Error creando activo:", err);
    }
  };

  const totalCost = assets.reduce((s, a) => s + a.cost, 0);
  const totalDepreciation = assets.reduce((s, a) => s + a.accumulatedDep, 0);
  const totalNetBook = assets.reduce((s, a) => s + a.netBookValue, 0);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Building size={28} color="var(--primary)" />
            Activos Fijos y Depreciación Automatizada
          </h1>
          <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
            Control de propiedad, planta y equipo, vidas útiles NIIF y cálculo mensual de depreciación
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => setShowModal(true)} className="premium-btn" style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
            <Plus size={18} />
            Nuevo Activo Fijo
          </button>
          <button onClick={handleRunDepreciation} disabled={isDepreciating} className="premium-btn">
            <PlayCircle size={18} />
            {isDepreciating ? "Procesando..." : "Correr Depreciación Mensual"}
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

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>
        <div className="metric-card">
          <div className="metric-title">Costo Histórico Total</div>
          <div className="metric-value">${totalCost.toLocaleString()}</div>
          <div className="metric-trend">{assets.length} activos en registro</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Depreciación Acumulada</div>
          <div className="metric-value" style={{ color: "var(--destructive)" }}>
            -${totalDepreciation.toLocaleString()}
          </div>
          <div className="metric-trend">Cuenta 1592 (Deprec. Acumulada)</div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Valor Neto en Libros</div>
          <div className="metric-value" style={{ color: "var(--primary)" }}>
            ${totalNetBook.toLocaleString()}
          </div>
          <div className="metric-trend">Costo menos depreciación acumulada</div>
        </div>
      </div>

      {/* Tabla de Activos */}
      <div className="table-container">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Activo Fijo</th>
              <th>Categoría</th>
              <th style={{ textAlign: "right" }}>Costo Inicial</th>
              <th style={{ textAlign: "center" }}>Vida Útil</th>
              <th style={{ textAlign: "right" }}>Deprec. Acumulada</th>
              <th style={{ textAlign: "right" }}>Valor Neto Libros</th>
              <th style={{ width: "140px" }}>Progreso</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  Cargando activos fijos...
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  No hay activos fijos registrados.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id}>
                  <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{asset.code || asset.id.slice(-6)}</td>
                  <td style={{ fontWeight: 500 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Building size={16} color="var(--primary)" />
                      {asset.name}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.75rem", background: "var(--secondary)", padding: "0.2rem 0.5rem", borderRadius: "0.5rem" }}>
                      {asset.category}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>${asset.cost.toLocaleString()}</td>
                  <td style={{ textAlign: "center" }}>{asset.usefulLifeYears} años</td>
                  <td style={{ textAlign: "right", color: "var(--destructive)", fontWeight: 600 }}>
                    -${asset.accumulatedDep.toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>
                    ${asset.netBookValue.toLocaleString()}
                  </td>
                  <td>
                    <div style={{ background: "var(--secondary)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, asset.depreciationProgress || 0)}%`,
                          background: "var(--primary)",
                          height: "100%",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--secondary-foreground)", marginTop: "2px", textAlign: "right" }}>
                      {(asset.depreciationProgress || 0).toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: NUEVO ACTIVO FIJO */}
      {showModal && (
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
          <div className="glass-panel" style={{ background: "var(--card)", padding: "2rem", borderRadius: "var(--radius)", maxWidth: "600px", width: "100%" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Plus color="var(--primary)" size={24} />
              Registrar Activo Fijo
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", marginBottom: "1.5rem" }}>
              Registra un bien de propiedad, planta o equipo para su control contable y depreciación periódica.
            </p>

            <form onSubmit={handleCreateAsset}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className="form-label">Código de Placa</label>
                  <input
                    type="text"
                    placeholder="Ej: ACT-003"
                    className="premium-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Nombre del Activo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Vehículo Utilitario de Carga"
                    className="premium-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className="form-label">Categoría NIIF</label>
                  <select
                    className="premium-input"
                    style={{ width: "100%" }}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="EQUIPMENT">Equipo de Oficina y Cómputo</option>
                    <option value="VEHICLE">Vehículos y Flota</option>
                    <option value="BUILDING">Edificaciones y Locales</option>
                    <option value="INTANGIBLE">Intangibles (Software/Licencias)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Ubicación Física</label>
                  <input
                    type="text"
                    className="premium-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label className="form-label">Costo de Adquisición ($)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="premium-input"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="form-label">Valor Residual ($)</label>
                  <input
                    type="number"
                    min="0"
                    className="premium-input"
                    value={salvageValue}
                    onChange={(e) => setSalvageValue(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="form-label">Vida Útil (Años)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    className="premium-input"
                    value={usefulLifeYears}
                    onChange={(e) => setUsefulLifeYears(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="premium-btn"
                  style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
                >
                  Cancelar
                </button>
                <button type="submit" className="premium-btn">
                  Guardar Activo Fijo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
