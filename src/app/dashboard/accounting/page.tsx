"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Download,
  Search,
  BookOpen,
  Scale,
  ListTree,
  Calendar,
  CheckCircle,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
} from "lucide-react";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype?: string | null;
  allowsEntry: boolean;
}

interface JournalLine {
  id?: string;
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
  account?: Account;
}

interface JournalEntry {
  id: string;
  number: number | null;
  date: string;
  description: string;
  reference?: string | null;
  type: string;
  status: string;
  lines: JournalLine[];
}

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<"journal" | "accounts" | "trial" | "ledger">("journal");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trialBalance, setTrialBalance] = useState<any[]>([]);
  const [ledgerMovements, setLedgerMovements] = useState<any[]>([]);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Modal Nuevo Asiento
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryDesc, setEntryDesc] = useState("");
  const [entryRef, setEntryRef] = useState("");
  const [lines, setLines] = useState<Array<{ accountId: string; description: string; debit: number; credit: number }>>([
    { accountId: "", description: "", debit: 0, credit: 0 },
    { accountId: "", description: "", debit: 0, credit: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Cargar datos según pestaña
  const loadData = () => {
    setLoading(true);
    if (activeTab === "journal") {
      fetch("/api/journal")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setEntries(data);
        })
        .finally(() => setLoading(false));
    } else if (activeTab === "accounts") {
      fetch("/api/accounts")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setAccounts(data);
        })
        .finally(() => setLoading(false));
    } else if (activeTab === "trial") {
      fetch("/api/journal?view=trial-balance")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setTrialBalance(data);
        })
        .finally(() => setLoading(false));
    } else if (activeTab === "ledger") {
      // Cargar cuentas para selector si no están cargadas
      if (accounts.length === 0) {
        fetch("/api/accounts")
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setAccounts(data);
              const firstEntryAcc = data.find((a) => a.allowsEntry);
              if (firstEntryAcc && !selectedLedgerAccount) {
                setSelectedLedgerAccount(firstEntryAcc.id);
              }
            }
          });
      }
      if (selectedLedgerAccount) {
        fetch(`/api/journal?view=ledger&accountId=${selectedLedgerAccount}`)
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) setLedgerMovements(data);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedLedgerAccount]);

  // Cargar cuentas iniciales para el modal de nuevo asiento
  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAccounts(data);
      });
  }, []);

  // Cálculos de partida doble para el modal
  const totalDebits = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredits = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference < 0.001 && totalDebits > 0;

  // Manejadores de líneas en modal
  const handleAddLine = () => {
    setLines([...lines, { accountId: "", description: "", debit: 0, credit: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const handleLineChange = (idx: number, field: string, value: any) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  };

  // Guardar asiento
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: entryDate,
          description: entryDesc,
          reference: entryRef || undefined,
          lines: lines.map((l) => ({
            accountId: l.accountId,
            description: l.description || entryDesc,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowNewEntryModal(false);
        setEntryDesc("");
        setEntryRef("");
        setLines([
          { accountId: "", description: "", debit: 0, credit: 0 },
          { accountId: "", description: "", debit: 0, credit: 0 },
        ]);
        setFeedback("Asiento contable registrado y asentado correctamente.");
        setTimeout(() => setFeedback(null), 4000);
        loadData();
      } else {
        alert(data.error || "Error al crear el asiento.");
      }
    } catch (err) {
      console.error("Error guardando asiento:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exportar CSV
  const handleExport = () => {
    let csv = "";
    if (activeTab === "journal") {
      csv =
        "data:text/csv;charset=utf-8,Numero,Fecha,Descripcion,Referencia,Estado,Total\n" +
        entries
          .map((e) => {
            const total = e.lines?.reduce((s, l) => s + l.debit, 0) || 0;
            return `${e.number || e.id},${new Date(e.date).toISOString().split("T")[0]},"${e.description.replace(/"/g, '""')}",${e.reference || ""},${e.status},${total}`;
          })
          .join("\n");
    } else if (activeTab === "trial") {
      csv =
        "data:text/csv;charset=utf-8,Codigo,Cuenta,Total Debitos,Total Creditos,Saldo\n" +
        trialBalance
          .map((t) => `${t.code},"${t.name.replace(/"/g, '""')}",${t.debitTotal},${t.creditTotal},${t.balance}`)
          .join("\n");
    } else if (activeTab === "accounts") {
      csv =
        "data:text/csv;charset=utf-8,Codigo,Nombre,Clase,Subtipo\n" +
        accounts.map((a) => `${a.code},"${a.name.replace(/"/g, '""')}",${a.type},${a.subtype || ""}`).join("\n");
    }

    if (csv) {
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csv));
      link.setAttribute("download", `reporte_contable_${activeTab}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const entryAccounts = accounts.filter((a) => a.allowsEntry);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <BookOpen size={28} color="var(--primary)" />
            Contabilidad General
          </h1>
          <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
            Libro Diario, Plan Único de Cuentas, Balanza de Comprobación y Libro Mayor
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleExport}
            className="premium-btn"
            style={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <Download size={18} />
            Exportar
          </button>
          <button onClick={() => setShowNewEntryModal(true)} className="premium-btn">
            <Plus size={18} />
            Nuevo Asiento Contable
          </button>
        </div>
      </div>

      {feedback && (
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
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
        {[
          { id: "journal", label: "Libro Diario", icon: BookOpen },
          { id: "accounts", label: "Plan de Cuentas (PUC)", icon: ListTree },
          { id: "trial", label: "Balanza de Comprobación", icon: Scale },
          { id: "ledger", label: "Libro Mayor", icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                background: "none",
                border: "none",
                borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                color: isActive ? "var(--primary)" : "var(--foreground)",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                fontSize: "0.95rem",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIBRO DIARIO */}
      {activeTab === "journal" && (
        <div className="table-container">
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative", width: "320px" }}>
              <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--secondary-foreground)" }} />
              <input
                type="text"
                placeholder="Buscar por descripción o número..."
                className="premium-input"
                style={{ paddingLeft: "2.75rem" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--secondary-foreground)" }}>
              Mostrando {entries.length} comprobantes asentados
            </div>
          </div>

          <table className="premium-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}></th>
                <th>N° / ID</th>
                <th>Fecha</th>
                <th>Descripción y Referencia</th>
                <th>Tipo</th>
                <th style={{ textAlign: "right" }}>Monto Débito / Crédito</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                    Cargando asientos contables...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                    No hay asientos contables registrados.
                  </td>
                </tr>
              ) : (
                entries
                  .filter(
                    (e) =>
                      e.description.toLowerCase().includes(search.toLowerCase()) ||
                      (e.reference && e.reference.toLowerCase().includes(search.toLowerCase())) ||
                      (e.number && e.number.toString().includes(search))
                  )
                  .map((entry) => {
                    const isExpanded = expandedEntryId === entry.id;
                    const entryTotal = entry.lines?.reduce((sum, l) => sum + l.debit, 0) || 0;
                    return (
                      <React.Fragment key={entry.id}>
                        <tr
                          onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} color="var(--secondary-foreground)" />}
                          </td>
                          <td style={{ fontWeight: 700, fontFamily: "monospace" }}>
                            #{entry.number ? String(entry.number).padStart(4, "0") : entry.id.slice(-6)}
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            {new Date(entry.date).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" })}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{entry.description}</div>
                            {entry.reference && (
                              <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", fontFamily: "monospace" }}>
                                Ref: {entry.reference}
                              </div>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: "0.75rem", background: "var(--secondary)", padding: "0.2rem 0.5rem", borderRadius: "0.5rem" }}>
                              {entry.type}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>
                            ${entryTotal.toLocaleString()}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: "0.25rem 0.6rem",
                                borderRadius: "1rem",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                backgroundColor: entry.status === "POSTED" ? "rgba(34, 197, 94, 0.1)" : "rgba(234, 179, 8, 0.1)",
                                color: entry.status === "POSTED" ? "var(--success)" : "#eab308",
                              }}
                            >
                              {entry.status === "POSTED" ? "ASENTADO" : "BORRADOR"}
                            </span>
                          </td>
                        </tr>

                        {/* Desglose de Líneas de Partida Doble */}
                        {isExpanded && (
                          <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                            <td colSpan={7} style={{ padding: "1rem 2rem" }}>
                              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem" }}>
                                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--secondary-foreground)", marginBottom: "0.75rem" }}>
                                  Líneas Contables del Asiento #{entry.number || entry.id}
                                </div>
                                <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                                  <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--secondary-foreground)" }}>
                                      <th style={{ padding: "0.5rem 0" }}>Código</th>
                                      <th>Cuenta Contable</th>
                                      <th>Detalle / Concepto</th>
                                      <th style={{ textAlign: "right" }}>Débito</th>
                                      <th style={{ textAlign: "right" }}>Crédito</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entry.lines?.map((line, lIdx) => (
                                      <tr key={lIdx} style={{ borderBottom: "1px dashed var(--border)" }}>
                                        <td style={{ padding: "0.5rem 0", fontFamily: "monospace", fontWeight: 600 }}>
                                          {line.account?.code || "-"}
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{line.account?.name || "-"}</td>
                                        <td style={{ color: "var(--secondary-foreground)" }}>{line.description || "-"}</td>
                                        <td style={{ textAlign: "right", fontWeight: line.debit > 0 ? 600 : 400 }}>
                                          {line.debit > 0 ? `$${line.debit.toLocaleString()}` : "-"}
                                        </td>
                                        <td style={{ textAlign: "right", fontWeight: line.credit > 0 ? 600 : 400 }}>
                                          {line.credit > 0 ? `$${line.credit.toLocaleString()}` : "-"}
                                        </td>
                                      </tr>
                                    ))}
                                    <tr style={{ fontWeight: 700 }}>
                                      <td colSpan={3} style={{ padding: "0.75rem 0", textAlign: "right" }}>
                                        Sumas Iguales:
                                      </td>
                                      <td style={{ textAlign: "right", color: "var(--primary)" }}>
                                        ${entryTotal.toLocaleString()}
                                      </td>
                                      <td style={{ textAlign: "right", color: "var(--primary)" }}>
                                        ${entryTotal.toLocaleString()}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: PLAN DE CUENTAS (PUC) */}
      {activeTab === "accounts" && (
        <div className="table-container">
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ position: "relative", width: "320px" }}>
              <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--secondary-foreground)" }} />
              <input
                type="text"
                placeholder="Buscar por código o nombre de cuenta..."
                className="premium-input"
                style={{ paddingLeft: "2.75rem" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--secondary-foreground)" }}>
              Catálogo estructurado PUC ({accounts.length} cuentas)
            </div>
          </div>

          <table className="premium-table">
            <thead>
              <tr>
                <th>Código PUC</th>
                <th>Nombre de la Cuenta</th>
                <th>Clase / Naturaleza</th>
                <th>Subtipo</th>
                <th>Permite Movimientos</th>
              </tr>
            </thead>
            <tbody>
              {accounts
                .filter((a) => a.code.includes(search) || a.name.toLowerCase().includes(search.toLowerCase()))
                .map((acc) => (
                  <tr key={acc.id} style={{ fontWeight: acc.allowsEntry ? 400 : 700 }}>
                    <td style={{ fontFamily: "monospace", color: "var(--primary)" }}>{acc.code}</td>
                    <td>{acc.name}</td>
                    <td>
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background:
                            acc.type === "ASSET"
                              ? "rgba(59, 130, 246, 0.1)"
                              : acc.type === "LIABILITY"
                              ? "rgba(239, 68, 68, 0.1)"
                              : acc.type === "EQUITY"
                              ? "rgba(168, 85, 247, 0.1)"
                              : acc.type === "REVENUE"
                              ? "rgba(34, 197, 94, 0.1)"
                              : "rgba(234, 179, 8, 0.1)",
                          color:
                            acc.type === "ASSET"
                              ? "#2563eb"
                              : acc.type === "LIABILITY"
                              ? "#dc2626"
                              : acc.type === "EQUITY"
                              ? "#9333ea"
                              : acc.type === "REVENUE"
                              ? "#16a34a"
                              : "#ca8a04",
                        }}
                      >
                        {acc.type === "ASSET"
                          ? "ACTIVO"
                          : acc.type === "LIABILITY"
                          ? "PASIVO"
                          : acc.type === "EQUITY"
                          ? "PATRIMONIO"
                          : acc.type === "REVENUE"
                          ? "INGRESOS"
                          : "GASTOS / COSTOS"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)" }}>{acc.subtype || "-"}</td>
                    <td>
                      {acc.allowsEntry ? (
                        <span style={{ color: "var(--success)", fontSize: "0.8rem", fontWeight: 600 }}>Sí (Detalle)</span>
                      ) : (
                        <span style={{ color: "var(--secondary-foreground)", fontSize: "0.8rem" }}>No (Grupo/Título)</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: BALANZA DE COMPROBACIÓN (TRIAL BALANCE) */}
      {activeTab === "trial" && (
        <div className="table-container">
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Balanza de Comprobación (Sumas y Saldos)</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--secondary-foreground)" }}>
              Verifica el principio de partida doble y el saldo acumulado en todas las cuentas con movimientos
            </p>
          </div>

          <table className="premium-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cuenta</th>
                <th style={{ textAlign: "right" }}>Total Débitos</th>
                <th style={{ textAlign: "right" }}>Total Créditos</th>
                <th style={{ textAlign: "right" }}>Saldo Final</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                    Calculando balanza de comprobación...
                  </td>
                </tr>
              ) : trialBalance.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                    No se encontraron movimientos registrados en el período.
                  </td>
                </tr>
              ) : (
                <>
                  {trialBalance.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{item.code}</td>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td style={{ textAlign: "right" }}>${item.debitTotal.toLocaleString()}</td>
                      <td style={{ textAlign: "right" }}>${item.creditTotal.toLocaleString()}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: item.balance >= 0 ? "inherit" : "var(--destructive)" }}>
                        ${item.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {/* Fila de Sumas Iguales */}
                  <tr style={{ background: "var(--secondary)", fontWeight: 700, fontSize: "0.95rem" }}>
                    <td colSpan={2} style={{ textAlign: "right", padding: "1rem" }}>
                      SUMAS IGUALES TOTALES:
                    </td>
                    <td style={{ textAlign: "right", color: "var(--primary)" }}>
                      ${trialBalance.reduce((s, i) => s + i.debitTotal, 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--primary)" }}>
                      ${trialBalance.reduce((s, i) => s + i.creditTotal, 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--success)" }}>
                      <CheckCircle size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                      Cuadrado
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: LIBRO MAYOR (LEDGER) */}
      {activeTab === "ledger" && (
        <div>
          <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "var(--radius)", marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
              Seleccionar Cuenta para ver su Libro Mayor:
            </label>
            <select
              value={selectedLedgerAccount}
              onChange={(e) => setSelectedLedgerAccount(e.target.value)}
              className="premium-input"
              style={{ width: "100%", maxWidth: "500px", fontWeight: 600 }}
            >
              {entryAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>N° Asiento</th>
                  <th>Descripción del Movimiento</th>
                  <th style={{ textAlign: "right" }}>Débito</th>
                  <th style={{ textAlign: "right" }}>Crédito</th>
                  <th style={{ textAlign: "right" }}>Saldo Progresivo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                      Cargando movimientos de la cuenta...
                    </td>
                  </tr>
                ) : ledgerMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                      No hay movimientos registrados para esta cuenta contable.
                    </td>
                  </tr>
                ) : (
                  ledgerMovements.map((mov, mIdx) => (
                    <tr key={mIdx}>
                      <td>{new Date(mov.date).toLocaleDateString("es-CO")}</td>
                      <td style={{ fontFamily: "monospace" }}>#{mov.entryNumber || "-"}</td>
                      <td style={{ fontWeight: 500 }}>{mov.description}</td>
                      <td style={{ textAlign: "right", color: mov.debit > 0 ? "var(--foreground)" : "var(--secondary-foreground)" }}>
                        {mov.debit > 0 ? `$${mov.debit.toLocaleString()}` : "-"}
                      </td>
                      <td style={{ textAlign: "right", color: mov.credit > 0 ? "var(--foreground)" : "var(--secondary-foreground)" }}>
                        {mov.credit > 0 ? `$${mov.credit.toLocaleString()}` : "-"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>
                        ${mov.runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO ASIENTO CONTABLE */}
      {showNewEntryModal && (
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
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Plus color="var(--primary)" size={24} />
                Nuevo Asiento de Diario
              </h3>
              <button
                onClick={() => setShowNewEntryModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--secondary-foreground)" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEntry}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    required
                    className="premium-input"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Descripción General</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pago de honorarios asesoría tributaria..."
                    className="premium-input"
                    value={entryDesc}
                    onChange={(e) => setEntryDesc(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Referencia Externa</label>
                  <input
                    type="text"
                    placeholder="Ej: FAC-9021"
                    className="premium-input"
                    value={entryRef}
                    onChange={(e) => setEntryRef(e.target.value)}
                  />
                </div>
              </div>

              {/* Editor de Líneas Contables */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h4 style={{ fontWeight: 600, fontSize: "0.95rem" }}>Líneas del Asiento (Partida Doble)</h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="premium-btn"
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem", background: "var(--secondary)", color: "var(--secondary-foreground)" }}
                  >
                    + Agregar Línea
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {lines.map((line, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "3fr 2.5fr 1.5fr 1.5fr 40px",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <select
                        required
                        value={line.accountId}
                        onChange={(e) => handleLineChange(idx, "accountId", e.target.value)}
                        className="premium-input"
                        style={{ fontSize: "0.8rem", padding: "0.4rem" }}
                      >
                        <option value="">-- Seleccionar Cuenta PUC --</option>
                        {entryAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Detalle de línea..."
                        className="premium-input"
                        style={{ fontSize: "0.8rem", padding: "0.4rem" }}
                        value={line.description}
                        onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                      />

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Débito"
                        className="premium-input"
                        style={{ fontSize: "0.8rem", padding: "0.4rem", textAlign: "right" }}
                        value={line.debit || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleLineChange(idx, "debit", val);
                          if (val > 0) handleLineChange(idx, "credit", 0);
                        }}
                      />

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Crédito"
                        className="premium-input"
                        style={{ fontSize: "0.8rem", padding: "0.4rem", textAlign: "right" }}
                        value={line.credit || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          handleLineChange(idx, "credit", val);
                          if (val > 0) handleLineChange(idx, "debit", 0);
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lines.length <= 2}
                        style={{
                          background: "none",
                          border: "none",
                          color: lines.length > 2 ? "var(--destructive)" : "var(--border)",
                          cursor: lines.length > 2 ? "pointer" : "default",
                          padding: "0.25rem",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barra de Balanceo en Vivo */}
              <div
                style={{
                  background: isBalanced ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: `1px solid ${isBalanced ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  borderRadius: "var(--radius)",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {isBalanced ? (
                      <CheckCircle size={20} color="var(--success)" />
                    ) : (
                      <AlertCircle size={20} color="var(--destructive)" />
                    )}
                    <span style={{ fontWeight: 700, color: isBalanced ? "var(--success)" : "var(--destructive)" }}>
                      {isBalanced ? "Asiento Balanceado (Partida Doble Cumplida)" : "Asiento Desbalanceado"}
                    </span>
                  </div>
                  {!isBalanced && (
                    <div style={{ fontSize: "0.8rem", color: "var(--destructive)", marginTop: "0.25rem" }}>
                      Diferencia por cuadrar: ${difference.toFixed(2)}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "2rem", textAlign: "right" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>Total Débitos</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>${totalDebits.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>Total Créditos</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>${totalCredits.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowNewEntryModal(false)}
                  className="premium-btn"
                  style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={!isBalanced || isSubmitting} className="premium-btn">
                  {isSubmitting ? "Guardando..." : "Asentar en Libro Diario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
