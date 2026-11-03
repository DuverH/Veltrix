"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Download,
  Eye,
  ShieldCheck,
  Building,
  QrCode,
  X,
  Trash2,
  FileCheck2,
  UserCheck,
} from "lucide-react";

interface InvoiceLine {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total?: number;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate?: string | null;
  type?: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  discountAmt?: number;
  status: string;
  cufe?: string | null;
  xmlData?: string | null;
  contact?: { name: string; taxId?: string | null } | null;
  lines: InvoiceLine[];
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"sales" | "support_doc">("sales");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modales
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSupportDocModal, setShowSupportDocModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Formulario nueva factura de venta
  const [contactId, setContactId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [issueElectronic, setIssueElectronic] = useState(true);
  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: "Servicios de consultoría y desarrollo de software", quantity: 1, unitPrice: 4500000, taxRate: 19 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario Documento Soporte Electrónico
  const [supportDocData, setSupportDocData] = useState({
    contactId: "",
    date: new Date().toISOString().split("T")[0],
    description: "Servicios técnicos independientes de diseño y soporte en sitio",
    amount: 1800000,
    retefuenteRate: 4, // 4% servicios
    notes: "Cuenta de cobro soporte por persona natural no obligada a expedir factura",
    issue: true,
  });

  const loadInvoices = () => {
    setLoading(true);
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInvoices(data);
      })
      .catch((err) => console.error("Error cargando facturas:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setContacts(data);
          if (data.length > 0) {
            setContactId(data[0].id);
            setSupportDocData((prev) => ({ ...prev, contactId: data[0].id }));
          }
        }
      });
  }, []);

  const handleAddLine = () => {
    setLines([...lines, { description: "", quantity: 1, unitPrice: 0, taxRate: 19 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const handleLineChange = (idx: number, field: string, val: any) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: val };
    setLines(updated);
  };

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const taxAmount = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * ((Number(l.taxRate) || 0) / 100),
    0
  );
  const total = subtotal + taxAmount;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: "default",
          contactId: contactId || undefined,
          date: invoiceDate,
          dueDate,
          type: "RECEIVABLE",
          issue: issueElectronic,
          lines,
        }),
      });

      if (res.ok) {
        setShowNewModal(false);
        setSuccessMsg(
          issueElectronic
            ? "Factura electrónica emitida, firmada y transmitida con éxito con su CUFE."
            : "Factura guardada en estado borrador."
        );
        setTimeout(() => setSuccessMsg(null), 4000);
        loadInvoices();
      }
    } catch (err) {
      console.error("Error creando factura:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSupportDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: "default",
          contactId: supportDocData.contactId || undefined,
          date: supportDocData.date,
          type: "SUPPORT_DOCUMENT",
          issue: supportDocData.issue,
          retefuenteRate: supportDocData.retefuenteRate,
          notes: supportDocData.notes,
          lines: [
            {
              description: supportDocData.description,
              quantity: 1,
              unitPrice: Number(supportDocData.amount),
              discount: 0,
              taxRate: 0, // No obligado no discrimina IVA
            },
          ],
        }),
      });

      if (res.ok) {
        setShowSupportDocModal(false);
        setSuccessMsg("Documento Soporte Electrónico emitido con éxito con código CUDS y contabilizado en Libro Diario.");
        setTimeout(() => setSuccessMsg(null), 4000);
        loadInvoices();
      }
    } catch (err) {
      console.error("Error creando documento soporte:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const salesInvoices = invoices.filter((i) => i.type !== "SUPPORT_DOCUMENT");
  const supportDocs = invoices.filter((i) => i.type === "SUPPORT_DOCUMENT");

  const currentList = activeTab === "sales" ? salesInvoices : supportDocs;

  const filteredInvoices = currentList.filter((inv) => {
    const term = search.toLowerCase();
    return (
      inv.number.toLowerCase().includes(term) ||
      (inv.contact?.name && inv.contact.name.toLowerCase().includes(term)) ||
      (inv.cufe && inv.cufe.toLowerCase().includes(term))
    );
  });

  const formatCOP = (v: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FileText size={28} color="var(--primary)" />
            Facturación Electrónica & Documento Soporte DIAN
          </h1>
          <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
            Emisión de comprobantes UBL 2.1 con CUFE, código QR y Documento Soporte en Adquisiciones a No Obligados (Res. 000167).
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {activeTab === "sales" ? (
            <button onClick={() => setShowNewModal(true)} className="premium-btn">
              <Plus size={18} />
              Nueva Factura Electrónica
            </button>
          ) : (
            <button
              onClick={() => setShowSupportDocModal(true)}
              className="premium-btn"
              style={{ background: "#059669" }}
            >
              <Plus size={18} />
              Nuevo Documento Soporte
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem", gap: "0.5rem" }}>
        <button
          onClick={() => setActiveTab("sales")}
          style={{
            padding: "0.75rem 1.25rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            borderBottom: activeTab === "sales" ? "2px solid var(--primary)" : "2px solid transparent",
            color: activeTab === "sales" ? "var(--primary)" : "var(--secondary-foreground)",
            background: "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FileText size={16} />
          Facturación Electrónica de Venta (Clientes)
        </button>

        <button
          onClick={() => setActiveTab("support_doc")}
          style={{
            padding: "0.75rem 1.25rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            borderBottom: activeTab === "support_doc" ? "2px solid #059669" : "2px solid transparent",
            color: activeTab === "support_doc" ? "#059669" : "var(--secondary-foreground)",
            background: "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FileCheck2 size={16} />
          Documento Soporte Electrónico (No Obligados - Res. 000167)
        </button>
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
      {activeTab === "sales" ? (
        <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>
          <div className="metric-card">
            <div className="metric-title">Facturas Emitidas y Autorizadas</div>
            <div className="metric-value" style={{ color: "var(--success)" }}>
              {salesInvoices.filter((i) => i.status === "ISSUED").length}
            </div>
            <div className="metric-trend" style={{ color: "var(--success)" }}>
              Transmitidas con CUFE válido
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-title">Borradores Pendientes</div>
            <div className="metric-value" style={{ color: "#eab308" }}>
              {salesInvoices.filter((i) => i.status === "DRAFT").length}
            </div>
            <div className="metric-trend" style={{ color: "#eab308" }}>
              Requieren autorización y firma
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-title">Total Facturado a Clientes</div>
            <div className="metric-value" style={{ color: "var(--primary)" }}>
              {formatCOP(salesInvoices.reduce((s, i) => s + (i.total || 0), 0))}
            </div>
            <div className="metric-trend" style={{ color: "var(--secondary-foreground)" }}>
              Ingreso bruto acumulado
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>
          <div className="metric-card">
            <div className="metric-title">Documentos Soporte Emitidos</div>
            <div className="metric-value" style={{ color: "#059669" }}>
              {supportDocs.length}
            </div>
            <div className="metric-trend" style={{ color: "#059669" }}>
              Transmitidos con código CUDS
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-title">Retenciones en la Fuente Practicadas</div>
            <div className="metric-value" style={{ color: "#d97706" }}>
              {formatCOP(supportDocs.reduce((s, i) => s + (i.discountAmt || 0), 0))}
            </div>
            <div className="metric-trend" style={{ color: "#d97706" }}>
              Abonado en Cuenta 2365
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-title">Total Gastos Soportados</div>
            <div className="metric-value" style={{ color: "#2563eb" }}>
              {formatCOP(supportDocs.reduce((s, i) => s + (i.subtotal || 0), 0))}
            </div>
            <div className="metric-trend" style={{ color: "var(--secondary-foreground)" }}>
              Deducibles en Impuesto de Renta
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Documentos */}
      <div className="table-container">
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ position: "relative", width: "320px" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--secondary-foreground)" }} />
            <input
              type="text"
              placeholder={activeTab === "sales" ? "Buscar por número, cliente o CUFE..." : "Buscar por número DSE, contratista o CUDS..."}
              className="premium-input"
              style={{ paddingLeft: "2.75rem" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)" }}>
            Mostrando {filteredInvoices.length} comprobantes
          </div>
        </div>

        <table className="premium-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>{activeTab === "sales" ? "Adquirente / Cliente" : "Sujeto No Obligado / Contratista"}</th>
              <th>Fecha</th>
              <th style={{ textAlign: "right" }}>{activeTab === "sales" ? "Total Factura" : "Subtotal Bruto"}</th>
              {activeTab === "support_doc" && <th style={{ textAlign: "right" }}>Retefuente</th>}
              <th style={{ textAlign: "right" }}>{activeTab === "sales" ? "IVA" : "Neto Pagado"}</th>
              <th>Estado Fiscal</th>
              <th>{activeTab === "sales" ? "Código CUFE" : "Código CUDS"}</th>
              <th style={{ textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={activeTab === "support_doc" ? 9 : 8} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  Cargando comprobantes electrónicos...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={activeTab === "support_doc" ? 9 : 8} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  {activeTab === "sales"
                    ? "No se encontraron facturas de venta. Utiliza 'Nueva Factura Electrónica'."
                    : "No hay Documentos Soporte registrados aún. Utiliza 'Nuevo Documento Soporte'."}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{inv.number}</td>
                  <td style={{ fontWeight: 500 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Building size={16} color={activeTab === "sales" ? "var(--primary)" : "#059669"} />
                      {inv.contact?.name || "Tercero General"}
                    </div>
                  </td>
                  <td>{new Date(inv.date).toLocaleDateString("es-CO")}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>
                    {formatCOP(activeTab === "sales" ? inv.total : inv.subtotal)}
                  </td>
                  {activeTab === "support_doc" && (
                    <td style={{ textAlign: "right", color: "#d97706", fontWeight: 600 }}>
                      -{formatCOP(inv.discountAmt || 0)}
                    </td>
                  )}
                  <td style={{ textAlign: "right", fontWeight: 700, color: "var(--success)" }}>
                    {formatCOP(activeTab === "sales" ? inv.taxAmount : inv.total)}
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "1rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: inv.status === "ISSUED" ? "rgba(34, 197, 94, 0.1)" : "rgba(234, 179, 8, 0.1)",
                        color: inv.status === "ISSUED" ? "var(--success)" : "#eab308",
                      }}
                    >
                      {inv.status === "ISSUED" ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {inv.status === "ISSUED" ? (activeTab === "sales" ? "AUTORIZADA DIAN" : "CUDS VALIDADO") : "BORRADOR"}
                    </span>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>
                    {inv.cufe ? `${inv.cufe.slice(0, 16)}...` : "-"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      style={{
                        background: "var(--secondary)",
                        color: activeTab === "sales" ? "var(--primary)" : "#059669",
                        border: "none",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Ver Comprobante / XML
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: NUEVA FACTURA ELECTRÓNICA DE VENTA */}
      {showNewModal && (
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
              maxWidth: "850px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText color="var(--primary)" size={24} />
                Emitir Factura Electrónica de Venta
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--secondary-foreground)" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateInvoice}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label className="form-label">Cliente / Adquirente</label>
                  <select
                    className="premium-input"
                    style={{ width: "100%", fontWeight: 600 }}
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.taxId || "Sin NIT"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Fecha de Factura</label>
                  <input
                    type="date"
                    required
                    className="premium-input"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    required
                    className="premium-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Líneas de Factura */}
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h4 style={{ fontWeight: 600, fontSize: "0.95rem" }}>Ítems / Servicios Facturados</h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="premium-btn"
                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", background: "var(--secondary)", color: "var(--secondary-foreground)" }}
                  >
                    + Agregar Ítem
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {lines.map((line, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1.5fr 1fr 30px", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="text"
                        required
                        placeholder="Descripción del producto o servicio..."
                        className="premium-input"
                        style={{ fontSize: "0.85rem", padding: "0.4rem" }}
                        value={line.description}
                        onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        className="premium-input"
                        style={{ fontSize: "0.85rem", padding: "0.4rem", textAlign: "right" }}
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, "quantity", Number(e.target.value))}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Precio Unitario"
                        className="premium-input"
                        style={{ fontSize: "0.85rem", padding: "0.4rem", textAlign: "right" }}
                        value={line.unitPrice || ""}
                        onChange={(e) => handleLineChange(idx, "unitPrice", Number(e.target.value))}
                      />
                      <select
                        className="premium-input"
                        style={{ fontSize: "0.85rem", padding: "0.4rem" }}
                        value={line.taxRate}
                        onChange={(e) => handleLineChange(idx, "taxRate", Number(e.target.value))}
                      >
                        <option value="19">IVA 19%</option>
                        <option value="5">IVA 5%</option>
                        <option value="0">Exento 0%</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lines.length <= 1}
                        style={{ background: "none", border: "none", color: "var(--destructive)", cursor: "pointer" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales y opciones */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem", alignItems: "center", marginBottom: "2rem" }}>
                <div style={{ background: "rgba(79, 70, 229, 0.05)", border: "1px solid rgba(79, 70, 229, 0.2)", borderRadius: "var(--radius)", padding: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                    <input
                      type="checkbox"
                      checked={issueElectronic}
                      onChange={(e) => setIssueElectronic(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                    />
                    <span>Firmar y transmitir automáticamente a la DIAN (UBL 2.1)</span>
                  </label>
                  <p style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)", marginTop: "0.25rem", marginLeft: "1.6rem" }}>
                    Genera el CUFE, código QR y archivo XML firmado digitalmente.
                  </p>
                </div>

                <div style={{ textAlign: "right", fontSize: "0.9rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}>
                    <span style={{ color: "var(--secondary-foreground)" }}>Subtotal:</span>
                    <span style={{ fontWeight: 600 }}>{formatCOP(subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}>
                    <span style={{ color: "var(--secondary-foreground)" }}>IVA (Impuestos):</span>
                    <span style={{ fontWeight: 600, color: "var(--primary)" }}>{formatCOP(taxAmount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderTop: "1px solid var(--border)", fontSize: "1.15rem", fontWeight: 800 }}>
                    <span>Total Factura:</span>
                    <span>{formatCOP(total)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="premium-btn"
                  style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="premium-btn">
                  {isSubmitting ? "Emitiendo..." : "Emitir Factura Electrónica"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO DOCUMENTO SOPORTE ELECTRÓNICO (NO OBLIGADOS) */}
      {showSupportDocModal && (
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
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileCheck2 color="#059669" size={24} />
                  Emitir Documento Soporte Electrónico
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)", marginTop: "0.2rem" }}>
                  Resolución DIAN 000167 / Art. 771-2 E.T. para adquisiciones a sujetos no obligados.
                </p>
              </div>
              <button
                onClick={() => setShowSupportDocModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--secondary-foreground)" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSupportDoc} className="space-y-4">
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="form-label">Sujeto No Obligado (Contratista / Proveedor Natural)</label>
                  <select
                    className="premium-input"
                    style={{ width: "100%", fontWeight: 600 }}
                    value={supportDocData.contactId}
                    onChange={(e) => setSupportDocData({ ...supportDocData, contactId: e.target.value })}
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (CC/NIT: {c.taxId || "S/N"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Fecha de Expedición</label>
                  <input
                    type="date"
                    required
                    className="premium-input"
                    value={supportDocData.date}
                    onChange={(e) => setSupportDocData({ ...supportDocData, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Descripción del Servicio / Bien Adquirido</label>
                <input
                  type="text"
                  required
                  placeholder="Detalle del servicio prestado por la persona natural..."
                  className="premium-input"
                  style={{ width: "100%" }}
                  value={supportDocData.description}
                  onChange={(e) => setSupportDocData({ ...supportDocData, description: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: "1rem" }}>
                <div>
                  <label className="form-label">Monto Bruto de la Operación (COP)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="premium-input"
                    style={{ width: "100%", textAlign: "right" }}
                    value={supportDocData.amount}
                    onChange={(e) => setSupportDocData({ ...supportDocData, amount: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="form-label">Retención en la Fuente Practicada</label>
                  <select
                    className="premium-input"
                    style={{ width: "100%" }}
                    value={supportDocData.retefuenteRate}
                    onChange={(e) => setSupportDocData({ ...supportDocData, retefuenteRate: Number(e.target.value) })}
                  >
                    <option value="4">4% - Servicios Generales</option>
                    <option value="10">10% - Honorarios y Consultoría</option>
                    <option value="11">11% - Honorarios Declarantes</option>
                    <option value="3.5">3.5% - Arrendamiento / Otros</option>
                    <option value="0">0% - Sin Retención</option>
                  </select>
                </div>
              </div>

              {/* Resumen de liquidación */}
              <div style={{ background: "rgba(5, 150, 105, 0.08)", border: "1px solid rgba(5, 150, 105, 0.25)", borderRadius: "var(--radius)", padding: "1rem", fontSize: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ color: "var(--secondary-foreground)" }}>Subtotal Operación:</span>
                  <span style={{ fontWeight: 600 }}>{formatCOP(supportDocData.amount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ color: "var(--secondary-foreground)" }}>Retención practicada ({supportDocData.retefuenteRate}%):</span>
                  <span style={{ fontWeight: 600, color: "#d97706" }}>
                    -{formatCOP(Math.round(supportDocData.amount * (supportDocData.retefuenteRate / 100)))}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "0.5rem", fontSize: "1.05rem", fontWeight: 800 }}>
                  <span>Neto a Pagar al Contratista:</span>
                  <span style={{ color: "#059669" }}>
                    {formatCOP(supportDocData.amount - Math.round(supportDocData.amount * (supportDocData.retefuenteRate / 100)))}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowSupportDocModal(false)}
                  className="premium-btn"
                  style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="premium-btn"
                  style={{ background: "#059669" }}
                >
                  {isSubmitting ? "Emitiendo..." : "Emitir con CUDS y Contabilizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER FACTURA O DOCUMENTO SOPORTE / XML / CUDS */}
      {selectedInvoice && (
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
              padding: "2.5rem",
              borderRadius: "var(--radius)",
              maxWidth: "750px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: selectedInvoice.type === "SUPPORT_DOCUMENT" ? "#059669" : "var(--success)",
                    background: selectedInvoice.type === "SUPPORT_DOCUMENT" ? "rgba(5, 150, 105, 0.15)" : "rgba(34, 197, 94, 0.15)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "1rem",
                  }}
                >
                  {selectedInvoice.type === "SUPPORT_DOCUMENT"
                    ? "DOCUMENTO SOPORTE ELECTRÓNICO (RES. 000167)"
                    : "FACTURA ELECTRÓNICA UBL 2.1"}
                </span>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "0.25rem" }}>
                  {selectedInvoice.type === "SUPPORT_DOCUMENT" ? "Documento Soporte " : "Factura Electrónica "}
                  {selectedInvoice.number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--secondary-foreground)" }}
              >
                ×
              </button>
            </div>

            {/* Datos CUFE / CUDS y Fiscales */}
            <div style={{ background: "var(--secondary)", padding: "1rem", borderRadius: "var(--radius)", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              <div style={{ marginBottom: "0.25rem" }}>
                <strong>{selectedInvoice.type === "SUPPORT_DOCUMENT" ? "Beneficiario / Sujeto No Obligado:" : "Adquirente:"}</strong>{" "}
                {selectedInvoice.contact?.name || "Tercero General"} (CC/NIT: {selectedInvoice.contact?.taxId || "N/A"})
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                <strong>Fecha de Emisión:</strong> {new Date(selectedInvoice.date).toLocaleDateString("es-CO")}
              </div>
              <div style={{ wordBreak: "break-all", marginTop: "0.5rem" }}>
                <strong>{selectedInvoice.type === "SUPPORT_DOCUMENT" ? "CUDS (SHA-384):" : "CUFE (SHA-384):"}</strong>{" "}
                <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--primary)" }}>
                  {selectedInvoice.cufe || "N/A"}
                </span>
              </div>
            </div>

            {/* XML UBL */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                Contenedor XML Validado DIAN
              </h4>
              <pre style={{ background: "var(--secondary)", padding: "1rem", borderRadius: "var(--radius)", fontSize: "0.75rem", overflowX: "auto", fontFamily: "monospace" }}>
                {selectedInvoice.xmlData || `<?xml version="1.0"?><Invoice><Id>${selectedInvoice.id}</Id><Number>${selectedInvoice.number}</Number><Total>${selectedInvoice.total}</Total><UUID>${selectedInvoice.cufe}</UUID></Invoice>`}
              </pre>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="premium-btn"
                style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
              >
                Cerrar
              </button>
              <button onClick={() => window.print()} className="premium-btn">
                Imprimir Representación Gráfica (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
