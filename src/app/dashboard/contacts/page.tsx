"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Search, Mail, Phone, MapPin, Building, DollarSign, FileCheck, Printer, X } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  type: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  creditLimit?: number | null;
  totalReceivable?: number;
  totalPayable?: number;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal Certificado de Retención
  const [certificateContact, setCertificateContact] = useState<Contact | null>(null);

  useEffect(() => {
    fetch("/api/contacts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setContacts(data);
        }
      })
      .catch((err) => console.error("Error cargando contactos:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredContacts = contacts.filter((c) => {
    const matchesType = filterType === "ALL" || c.type === filterType || c.type === "BOTH";
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.taxId && c.taxId.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Users size={28} color="var(--primary)" />
            Terceros (Clientes y Proveedores)
          </h1>
          <p style={{ color: "var(--secondary-foreground)" }}>Gestión del directorio comercial, cartera y certificados tributarios</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { key: "ALL", label: "Todos" },
            { key: "CUSTOMER", label: "Clientes" },
            { key: "SUPPLIER", label: "Proveedores" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "2rem",
                border: "1px solid var(--border)",
                background: filterType === tab.key ? "var(--primary)" : "var(--card)",
                color: filterType === tab.key ? "white" : "var(--foreground)",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "280px" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--secondary-foreground)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre, NIT o correo..."
            className="premium-input"
            style={{ paddingLeft: "2.75rem" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Razón Social / Nombre</th>
              <th>Identificación / NIT</th>
              <th>Contacto</th>
              <th>Ciudad</th>
              <th>Tipo</th>
              <th style={{ textAlign: "right" }}>Por Cobrar</th>
              <th style={{ textAlign: "right" }}>Por Pagar</th>
              <th style={{ textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  Cargando terceros...
                </td>
              </tr>
            ) : filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  No se encontraron registros de terceros.
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr key={contact.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Building size={16} color="var(--primary)" />
                      {contact.name}
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace" }}>{contact.taxId || "N/A"}</td>
                  <td>
                    <div style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)" }}>
                      {contact.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Mail size={12} /> {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "2px" }}>
                          <Phone size={12} /> {contact.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {contact.city ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <MapPin size={14} color="var(--secondary-foreground)" /> {contact.city}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "0.25rem 0.6rem",
                        borderRadius: "1rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor:
                          contact.type === "CUSTOMER"
                            ? "rgba(34, 197, 94, 0.1)"
                            : contact.type === "SUPPLIER"
                            ? "rgba(59, 130, 246, 0.1)"
                            : "rgba(168, 85, 247, 0.1)",
                        color:
                          contact.type === "CUSTOMER"
                            ? "var(--success)"
                            : contact.type === "SUPPLIER"
                            ? "#3b82f6"
                            : "#a855f7",
                      }}
                    >
                      {contact.type === "CUSTOMER" ? "CLIENTE" : contact.type === "SUPPLIER" ? "PROVEEDOR" : "AMBOS"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", color: (contact.totalReceivable || 0) > 0 ? "var(--success)" : "inherit", fontWeight: 600 }}>
                    ${(contact.totalReceivable || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: "right", color: (contact.totalPayable || 0) > 0 ? "var(--destructive)" : "inherit", fontWeight: 600 }}>
                    ${(contact.totalPayable || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => setCertificateContact(contact)}
                      title="Generar Certificado de Retención en la Fuente"
                      style={{
                        background: "rgba(79, 70, 229, 0.1)",
                        color: "var(--primary)",
                        border: "none",
                        padding: "0.35rem 0.65rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <FileCheck size={14} /> Certificado
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: CERTIFICADO DE RETENCIÓN EN LA FUENTE */}
      {certificateContact && (
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
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", letterSpacing: "1px", textTransform: "uppercase" }}>
                  DOCUMENTO TRIBUTARIO OFICIAL
                </span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                  Certificado de Retención en la Fuente
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)" }}>
                  Año Gravable 2026 — Art. 381 del Estatuto Tributario
                </p>
              </div>
              <button
                onClick={() => setCertificateContact(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--secondary-foreground)" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Datos del Retenedor */}
            <div style={{ background: "var(--secondary)", padding: "1rem", borderRadius: "var(--radius)", marginBottom: "1rem", fontSize: "0.85rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--primary)" }}>DATOS DEL AGENTE RETENEDOR:</div>
              <div><strong>Razón Social:</strong> Inversiones y Servicios S.A.S.</div>
              <div><strong>NIT:</strong> 900.876.543-1</div>
              <div><strong>Dirección:</strong> Calle 100 # 15-20, Bogotá D.C.</div>
            </div>

            {/* Datos del Beneficiario */}
            <div style={{ background: "var(--secondary)", padding: "1rem", borderRadius: "var(--radius)", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--primary)" }}>DATOS DEL SUJETO RETENIDO (BENEFICIARIO):</div>
              <div><strong>Nombre / Razón Social:</strong> {certificateContact.name}</div>
              <div><strong>NIT / C.C.:</strong> {certificateContact.taxId || "N/A"}</div>
              <div><strong>Ciudad:</strong> {certificateContact.city || "Bogotá D.C."}</div>
            </div>

            {/* Tabla de Retenciones */}
            <table className="premium-table" style={{ fontSize: "0.85rem", marginBottom: "2rem" }}>
              <thead>
                <tr>
                  <th>Concepto de Pago / Retención</th>
                  <th style={{ textAlign: "center" }}>Tarifa</th>
                  <th style={{ textAlign: "right" }}>Base Sujeta a Retención</th>
                  <th style={{ textAlign: "right" }}>Monto Retenido</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 500 }}>Retención en la fuente por Compras y Suministros</td>
                  <td style={{ textAlign: "center" }}>2.5%</td>
                  <td style={{ textAlign: "right" }}>$10,000,000</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>$250,000</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 500 }}>Retención de Industria y Comercio (ReteICA)</td>
                  <td style={{ textAlign: "center" }}>11.04 ‰</td>
                  <td style={{ textAlign: "right" }}>$10,000,000</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>$110,400</td>
                </tr>
                <tr style={{ background: "var(--secondary)", fontWeight: 800 }}>
                  <td colSpan={2} style={{ textAlign: "right" }}>TOTALES RETENIDOS:</td>
                  <td style={{ textAlign: "right" }}>$10,000,000</td>
                  <td style={{ textAlign: "right", color: "var(--primary)" }}>$360,400</td>
                </tr>
              </tbody>
            </table>

            {/* Firma */}
            <div style={{ textAlign: "center", marginTop: "2rem", marginBottom: "1.5rem" }}>
              <div style={{ borderBottom: "1px solid var(--foreground)", width: "240px", margin: "0 auto 0.5rem auto", height: "30px" }} />
              <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>Inversiones y Servicios S.A.S.</div>
              <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>Firma Autorizada y Sello</div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => setCertificateContact(null)}
                className="premium-btn"
                style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
              >
                Cerrar
              </button>
              <button onClick={() => window.print()} className="premium-btn">
                <Printer size={16} /> Imprimir Certificado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
