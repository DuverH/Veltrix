"use client";

import React, { useState, useEffect } from "react";
import { Lock, FileText, Calendar as CalendarIcon, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";

interface Period {
  id: string;
  period: string;
  status: "OPEN" | "CLOSED";
  closedAt?: string | null;
  closedBy?: string | null;
  notes?: string | null;
}

export default function ClosingPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("2026-02");
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadPeriods = () => {
    setLoading(true);
    fetch("/api/closing")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPeriods(data);
      })
      .catch((err) => console.error("Error cargando períodos:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const handleClosePeriod = async () => {
    if (!confirm(`¿Estás seguro de ejecutar el cierre contable del período ${selectedPeriod}? Esta acción cancelará ingresos y gastos y los trasladará a utilidades retenidas.`)) {
      return;
    }

    setIsClosing(true);
    setResultMsg(null);

    try {
      const res = await fetch("/api/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: selectedPeriod,
          userId: "Contador Principal",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResultMsg({
          type: "success",
          text: `Cierre contable del período ${selectedPeriod} ejecutado exitosamente. Resultado Neto transferido a Utilidades Acumuladas: $${Number(data.netResult || 0).toLocaleString()}`,
        });
        loadPeriods();
      } else {
        setResultMsg({
          type: "error",
          text: data.error || "Ocurrió un error al ejecutar el cierre.",
        });
      }
    } catch (err: any) {
      setResultMsg({
        type: "error",
        text: err.message || "Error en la comunicación con el servidor.",
      });
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "3rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Lock size={28} color="var(--primary)" />
          Cierres Contables de Período
        </h1>
        <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
          Cancela saldos de cuentas de resultados (Clase 4 y 5) y traslada la utilidad o pérdida a utilidades retenidas (3705)
        </p>
      </div>

      {resultMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: resultMsg.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: resultMsg.type === "success" ? "var(--success)" : "var(--destructive)",
            padding: "1rem",
            borderRadius: "var(--radius)",
            marginBottom: "1.5rem",
            border: `1px solid ${resultMsg.type === "success" ? "var(--success)" : "var(--destructive)"}`,
          }}
        >
          {resultMsg.type === "success" ? <CheckCircle size={20} /> : <ShieldAlert size={20} />}
          <span style={{ fontWeight: 500 }}>{resultMsg.text}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "2rem" }}>
        {/* Columna Izquierda: Ejecutar Cierre */}
        <div>
          <div className="glass-panel" style={{ padding: "1.75rem", borderRadius: "var(--radius)", position: "sticky", top: "2rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(79, 70, 229, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
                marginBottom: "1rem",
              }}
            >
              <Lock size={24} />
            </div>

            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Nuevo Cierre Mensual</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", marginBottom: "1.5rem" }}>
              Al cerrar un período, el sistema genera automáticamente un asiento contable de cierre (`CLOSING`), dejando en cero los ingresos y gastos para el siguiente ciclo.
            </p>

            <div style={{ marginBottom: "1.25rem" }}>
              <label className="form-label">Seleccionar Mes a Cerrar</label>
              <input
                type="month"
                className="premium-input"
                style={{ width: "100%", fontWeight: 600 }}
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              />
            </div>

            <div
              style={{
                background: "rgba(234, 179, 8, 0.1)",
                border: "1px solid rgba(234, 179, 8, 0.3)",
                borderRadius: "var(--radius)",
                padding: "1rem",
                marginBottom: "1.5rem",
                display: "flex",
                gap: "0.75rem",
              }}
            >
              <AlertTriangle size={20} color="#ca8a04" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div style={{ fontSize: "0.8rem", color: "#854d0e" }}>
                <strong>Principio de inmutabilidad contable:</strong>
                <br />
                Una vez cerrado el período, queda bloqueado para nuevos registros sin reapertura formal.
              </div>
            </div>

            <button
              onClick={handleClosePeriod}
              disabled={isClosing}
              className="premium-btn"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {isClosing ? "Ejecutando Cierre..." : `Ejecutar Cierre de ${selectedPeriod}`}
            </button>
          </div>
        </div>

        {/* Columna Derecha: Historial de Períodos */}
        <div>
          <div className="table-container">
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={20} color="var(--primary)" />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Historial de Períodos Contables</h3>
            </div>

            <div>
              {loading ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--secondary-foreground)" }}>
                  Cargando historial de períodos...
                </div>
              ) : periods.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--secondary-foreground)" }}>
                  No hay cierres previos registrados. Puedes ejecutar el primer cierre mensual usando el panel lateral.
                </div>
              ) : (
                periods.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: "1.25rem 1.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "var(--radius)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: p.status === "CLOSED" ? "var(--secondary)" : "rgba(34, 197, 94, 0.1)",
                          color: p.status === "CLOSED" ? "var(--secondary-foreground)" : "var(--success)",
                        }}
                      >
                        <CalendarIcon size={22} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Período {p.period}</h4>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: p.status === "CLOSED" ? "#64748b" : "var(--success)",
                              display: "inline-block",
                            }}
                          />
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: p.status === "CLOSED" ? "var(--secondary-foreground)" : "var(--success)" }}>
                            {p.status === "CLOSED" ? "Período Cerrado" : "Período Abierto"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      {p.status === "CLOSED" ? (
                        <>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                            {p.closedAt ? new Date(p.closedAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>
                            Por: {p.closedBy || "Sistema"}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--primary)", background: "rgba(79, 70, 229, 0.08)", padding: "0.3rem 0.6rem", borderRadius: "0.5rem" }}>
                          Permite nuevos asientos
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
