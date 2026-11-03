"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  RefreshCcw,
  Download,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Sparkles,
  DollarSign,
  Building2,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Zap,
} from "lucide-react";

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  currentBalance: number;
}

interface BankTx {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  reference?: string | null;
  isReconciled: boolean;
}

export default function BankReconciliationPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [transactions, setTransactions] = useState<BankTx[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modales y estados
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvInput, setCsvInput] = useState("");
  const [autoMatchResult, setAutoMatchResult] = useState<any>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar cuentas bancarias
  useEffect(() => {
    fetch("/api/bank")
      .then((res) => res.json())
      .then((accounts) => {
        if (Array.isArray(accounts) && accounts.length > 0) {
          setBankAccounts(accounts);
          setSelectedAccountId(accounts[0].id);
        }
      })
      .catch((err) => console.error("Error cargando cuentas bancarias:", err))
      .finally(() => setLoading(false));
  }, []);

  // Cargar transacciones y resumen al seleccionar cuenta
  const loadAccountData = (accountId: string) => {
    if (!accountId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/bank?accountId=${accountId}`).then((r) => r.json()),
      fetch(`/api/bank?accountId=${accountId}&summary=true`).then((r) => r.json()),
    ])
      .then(([txs, sum]) => {
        if (Array.isArray(txs)) setTransactions(txs);
        if (sum) setSummary(sum);
      })
      .catch((err) => console.error("Error actualizando datos bancarios:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedAccountId) {
      loadAccountData(selectedAccountId);
    }
  }, [selectedAccountId]);

  // Ejecutar Auto-Matching
  const handleRunAutoMatch = async () => {
    if (!selectedAccountId) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "auto-match",
            bankAccountId: selectedAccountId,
          }),
        });
        const data = await res.json();
        setAutoMatchResult(data);
        setShowMatchModal(true);
        loadAccountData(selectedAccountId);
      } catch (err) {
        console.error("Error en auto-matching:", err);
      }
    });
  };

  // Toggle Conciliación Manual
  const handleToggleReconcile = async (txId: string) => {
    try {
      await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-reconcile",
          transactionId: txId,
        }),
      });
      loadAccountData(selectedAccountId);
    } catch (err) {
      console.error("Error conciliando:", err);
    }
  };

  // Gasto Rápido 4x1000 o Comisión
  const handleQuickExpense = async (txId: string, expenseType: "GMF_4X1000" | "BANK_FEE") => {
    try {
      const res = await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quick-expense",
          bankAccountId: selectedAccountId,
          transactionId: txId,
          expenseType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Asiento contable de ${expenseType === "GMF_4X1000" ? "GMF 4x1000" : "Comisión"} creado exitosamente.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        loadAccountData(selectedAccountId);
      }
    } catch (err) {
      console.error("Error registrando gasto rápido:", err);
    }
  };

  // Importar CSV
  const handleImportCSV = async () => {
    if (!csvInput.trim() || !selectedAccountId) return;
    try {
      const res = await fetch("/api/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import-csv",
          bankAccountId: selectedAccountId,
          csvContent: csvInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowImportModal(false);
        setCsvInput("");
        setSuccessMsg(`Se importaron ${data.count} movimientos bancarios correctamente.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        loadAccountData(selectedAccountId);
      } else {
        alert(data.error || "Error al importar el extracto.");
      }
    } catch (err) {
      console.error("Error importando CSV:", err);
    }
  };

  // Exportar CSV
  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Fecha,Descripcion,Referencia,Tipo,Monto,Conciliado\n" +
      transactions
        .map(
          (t) =>
            `${new Date(t.date).toISOString().split("T")[0]},"${t.description.replace(/"/g, '""')}",${t.reference || ""},${t.type},${t.amount},${t.isReconciled ? "SI" : "NO"}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `conciliacion_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedAccount = bankAccounts.find((a) => a.id === selectedAccountId);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <RefreshCcw size={28} color="var(--primary)" />
            Conciliación Bancaria Inteligente
          </h1>
          <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
            Cruce automático entre extractos bancarios y libro diario contable
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowImportModal(true)}
            className="premium-btn"
            style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <UploadCloud size={18} />
            Importar Extracto
          </button>
          <button
            onClick={handleExportCSV}
            className="premium-btn"
            style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button
            onClick={handleRunAutoMatch}
            disabled={isPending}
            className="premium-btn"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "white" }}
          >
            <Sparkles size={18} />
            {isPending ? "Analizando..." : "Auto-Conciliación Inteligente"}
          </button>
        </div>
      </div>

      {/* Alerta de éxito */}
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

      {/* Selector de cuenta bancaria y tarjeta de saldo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "var(--radius)" }}>
          <label style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 600, color: "var(--secondary-foreground)", display: "block", marginBottom: "0.5rem" }}>
            Cuenta Bancaria Activa
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="premium-input"
            style={{ width: "100%", fontWeight: 600 }}
          >
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} - {acc.accountNumber} ({acc.bankName})
              </option>
            ))}
          </select>
          <div style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)", marginTop: "0.5rem" }}>
            Banco: <strong>{selectedAccount?.bankName || "N/A"}</strong> | N°: {selectedAccount?.accountNumber || "N/A"}
          </div>
        </div>

        {/* KPI 1: Saldo en Libros */}
        <div className="metric-card">
          <div className="metric-title">Saldo en Libros Contables</div>
          <div className="metric-value" style={{ color: "var(--primary)" }}>
            ${(summary?.bookBalance || selectedAccount?.currentBalance || 0).toLocaleString()}
          </div>
          <div className="metric-trend" style={{ color: "var(--secondary-foreground)" }}>
            Cuenta contable 1110 (Bancos)
          </div>
        </div>

        {/* KPI 2: Conciliadas vs Pendientes */}
        <div className="metric-card">
          <div className="metric-title">Movimientos en Extracto</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.25rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--success)" }}>
              {summary?.reconciledCount || 0}
            </span>
            <span style={{ fontSize: "0.875rem", color: "var(--secondary-foreground)" }}>conciliadas /</span>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#eab308" }}>
              {summary?.unreconciledCount || 0}
            </span>
            <span style={{ fontSize: "0.875rem", color: "var(--secondary-foreground)" }}>pendientes</span>
          </div>
          <div className="metric-trend" style={{ color: "var(--secondary-foreground)" }}>
            Total registros: {summary?.totalCount || transactions.length}
          </div>
        </div>

        {/* KPI 3: Estado de Balance */}
        <div className="metric-card">
          <div className="metric-title">Diferencia Neta</div>
          <div className="metric-value" style={{ color: summary?.unreconciledCount === 0 ? "var(--success)" : "#eab308" }}>
            ${(summary?.difference || 0).toLocaleString()}
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            {summary?.unreconciledCount === 0 ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--success)", fontSize: "0.75rem", fontWeight: 700, background: "rgba(34, 197, 94, 0.15)", padding: "0.25rem 0.5rem", borderRadius: "1rem" }}>
                <CheckCircle size={12} /> CONCILIACIÓN CUADRADA
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#eab308", fontSize: "0.75rem", fontWeight: 700, background: "rgba(234, 179, 8, 0.15)", padding: "0.25rem 0.5rem", borderRadius: "1rem" }}>
                <AlertCircle size={12} /> {summary?.unreconciledCount} PARTIDAS PENDIENTES
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Movimientos del Extracto */}
      <div className="table-container">
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Detalle de Transacciones del Extracto</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--secondary-foreground)" }}>
              Haz clic en "Hacer Match" para conciliar manualmente o crea un asiento de gasto en 1 clic
            </p>
          </div>
        </div>

        <table className="premium-table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Descripción del Banco</th>
              <th>Referencia</th>
              <th style={{ textAlign: "right" }}>Monto</th>
              <th style={{ textAlign: "center" }}>Acciones de Conciliación</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  Cargando movimientos bancarios...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  No hay transacciones registradas para esta cuenta. Utiliza el botón "Importar Extracto" para cargar un archivo CSV.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} style={{ background: tx.isReconciled ? "transparent" : "rgba(234, 179, 8, 0.02)" }}>
                  <td>
                    {tx.isReconciled ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          color: "var(--success)",
                          background: "rgba(34, 197, 94, 0.1)",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "1rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle size={13} /> Conciliado
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          color: "#eab308",
                          background: "rgba(234, 179, 8, 0.1)",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "1rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        <AlertCircle size={13} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(tx.date).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" })}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {tx.description}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--secondary-foreground)" }}>
                    {tx.reference || "-"}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: 700,
                      color: tx.type === "CREDIT" ? "var(--success)" : "var(--foreground)",
                    }}
                  >
                    {tx.type === "CREDIT" ? "+" : "-"}${tx.amount.toLocaleString()}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleToggleReconcile(tx.id)}
                        style={{
                          background: tx.isReconciled ? "var(--secondary)" : "rgba(79, 70, 229, 0.1)",
                          color: tx.isReconciled ? "var(--secondary-foreground)" : "var(--primary)",
                          border: "none",
                          padding: "0.35rem 0.75rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {tx.isReconciled ? "Desmarcar" : "Hacer Match"}
                      </button>

                      {/* Botón de Gasto Rápido 4x1000 si es débito no conciliado */}
                      {!tx.isReconciled && tx.type === "DEBIT" && (
                        <button
                          onClick={() => handleQuickExpense(tx.id, tx.description.toLowerCase().includes("4x1000") || tx.description.toLowerCase().includes("gmf") ? "GMF_4X1000" : "BANK_FEE")}
                          title="Crea automáticamente el asiento contable de gasto deducible (5305 vs 1110)"
                          style={{
                            background: "rgba(234, 179, 8, 0.15)",
                            color: "#b45309",
                            border: "1px solid rgba(234, 179, 8, 0.3)",
                            padding: "0.35rem 0.6rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <Zap size={12} /> Gasto 1-Clic
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Importar Extracto Bancario */}
      {showImportModal && (
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
              <UploadCloud color="var(--primary)" size={24} />
              Importar Extracto Bancario (CSV)
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--secondary-foreground)", marginBottom: "1rem" }}>
              Pega las líneas de tu extracto bancario en formato CSV (Fecha, Descripción, Referencia, Tipo [DEBIT/CREDIT], Monto).
            </p>

            <div style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                onClick={() => {
                  setCsvInput(
                    `Fecha,Descripcion,Referencia,Tipo,Monto\n` +
                    `2026-03-08,PAGO TRANSFERENCIA PROVEEDOR MADERAS,TR-88991,DEBIT,2500000\n` +
                    `2026-03-09,RECAUDO FACTURA CLIENTE ANDINA,TR-99002,CREDIT,5400000\n` +
                    `2026-03-10,COMISION CHEQUE GERENCIA,BANCO-02,DEBIT,35000\n` +
                    `2026-03-10,GRAVAMEN 4X1000 RETIRO,GMF-02,DEBIT,14000`
                  );
                }}
                style={{
                  background: "var(--secondary)",
                  color: "var(--secondary-foreground)",
                  border: "none",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  marginBottom: "0.5rem",
                }}
              >
                Cargar plantilla de ejemplo
              </button>

              <textarea
                rows={7}
                className="premium-input"
                style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8rem" }}
                placeholder="Fecha,Descripcion,Referencia,Tipo,Monto&#10;2026-03-10,Consignacion Cliente,REF123,CREDIT,1500000"
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => setShowImportModal(false)}
                className="premium-btn"
                style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
              >
                Cancelar
              </button>
              <button onClick={handleImportCSV} className="premium-btn">
                Importar Transacciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Resultados del Auto-Matching */}
      {showMatchModal && autoMatchResult && (
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
          <div className="glass-panel" style={{ background: "var(--card)", padding: "2rem", borderRadius: "var(--radius)", maxWidth: "750px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles color="var(--primary)" size={24} />
                Resultados de Auto-Conciliación Inteligente
              </h3>
              <button
                onClick={() => setShowMatchModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--secondary-foreground)" }}
              >
                ×
              </button>
            </div>

            <div style={{ background: "rgba(79, 70, 229, 0.08)", padding: "1rem", borderRadius: "var(--radius)", marginBottom: "1.5rem" }}>
              <p style={{ fontWeight: 600, color: "var(--primary)", fontSize: "0.95rem" }}>
                El algoritmo analizó {autoMatchResult.results?.length || 0} movimientos con el libro diario.
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
                Se encontraron {autoMatchResult.matchedCount || 0} coincidencias directas por monto, fecha y referencia contable.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {autoMatchResult.results?.map((res: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: "0.875rem",
                    borderRadius: "0.5rem",
                    border: `1px solid ${res.confidence >= 70 ? "rgba(34, 197, 94, 0.4)" : "var(--border)"}`,
                    background: res.confidence >= 70 ? "rgba(34, 197, 94, 0.04)" : "var(--card)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {res.bankTx.description} (${res.bankTx.amount.toLocaleString()})
                    </div>
                    <div>
                      {res.confidence >= 70 ? (
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--success)", background: "rgba(34, 197, 94, 0.15)", padding: "0.2rem 0.5rem", borderRadius: "0.5rem" }}>
                          Score: {res.confidence}% (Coincide)
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", background: "var(--secondary)", padding: "0.2rem 0.5rem", borderRadius: "0.5rem" }}>
                          Sin Coincidencia
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)" }}>
                    {res.reason}
                  </div>
                  {res.journalLine && (
                    <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", background: "rgba(0,0,0,0.03)", padding: "0.4rem 0.6rem", borderRadius: "0.25rem" }}>
                      Asiento Contable: {res.journalLine.accountCode} - {res.journalLine.accountName} | {res.journalLine.description}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setShowMatchModal(false)} className="premium-btn" style={{ width: "100%" }}>
              Aceptar y Volver a la Conciliación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
