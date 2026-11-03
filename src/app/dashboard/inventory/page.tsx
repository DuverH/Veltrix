"use client";

import { useState, useEffect } from "react";
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  Layers,
  Search,
  Plus,
  TrendingUp,
} from "lucide-react";

export default function InventoryKardexPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "kardex" | "new_movement">("catalog");
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("ALL");
  const [kardexData, setKardexData] = useState<any>(null);
  const [kardexLoading, setKardexLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // New movement form
  const [formData, setFormData] = useState({
    type: "IN" as "IN" | "OUT" | "TRANSFER",
    reason: "COMPRA" as any,
    warehouseId: "WH-01",
    targetWarehouseId: "WH-02",
    itemId: "",
    quantity: 1,
    unitCost: 0,
    referenceDoc: "",
    notes: "",
    postJournal: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [movementSuccess, setMovementSuccess] = useState<any>(null);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val || 0);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setSummaryData(data);
      if (data.items && data.items.length > 0 && !selectedItemId) {
        setSelectedItemId(data.items[0].id);
        setFormData((prev) => ({ ...prev, itemId: data.items[0].id, unitCost: data.items[0].standardCost }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKardex = async (itemId: string, warehouseId: string) => {
    if (!itemId) return;
    try {
      setKardexLoading(true);
      const res = await fetch(`/api/inventory?itemId=${itemId}&warehouseId=${warehouseId}`);
      const data = await res.json();
      setKardexData(data.kardex);
    } catch (err) {
      console.error(err);
    } finally {
      setKardexLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (selectedItemId) {
      fetchKardex(selectedItemId, selectedWarehouseId);
    }
  }, [selectedItemId, selectedWarehouseId]);

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMovementSuccess(null);
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar movimiento");

      setMovementSuccess(data);
      await fetchInventory();
      if (selectedItemId === formData.itemId) {
        await fetchKardex(formData.itemId, selectedWarehouseId);
      }
      // Reset form quantity
      setFormData((prev) => ({ ...prev, quantity: 1, referenceDoc: "", notes: "" }));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = summaryData?.summary?.filter((s: any) =>
    s.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Boxes className="text-emerald-500" size={28} />
            Inventarios Multibodega & Kardex Valorado
          </h1>
          <p className="text-muted-foreground text-sm">
            Control de existencias multisede, valoración según NIC 2 (Promedio Ponderado) y contabilización automática en PUC.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("new_movement")}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Nuevo Movimiento / Traslado
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <span className="stat-label flex items-center gap-1">
              <TrendingUp size={16} className="text-emerald-500" /> Valoración Total Stock
            </span>
            <span className="stat-value text-emerald-600">{formatCOP(summaryData.totalValuation)}</span>
            <span className="text-xs text-muted-foreground">Valor en cuentas 1405 y 1435</span>
          </div>

          <div className="stat-card">
            <span className="stat-label flex items-center gap-1">
              <Building2 size={16} className="text-blue-500" /> Bodegas Activas
            </span>
            <span className="stat-value">{summaryData.warehouses?.length || 0}</span>
            <span className="text-xs text-muted-foreground">Fontibón, Funza y Siberia</span>
          </div>

          <div className="stat-card">
            <span className="stat-label flex items-center gap-1">
              <Layers size={16} className="text-indigo-500" /> Referencias en Catálogo
            </span>
            <span className="stat-value">{summaryData.items?.length || 0}</span>
            <span className="text-xs text-muted-foreground">Materias primas y PT</span>
          </div>

          <div className="stat-card">
            <span className="stat-label flex items-center gap-1">
              <AlertTriangle size={16} className="text-amber-500" /> Alertas Stock Mínimo
            </span>
            <span className="stat-value text-amber-600">{summaryData.lowStockAlertsCount}</span>
            <span className="text-xs text-muted-foreground">Ítems que requieren reposición</span>
          </div>
        </div>
      )}

      {/* Navegación por pestañas */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "catalog"
              ? "border-emerald-500 text-emerald-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Catálogo & Existencias por Bodega
        </button>
        <button
          onClick={() => setActiveTab("kardex")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "kardex"
              ? "border-emerald-500 text-emerald-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Tarjeta de Kardex Valorado (Promedio Ponderado)
        </button>
        <button
          onClick={() => setActiveTab("new_movement")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "new_movement"
              ? "border-emerald-500 text-emerald-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Registrar Movimiento / Traslado
        </button>
      </div>

      {/* PESTAÑA 1: CATÁLOGO Y EXISTENCIAS */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 w-full"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Mostrando {filteredItems.length} de {summaryData?.summary?.length || 0} referencias
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU / Referencia</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: "right" }}>Stock Total</th>
                  <th style={{ textAlign: "right" }}>Costo Promedio Unit.</th>
                  <th style={{ textAlign: "right" }}>Valor Total</th>
                  <th>Distribución Bodegas</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "center" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((row: any) => (
                  <tr key={row.item.id} className="hover:bg-accent/40 transition-colors">
                    <td>
                      <div className="font-semibold text-sm">{row.item.name}</div>
                      <span className="text-xs font-mono text-muted-foreground">{row.item.sku}</span>
                    </td>
                    <td>
                      <span className="badge badge-secondary text-xs">
                        {row.item.category.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }} className="font-bold">
                      {row.totalQty} {row.item.unit}
                    </td>
                    <td style={{ textAlign: "right" }} className="font-mono text-xs">
                      {formatCOP(row.avgCost)}
                    </td>
                    <td style={{ textAlign: "right" }} className="font-mono font-semibold text-emerald-600">
                      {formatCOP(row.totalVal)}
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 text-xs">
                        {summaryData.warehouses.map((w: any) => {
                          const wStock = row.warehouseBreakdown[w.id]?.qty || 0;
                          return (
                            <div key={w.id} className="flex justify-between gap-2">
                              <span className="text-muted-foreground">{w.code}:</span>
                              <span className="font-mono font-medium">{wStock} {row.item.unit}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      {row.isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <AlertTriangle size={12} /> Reponer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Normal
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => {
                          setSelectedItemId(row.item.id);
                          setActiveTab("kardex");
                        }}
                        className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 mx-auto"
                      >
                        <FileSpreadsheet size={13} />
                        Ver Kardex
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: TARJETA DE KARDEX VALORADO */}
      {activeTab === "kardex" && (
        <div className="space-y-4">
          {/* Selectores de ítem y bodega */}
          <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-card/50">
            <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
              <div className="w-full md:w-80">
                <label className="text-xs text-muted-foreground block mb-1">Seleccionar Referencia:</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="input w-full"
                >
                  {summaryData?.items?.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} - {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-64">
                <label className="text-xs text-muted-foreground block mb-1">Filtrar por Bodega:</label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="input w-full"
                >
                  <option value="ALL">Todas las Bodegas (Consolidado)</option>
                  {summaryData?.warehouses?.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {kardexData && (
              <div className="flex gap-6 bg-accent/30 px-4 py-2 rounded-lg border border-border">
                <div>
                  <span className="text-xs text-muted-foreground block">Stock Actual</span>
                  <span className="text-lg font-bold">{kardexData.finalQty} uds</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Costo Promedio Ponderado</span>
                  <span className="text-lg font-bold text-blue-500 font-mono">
                    {formatCOP(kardexData.finalAvgCost)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Saldo Valorado Total</span>
                  <span className="text-lg font-bold text-emerald-500 font-mono">
                    {formatCOP(kardexData.finalVal)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tabla de Kardex Estilo Contable Formal */}
          <div className="table-container">
            {kardexLoading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando movimientos de Kardex...</div>
            ) : kardexData ? (
              <table className="table">
                <thead>
                  <tr className="bg-muted/40">
                    <th colSpan={3} style={{ textAlign: "center", borderRight: "1px solid var(--border)" }}>
                      Detalle del Movimiento
                    </th>
                    <th colSpan={3} style={{ textAlign: "center", borderRight: "1px solid var(--border)" }}>
                      ENTRADAS
                    </th>
                    <th colSpan={3} style={{ textAlign: "center", borderRight: "1px solid var(--border)" }}>
                      SALIDAS
                    </th>
                    <th colSpan={3} style={{ textAlign: "center" }}>
                      SALDOS (Promedio Ponderado)
                    </th>
                  </tr>
                  <tr>
                    <th>Fecha</th>
                    <th>Documento</th>
                    <th style={{ borderRight: "1px solid var(--border)" }}>Motivo</th>

                    {/* Entradas */}
                    <th style={{ textAlign: "right" }}>Cant</th>
                    <th style={{ textAlign: "right" }}>V/Unit</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid var(--border)" }}>Total</th>

                    {/* Salidas */}
                    <th style={{ textAlign: "right" }}>Cant</th>
                    <th style={{ textAlign: "right" }}>V/Unit</th>
                    <th style={{ textAlign: "right", borderRight: "1px solid var(--border)" }}>Total</th>

                    {/* Saldos */}
                    <th style={{ textAlign: "right" }}>Cant</th>
                    <th style={{ textAlign: "right" }}>C/Prom</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {kardexData.kardexRows?.map((row: any) => (
                    <tr key={row.id} className="hover:bg-accent/40 font-mono text-xs">
                      <td className="font-sans whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString("es-CO")}
                      </td>
                      <td className="font-semibold text-foreground">
                        {row.referenceDoc}
                      </td>
                      <td style={{ borderRight: "1px solid var(--border)" }}>
                        <span className="badge badge-secondary text-[10px]">
                          {row.reason}
                        </span>
                      </td>

                      {/* Entradas */}
                      <td style={{ textAlign: "right" }} className={row.inputs.qty > 0 ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                        {row.inputs.qty > 0 ? row.inputs.qty : "-"}
                      </td>
                      <td style={{ textAlign: "right" }} className="text-muted-foreground">
                        {row.inputs.unitCost > 0 ? formatCOP(row.inputs.unitCost) : "-"}
                      </td>
                      <td style={{ textAlign: "right", borderRight: "1px solid var(--border)" }} className="font-medium text-emerald-600">
                        {row.inputs.total > 0 ? formatCOP(row.inputs.total) : "-"}
                      </td>

                      {/* Salidas */}
                      <td style={{ textAlign: "right" }} className={row.outputs.qty > 0 ? "text-amber-600 font-bold" : "text-muted-foreground"}>
                        {row.outputs.qty > 0 ? row.outputs.qty : "-"}
                      </td>
                      <td style={{ textAlign: "right" }} className="text-muted-foreground">
                        {row.outputs.unitCost > 0 ? formatCOP(row.outputs.unitCost) : "-"}
                      </td>
                      <td style={{ textAlign: "right", borderRight: "1px solid var(--border)" }} className="font-medium text-amber-600">
                        {row.outputs.total > 0 ? formatCOP(row.outputs.total) : "-"}
                      </td>

                      {/* Saldos */}
                      <td style={{ textAlign: "right" }} className="font-bold text-foreground">
                        {row.balance.qty}
                      </td>
                      <td style={{ textAlign: "right" }} className="text-blue-500 font-medium">
                        {formatCOP(row.balance.avgCost)}
                      </td>
                      <td style={{ textAlign: "right" }} className="font-bold text-emerald-600">
                        {formatCOP(row.balance.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: REGISTRAR MOVIMIENTO O TRASLADO */}
      {activeTab === "new_movement" && (
        <div className="max-w-2xl mx-auto card p-6 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ArrowLeftRight className="text-emerald-500" size={20} />
              Registro de Operaciones de Inventario
            </h2>
            <p className="text-xs text-muted-foreground">
              Ingresa compras, salidas a producción, costos de venta o traslados entre bodegas con contabilización directa.
            </p>
          </div>

          {movementSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
              <div className="text-sm">
                <div className="font-bold text-emerald-600">Movimiento registrado exitosamente</div>
                <div className="text-xs text-muted-foreground">
                  ID: {movementSuccess.movement.id} | Saldo: {movementSuccess.movement.balanceQty} uds.
                  {movementSuccess.journalEntry && (
                    <span className="block text-emerald-500 font-mono mt-1">
                      ✓ Asiento Contable generado: #{movementSuccess.journalEntry.number} ({movementSuccess.journalEntry.description})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleRegisterMovement} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Tipo de Movimiento</label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    let r = "COMPRA";
                    if (t === "OUT") r = "VENTA";
                    if (t === "TRANSFER") r = "TRASLADO";
                    setFormData({ ...formData, type: t, reason: r });
                  }}
                  className="input w-full"
                >
                  <option value="IN">Entrada (IN)</option>
                  <option value="OUT">Salida (OUT)</option>
                  <option value="TRANSFER">Traslado entre Bodegas (TRANSFER)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Motivo / Concepto</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                  className="input w-full"
                >
                  {formData.type === "IN" && (
                    <>
                      <option value="COMPRA">Compra a Proveedor</option>
                      <option value="PRODUCCION">Entrada por Manufactura / OP</option>
                      <option value="AJUSTE">Ajuste de Inventario (Sobrante)</option>
                    </>
                  )}
                  {formData.type === "OUT" && (
                    <>
                      <option value="VENTA">Costo de Ventas (Despacho Cliente)</option>
                      <option value="CONSUMO_INTERNO">Consumo en Producción / Taller</option>
                      <option value="AJUSTE">Ajuste de Inventario (Merma / Faltante)</option>
                    </>
                  )}
                  {formData.type === "TRANSFER" && (
                    <option value="TRASLADO">Traslado Logístico Inter-bodegas</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Producto / Insumo</label>
              <select
                value={formData.itemId}
                onChange={(e) => {
                  const itm = summaryData?.items?.find((i: any) => i.id === e.target.value);
                  setFormData({
                    ...formData,
                    itemId: e.target.value,
                    unitCost: itm ? itm.standardCost : 0,
                  });
                }}
                className="input w-full"
                required
              >
                {summaryData?.items?.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.sku} - {item.name} (Stock: {item.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  {formData.type === "TRANSFER" ? "Bodega de Origen" : "Bodega"}
                </label>
                <select
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                  className="input w-full"
                >
                  {summaryData?.warehouses?.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.type === "TRANSFER" && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Bodega de Destino</label>
                  <select
                    value={formData.targetWarehouseId}
                    onChange={(e) => setFormData({ ...formData, targetWarehouseId: e.target.value })}
                    className="input w-full"
                  >
                    {summaryData?.warehouses
                      ?.filter((w: any) => w.id !== formData.warehouseId)
                      .map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.code} - {w.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, Number(e.target.value)) })}
                  className="input w-full"
                  required
                />
              </div>

              {formData.type === "IN" && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Costo Unitario de Compra (COP)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="input w-full"
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Documento Soporte / Factura / Remisión</label>
                <input
                  type="text"
                  placeholder="Ej: FAC-9821 / REM-104"
                  value={formData.referenceDoc}
                  onChange={(e) => setFormData({ ...formData, referenceDoc: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">Observaciones / Notas</label>
                <input
                  type="text"
                  placeholder="Detalle o justificación..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>

            <div className="p-3 bg-accent/20 rounded-lg border border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Contabilizar automáticamente en Libro Diario (PUC)</div>
                <div className="text-xs text-muted-foreground">
                  Crea partida doble (Débito 1435/1405 y Crédito 2205 Proveedores / Débito 6135 Costo)
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.postJournal}
                onChange={(e) => setFormData({ ...formData, postJournal: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              {submitting ? "Procesando..." : "Registrar y Actualizar Kardex"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
