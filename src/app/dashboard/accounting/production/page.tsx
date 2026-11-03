"use client";

import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Search,
  Package,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Wrench,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface ProductionCost {
  id: string;
  type: "MATERIAL" | "LABOR" | "OVERHEAD";
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface ProductionOrder {
  id: string;
  number: string;
  product: string;
  quantity: number;
  startDate: string;
  endDate?: string | null;
  status: "OPEN" | "CLOSED";
  totalCost: number;
  costs: ProductionCost[];
}

export default function ProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modales
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Estado del formulario nueva orden
  const [newNumber, setNewNumber] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newQuantity, setNewQuantity] = useState(10);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [applyBOM, setApplyBOM] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado formulario agregar costo
  const [costType, setCostType] = useState<"MATERIAL" | "LABOR" | "OVERHEAD">("MATERIAL");
  const [costDesc, setCostDesc] = useState("");
  const [costQty, setCostQty] = useState(1);
  const [costUnit, setCostUnit] = useState(0);

  const loadOrders = () => {
    setLoading(true);
    fetch("/api/production")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch((err) => console.error("Error cargando órdenes:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
    fetch("/api/production?boms=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBoms(data);
          if (data.length > 0) setNewProduct(data[0].product);
        }
      });
  }, []);

  // Crear nueva orden
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const orderNum = newNumber.trim() || `OP-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, "0")}`;
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: orderNum,
          product: newProduct,
          quantity: Number(newQuantity),
          startDate: newStartDate,
          applyBOM,
        }),
      });

      if (res.ok) {
        setShowNewOrderModal(false);
        setNewNumber("");
        setSuccessMsg(`Orden de producción ${orderNum} creada exitosamente con sus costos calculados.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        loadOrders();
      }
    } catch (err) {
      console.error("Error creando orden:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Agregar costo a orden
  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-cost",
          orderId: selectedOrder.id,
          type: costType,
          description: costDesc,
          quantity: Number(costQty),
          unitCost: Number(costUnit),
        }),
      });

      if (res.ok) {
        setCostDesc("");
        setCostQty(1);
        setCostUnit(0);
        // Recargar orden actual
        const updatedRes = await fetch("/api/production");
        const updatedOrders = await updatedRes.json();
        setOrders(updatedOrders);
        const refreshed = updatedOrders.find((o: any) => o.id === selectedOrder.id);
        if (refreshed) setSelectedOrder(refreshed);
      }
    } catch (err) {
      console.error("Error agregando costo:", err);
    }
  };

  // Cerrar orden de producción
  const handleCloseOrder = async (orderId: string) => {
    if (!confirm("¿Deseas cerrar esta orden de producción? Se generará automáticamente el asiento contable de traslado a Inventario de Producto Terminado.")) {
      return;
    }

    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close-order",
          orderId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowDetailModal(false);
        setSuccessMsg(`Orden cerrada con éxito. Asiento contable de producto terminado registrado en libro diario.`);
        setTimeout(() => setSuccessMsg(null), 5000);
        loadOrders();
      }
    } catch (err) {
      console.error("Error cerrando orden:", err);
    }
  };

  const activeOrdersCount = orders.filter((o) => o.status === "OPEN").length;
  const closedOrdersCount = orders.filter((o) => o.status === "CLOSED").length;
  const totalCostAccumulated = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filter === "ALL" || o.status === filter;
    const matchesSearch =
      o.number.toLowerCase().includes(search.toLowerCase()) ||
      o.product.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Layers size={28} color="var(--primary)" />
            Costos de Producción y Manufactura
          </h1>
          <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem" }}>
            Recetas estándar (BOM), control de costos directos/indirectos y liquidación a producto terminado
          </p>
        </div>

        <button onClick={() => setShowNewOrderModal(true)} className="premium-btn">
          <PlusCircle size={18} />
          Nueva Orden de Producción
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
      <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>
        <div className="metric-card">
          <div className="metric-title">Órdenes en Producción Activas</div>
          <div className="metric-value" style={{ color: "var(--primary)" }}>
            {activeOrdersCount}
          </div>
          <div className="metric-trend" style={{ color: "var(--secondary-foreground)" }}>
            En proceso en planta
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Costo Acumulado Total</div>
          <div className="metric-value" style={{ color: "var(--foreground)" }}>
            ${totalCostAccumulated.toLocaleString()}
          </div>
          <div className="metric-trend" style={{ color: "var(--secondary-foreground)" }}>
            Materiales + Mano de Obra + CIF
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Órdenes Liquidadas / Cerradas</div>
          <div className="metric-value" style={{ color: "var(--success)" }}>
            {closedOrdersCount}
          </div>
          <div className="metric-trend" style={{ color: "var(--success)" }}>
            Trasladadas a Inventario Terminado (1430)
          </div>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="table-container">
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ position: "relative", width: "320px" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--secondary-foreground)" }} />
            <input
              type="text"
              placeholder="Buscar por número o producto..."
              className="premium-input"
              style={{ paddingLeft: "2.75rem" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["ALL", "OPEN", "CLOSED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "2rem",
                  border: "1px solid var(--border)",
                  background: filter === f ? "var(--primary)" : "var(--card)",
                  color: filter === f ? "white" : "var(--foreground)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {f === "ALL" ? "Todas" : f === "OPEN" ? "En Proceso" : "Cerradas"}
              </button>
            ))}
          </div>
        </div>

        <table className="premium-table">
          <thead>
            <tr>
              <th>N° Orden</th>
              <th>Producto Fabricado</th>
              <th style={{ textAlign: "center" }}>Cantidad</th>
              <th style={{ textAlign: "center" }}>Estado</th>
              <th>Fechas</th>
              <th style={{ textAlign: "right" }}>Costo Total</th>
              <th style={{ textAlign: "right" }}>Costo Unitario</th>
              <th style={{ textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  Cargando órdenes de producción...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--secondary-foreground)" }}>
                  No se encontraron órdenes de producción.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const unitCost = order.quantity > 0 ? order.totalCost / order.quantity : 0;
                return (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{order.number}</td>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Package size={16} color="var(--primary)" />
                        {order.product}
                      </div>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 600 }}>{order.quantity} uds</td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "1rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: order.status === "OPEN" ? "rgba(59, 130, 246, 0.1)" : "rgba(34, 197, 94, 0.1)",
                          color: order.status === "OPEN" ? "#2563eb" : "var(--success)",
                        }}
                      >
                        {order.status === "OPEN" ? <Clock size={12} /> : <CheckCircle size={12} />}
                        {order.status === "OPEN" ? "EN PROCESO" : "CERRADA"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)" }}>
                      <div>Inicio: {new Date(order.startDate).toLocaleDateString("es-CO")}</div>
                      {order.endDate && <div>Fin: {new Date(order.endDate).toLocaleDateString("es-CO")}</div>}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      ${order.totalCost.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--primary)" }}>
                      ${unitCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }}
                        style={{
                          background: "var(--secondary)",
                          color: "var(--primary)",
                          border: "none",
                          padding: "0.4rem 0.8rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Ver Costos
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: NUEVA ORDEN DE PRODUCCIÓN */}
      {showNewOrderModal && (
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
              <PlusCircle color="var(--primary)" size={24} />
              Nueva Orden de Producción
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--secondary-foreground)", marginBottom: "1.5rem" }}>
              Genera una orden de manufactura con cálculo automático de costos desde la receta (BOM).
            </p>

            <form onSubmit={handleCreateOrder}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Número de Orden (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: OP-2026-003 (deja vacío para auto-generar)"
                  className="premium-input"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Producto a Fabricar (Receta BOM)</label>
                <select
                  className="premium-input"
                  style={{ width: "100%", fontWeight: 600 }}
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  required
                >
                  {boms.map((b, idx) => (
                    <option key={idx} value={b.product}>
                      {b.product}
                    </option>
                  ))}
                  <option value="Producto Personalizado">-- Otro Producto Personalizado --</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label className="form-label">Cantidad a Producir</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="premium-input"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Math.max(1, Number(e.target.value)))}
                  />
                </div>
                <div>
                  <label className="form-label">Fecha de Inicio</label>
                  <input
                    type="date"
                    required
                    className="premium-input"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem", background: "rgba(79, 70, 229, 0.05)", padding: "1rem", borderRadius: "var(--radius)", border: "1px solid rgba(79, 70, 229, 0.2)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    checked={applyBOM}
                    onChange={(e) => setApplyBOM(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                  />
                  <span>Aplicar automáticamente receta estándar (BOM)</span>
                </label>
                <p style={{ fontSize: "0.8rem", color: "var(--secondary-foreground)", marginTop: "0.25rem", marginLeft: "1.6rem" }}>
                  Multiplica los materiales, mano de obra y CIF predefinidos por la cantidad seleccionada.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="premium-btn"
                  style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="premium-btn">
                  {isSubmitting ? "Creando..." : "Crear Orden de Producción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE Y ADICIÓN DE COSTOS */}
      {showDetailModal && selectedOrder && (
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
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700 }}>
                  Detalle de Costos: {selectedOrder.number}
                </h3>
                <p style={{ color: "var(--secondary-foreground)", fontSize: "0.9rem" }}>
                  {selectedOrder.product} — Cantidad: <strong>{selectedOrder.quantity} unidades</strong>
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--secondary-foreground)" }}
              >
                ×
              </button>
            </div>

            {/* Resumen de Costos */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "var(--secondary)", padding: "1rem", borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>Costo Total Acumulado</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--primary)" }}>
                  ${selectedOrder.totalCost.toLocaleString()}
                </div>
              </div>
              <div style={{ background: "var(--secondary)", padding: "1rem", borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>Costo Unitario Real</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                  ${(selectedOrder.totalCost / selectedOrder.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ background: "var(--secondary)", padding: "1rem", borderRadius: "var(--radius)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>Estado de Orden</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: selectedOrder.status === "OPEN" ? "#2563eb" : "var(--success)" }}>
                  {selectedOrder.status === "OPEN" ? "EN PROCESO" : "CERRADA"}
                </div>
              </div>
            </div>

            {/* Tabla de Rubros de Costos */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem" }}>Rubros Contabilizados</h4>
              <table className="premium-table" style={{ fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: "right" }}>Cantidad</th>
                    <th style={{ textAlign: "right" }}>Costo Unitario</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.costs?.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "1rem", color: "var(--secondary-foreground)" }}>
                        No hay costos registrados aún en esta orden.
                      </td>
                    </tr>
                  ) : (
                    selectedOrder.costs?.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.4rem",
                              borderRadius: "0.25rem",
                              background:
                                c.type === "MATERIAL"
                                  ? "rgba(59, 130, 246, 0.1)"
                                  : c.type === "LABOR"
                                  ? "rgba(168, 85, 247, 0.1)"
                                  : "rgba(234, 179, 8, 0.1)",
                              color:
                                c.type === "MATERIAL"
                                  ? "#2563eb"
                                  : c.type === "LABOR"
                                  ? "#9333ea"
                                  : "#ca8a04",
                            }}
                          >
                            {c.type === "MATERIAL" ? "MATERIA PRIMA" : c.type === "LABOR" ? "MANO DE OBRA" : "CIF"}
                          </span>
                        </td>
                        <td>{c.description}</td>
                        <td style={{ textAlign: "right" }}>{c.quantity}</td>
                        <td style={{ textAlign: "right" }}>${c.unitCost.toLocaleString()}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>${c.total.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Formulario Agregar Costo Adicional (solo si está abierta) */}
            {selectedOrder.status === "OPEN" && (
              <div style={{ background: "rgba(0,0,0,0.02)", border: "1px dashed var(--border)", borderRadius: "var(--radius)", padding: "1rem", marginBottom: "1.5rem" }}>
                <h5 style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.75rem" }}>+ Agregar Rubro de Costo</h5>
                <form onSubmit={handleAddCost} style={{ display: "grid", gridTemplateColumns: "1.5fr 2.5fr 1fr 1.5fr auto", gap: "0.5rem", alignItems: "center" }}>
                  <select
                    className="premium-input"
                    style={{ fontSize: "0.8rem", padding: "0.4rem" }}
                    value={costType}
                    onChange={(e: any) => setCostType(e.target.value)}
                  >
                    <option value="MATERIAL">Materia Prima</option>
                    <option value="LABOR">Mano de Obra</option>
                    <option value="OVERHEAD">CIF (Indirecto)</option>
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="Descripción del costo..."
                    className="premium-input"
                    style={{ fontSize: "0.8rem", padding: "0.4rem" }}
                    value={costDesc}
                    onChange={(e) => setCostDesc(e.target.value)}
                  />

                  <input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    className="premium-input"
                    style={{ fontSize: "0.8rem", padding: "0.4rem", textAlign: "right" }}
                    value={costQty}
                    onChange={(e) => setCostQty(Math.max(1, Number(e.target.value)))}
                  />

                  <input
                    type="number"
                    min="0"
                    placeholder="Costo Unit."
                    className="premium-input"
                    style={{ fontSize: "0.8rem", padding: "0.4rem", textAlign: "right" }}
                    value={costUnit || ""}
                    onChange={(e) => setCostUnit(Number(e.target.value))}
                  />

                  <button type="submit" className="premium-btn" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                    Agregar
                  </button>
                </form>
              </div>
            )}

            {/* Acciones de Cierre */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {selectedOrder.status === "OPEN" ? (
                  <button
                    onClick={() => handleCloseOrder(selectedOrder.id)}
                    className="premium-btn"
                    style={{ background: "var(--success)", color: "white" }}
                  >
                    <CheckCircle size={18} />
                    Cerrar Orden y Liquidar en Producto Terminado
                  </button>
                ) : (
                  <span style={{ color: "var(--success)", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <CheckCircle size={16} /> Orden cerrada y trasladada a bodega
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="premium-btn"
                style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
