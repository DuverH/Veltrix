"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Search,
  Download,
  FileText,
  User,
  Calendar,
  Activity,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Hash,
  RefreshCw,
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [integrityState, setIntegrityState] = useState<{
    verified: boolean;
    isValid?: boolean;
    totalLogs?: number;
    details?: string;
  }>({ verified: false });
  const [isVerifying, setIsVerifying] = useState(false);

  const loadLogs = () => {
    setLoading(true);
    fetch("/api/audit")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch((err) => console.error("Error cargando auditoría:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
    // Ejecutar verificación inicial automática
    fetch("/api/audit?verify=true")
      .then((r) => r.json())
      .then((data) => {
        setIntegrityState({
          verified: true,
          isValid: data.isValid,
          totalLogs: data.totalLogs,
          details: data.details,
        });
      })
      .catch(() => {});
  }, []);

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/audit?verify=true");
      const data = await res.json();
      setIntegrityState({
        verified: true,
        isValid: data.isValid,
        totalLogs: data.totalLogs,
        details: data.details,
      });
    } catch (err) {
      console.error("Error verificando integridad:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,Fecha,Accion,Entidad,ID_Entidad,Usuario,IP,Hash\n" +
      logs
        .map((l) => {
          let hash = "";
          try {
            const p = JSON.parse(l.details || "{}");
            hash = p._crypto?.hash || "";
          } catch {}
          return `"${new Date(l.createdAt).toLocaleString()}","${l.action}","${l.entity}","${l.entityId || ""}","${l.user?.name || "Sistema"}","${l.ipAddress || ""}","${hash}"`;
        })
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((l) => {
    const term = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.entity.toLowerCase().includes(term) ||
      (l.entityId && l.entityId.toLowerCase().includes(term)) ||
      (l.user?.name && l.user.name.toLowerCase().includes(term)) ||
      (l.ipAddress && l.ipAddress.includes(term))
    );
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Shield size={28} color="var(--primary)" />
            Trazabilidad y Auditoría Criptográfica
          </h1>
          <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
            Pista de auditoría inmutable con encadenamiento criptográfico de bloques (SHA-256)
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleVerifyIntegrity}
            disabled={isVerifying}
            className="premium-btn"
            style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <RefreshCw size={16} className={isVerifying ? "animate-spin" : ""} />
            {isVerifying ? "Verificando..." : "Verificar Integridad Ahora"}
          </button>
          <button onClick={handleExportCSV} className="premium-btn">
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Banner de Estado de Integridad Criptográfica */}
      {integrityState.verified && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: integrityState.isValid ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${integrityState.isValid ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            padding: "1.25rem 1.5rem",
            borderRadius: "var(--radius)",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {integrityState.isValid ? (
              <ShieldCheck size={32} color="var(--success)" />
            ) : (
              <ShieldAlert size={32} color="var(--destructive)" />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: integrityState.isValid ? "var(--success)" : "var(--destructive)" }}>
                {integrityState.isValid
                  ? "Cadena de Auditoría 100% Inmutable y Verificada (SHA-256)"
                  : "Alerta: Ruptura detectada en la cadena de auditoría"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
                {integrityState.details}
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.85rem", fontWeight: 600, fontFamily: "monospace", color: "var(--secondary-foreground)" }}>
            Registros protegidos: {integrityState.totalLogs || logs.length}
          </div>
        </div>
      )}

      {/* Tabla de Logs */}
      <div className="table-container">
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ position: "relative", width: "360px" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--secondary-foreground)" }} />
            <input
              type="text"
              placeholder="Buscar por usuario, acción, entidad o IP..."
              className="premium-input"
              style={{ paddingLeft: "2.75rem" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)" }}>
            Total eventos: {logs.length}
          </div>
        </div>

        <table className="premium-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Entidad / Recurso</th>
              <th>Dirección IP</th>
              <th>Hash Criptográfico</th>
              <th style={{ textAlign: "center" }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  Cargando pistas de auditoría...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  No se encontraron eventos de auditoría.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                let cryptoHash = "";
                try {
                  const p = JSON.parse(log.details || "{}");
                  cryptoHash = p._crypto?.hash || "";
                } catch {}

                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Calendar size={14} color="var(--secondary-foreground)" />
                        {new Date(log.createdAt).toLocaleString("es-CO")}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <User size={14} color="var(--secondary-foreground)" />
                        {log.user?.name || "Sistema"}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background:
                            log.action === "LOGIN"
                              ? "rgba(59, 130, 246, 0.1)"
                              : log.action.includes("CREATE") || log.action.includes("POST")
                              ? "rgba(34, 197, 94, 0.1)"
                              : log.action.includes("UPDATE")
                              ? "rgba(234, 179, 8, 0.1)"
                              : log.action.includes("DELETE")
                              ? "rgba(239, 68, 68, 0.1)"
                              : "rgba(168, 85, 247, 0.1)",
                          color:
                            log.action === "LOGIN"
                              ? "#2563eb"
                              : log.action.includes("CREATE") || log.action.includes("POST")
                              ? "var(--success)"
                              : log.action.includes("UPDATE")
                              ? "#ca8a04"
                              : log.action.includes("DELETE")
                              ? "var(--destructive)"
                              : "#9333ea",
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Activity size={14} color="var(--secondary-foreground)" />
                        <span>{log.entity}</span>
                        {log.entityId && (
                          <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>
                            ({log.entityId})
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--secondary-foreground)" }}>
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--primary)" }}>
                      {cryptoHash ? `${cryptoHash.slice(0, 10)}...${cryptoHash.slice(-8)}` : "-"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        style={{
                          background: "var(--secondary)",
                          color: "var(--primary)",
                          border: "none",
                          padding: "0.3rem 0.6rem",
                          borderRadius: "0.4rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <FileText size={12} /> Ver JSON
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: VISOR DE DETALLES Y HASH */}
      {selectedLog && (
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
              padding: "2rem",
              borderRadius: "var(--radius)",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Hash size={20} color="var(--primary)" />
                Inspección Criptográfica de Evento
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--secondary-foreground)" }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              <div>
                <strong>Acción:</strong> {selectedLog.action}
              </div>
              <div>
                <strong>Entidad:</strong> {selectedLog.entity} ({selectedLog.entityId || "N/A"})
              </div>
              <div>
                <strong>Usuario:</strong> {selectedLog.user?.name || "Sistema"}
              </div>
              <div>
                <strong>IP Origen:</strong> {selectedLog.ipAddress || "127.0.0.1"}
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <strong>Fecha exacta:</strong> {new Date(selectedLog.createdAt).toISOString()}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Cuerpo de Auditoría (Payload y Bloque SHA-256)</label>
              <pre
                style={{
                  background: "var(--secondary)",
                  padding: "1rem",
                  borderRadius: "var(--radius)",
                  fontSize: "0.8rem",
                  overflowX: "auto",
                  fontFamily: "monospace",
                }}
              >
                {JSON.stringify(JSON.parse(selectedLog.details || "{}"), null, 2)}
              </pre>
            </div>

            <button onClick={() => setSelectedLog(null)} className="premium-btn" style={{ width: "100%" }}>
              Cerrar Visor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
