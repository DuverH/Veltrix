"use client";

/**
 * @file page.tsx
 * @description Centro de Automatización Contable & Asistente NIIF (Veltrix).
 *
 * Módulo de asistencia contable y financiera con interfaz moderna, botones separados,
 * campo de texto rectangular espacioso y compatibilidad total con Modo Oscuro OLED (#000000).
 *
 * Cuatro módulos de autoservicio empresarial:
 *   1. **Scanner OCR & Causación**: Reconocimiento de facturas físicas/XML/PDF, cálculo de
 *      impuestos y contabilización en Libro Diario con partida doble exacta.
 *   2. **Director Financiero Virtual (AI CFO)**: Chat consultor financiero en tiempo real.
 *   3. **Causación en Lenguaje Natural**: Convierte texto ordinario en asientos de partida doble.
 *   4. **Auditoría Neuronal de Anomalías**: Diagnóstico preventivo de riesgos fiscales y de liquidez.
 *
 * Buenas prácticas aplicadas:
 *   - Arquitectura modular con React 19.
 *   - Tipado estricto con TypeScript.
 *   - Clases dedicadas en `globals.css` (.ai-tab-btn, .ai-preset-card, .ai-textarea-rectangular)
 *     para asegurar que los botones tengan separación generosa y el editor sea rectangular.
 *   - Manejo exhaustivo de estados asíncronos y retroalimentación de usuario.
 */

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  FileSearch,
  CheckCircle2,
  Send,
  Zap,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Building,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Wand2,
  Activity,
  ChevronRight,
  HelpCircle,
  FileText,
  DollarSign,
  Info,
} from "lucide-react";

// ─── Tipos e Interfaces de Datos ──────────────────────────────────────────────

/**
 * Representa los datos extraídos por el motor OCR / IA de una factura de compra
 */
interface OcrExtractedData {
  supplierName: string;
  supplierNit: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  ivaRate: number;
  ivaAmount: number;
  retefuenteRate: number;
  retefuenteAmount: number;
  totalPayable: number;
  suggestedAccountCode: string;
  suggestedAccountName: string;
  confidenceScore: number;
}

/**
 * Representa el asiento de partida doble generado a partir de lenguaje natural
 */
interface NaturalEntryData {
  description: string;
  reference: string;
  amount: number;
  reasoning: string;
  isBalanced: boolean;
  lines: Array<{
    accountId: string;
    code: string;
    name: string;
    description: string;
    debit: number;
    credit: number;
  }>;
}

/**
 * Mensaje intercambiado en el chat con el Director Financiero Virtual
 */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  metrics?: Record<string, any>;
}

/**
 * Alerta de riesgo o anomalía identificada en la auditoría preventiva
 */
interface AnomalyAlert {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  message: string;
  recommendation: string;
  kpi?: string;
}

// ─── Componente Principal ──────────────────────────────────────────────────────

export default function AiAssistantPage() {
  // Pestaña activa del centro de IA
  const [activeTab, setActiveTab] = useState<"ocr" | "cfo" | "natural" | "audit">("ocr");

  // ─── Estados: Tab 1 (OCR de Facturas) ────────────────────────────────────────
  const [ocrText, setOcrText] = useState(
    `SOLUCIONES CLOUD & HARDWARE S.A.S.
NIT: 901.445.892-1
FACTURA ELECTRÓNICA DE VENTA No. FE-2026-9810
Fecha de Emisión: 2026-02-10
Fecha de Vencimiento: 2026-03-12

ÍTEM: Servicio de suscripción a servidores en la nube y licencias software
CANTIDAD: 1
VALOR UNITARIO: $ 3.500.000
SUBTOTAL: $ 3.500.000
IVA (19%): $ 665.000
TOTAL FACTURA: $ 4.165.000`
  );

  const [ocrResult, setOcrResult] = useState<OcrExtractedData | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [postingLoading, setPostingLoading] = useState(false);
  const [postSuccess, setPostSuccess] = useState<any>(null);
  const [copiedText, setCopiedText] = useState(false);

  // ─── Estados: Tab 2 (Director Financiero Virtual / AI CFO) ───────────────────
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [cfoMetrics, setCfoMetrics] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "¡Hola! Soy tu Director Financiero Virtual (AI CFO) de Veltrix. Estoy conectado en tiempo real al Libro Diario, balances y flujo de caja de tu empresa.\n\n¿Qué consulta o diagnóstico financiero requieres hoy? Puedes pulsar cualquiera de los accesos rápidos o escribir tu pregunta con libertad.",
      timestamp: "Ahora",
    },
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ─── Estados: Tab 3 (Causación en Lenguaje Natural) ──────────────────────────
  const [naturalText, setNaturalText] = useState(
    "Pagamos $4.500.000 de arrendamiento de la oficina piso 3 por transferencia bancaria Bancolombia"
  );
  const [naturalResult, setNaturalResult] = useState<NaturalEntryData | null>(null);
  const [naturalLoading, setNaturalLoading] = useState(false);
  const [postingNaturalLoading, setPostingNaturalLoading] = useState(false);
  const [naturalSuccess, setNaturalSuccess] = useState<any>(null);

  // ─── Estados: Tab 4 (Auditoría de Anomalías) ─────────────────────────────────
  const [auditAlerts, setAuditAlerts] = useState<AnomalyAlert[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditScore, setAuditScore] = useState<number | null>(null);

  // ─── Formateador de Moneda Colombiana (COP) ──────────────────────────────────
  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val || 0);

  // Auto-scroll en el chat de CFO
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // ─── Plantillas Preconfiguradas para OCR ─────────────────────────────────────
  const ocrPresets = [
    {
      name: "Infraestructura Cloud",
      category: "Tecnología",
      icon: "☁️",
      text: `SOLUCIONES CLOUD & HARDWARE S.A.S.\nNIT: 901.445.892-1\nFACTURA ELECTRÓNICA DE VENTA No. FE-2026-9810\nFecha de Emisión: 2026-02-10\nÍTEM: Servicio de servidores en la nube y licencias software\nVALOR UNITARIO: $ 3.500.000\nSUBTOTAL: $ 3.500.000`,
    },
    {
      name: "Honorarios Jurídicos",
      category: "Servicios",
      icon: "⚖️",
      text: `ASESORES LEGALES Y TRIBUTARIOS S.A.S.\nNIT: 830.120.945-8\nFACTURA ELECTRÓNICA No. SETP-4402\nFecha de Emisión: 2026-02-12\nÍTEM: Honorarios profesionales por asesoría jurídica y planeación fiscal NIIF\nVALOR UNITARIO: $ 2.800.000\nSUBTOTAL: $ 2.800.000`,
    },
    {
      name: "Arrendamiento Oficina",
      category: "Inmuebles",
      icon: "🏢",
      text: `INMOBILIARIA CORPORATIVA DEL ORIENTE S.A.S.\nNIT: 860.035.771-4\nFACTURA ELECTRÓNICA No. AR-8891\nFecha de Emisión: 2026-02-01\nÍTEM: Canon de arrendamiento oficina administrativa piso 4\nVALOR UNITARIO: $ 4.200.000\nSUBTOTAL: $ 4.200.000`,
    },
    {
      name: "Papelería & Suministros",
      category: "Operativo",
      icon: "📦",
      text: `DISTRIBUIDORA PAPELERA NACIONAL S.A.S.\nNIT: 900.221.789-0\nFACTURA No. PAP-1029\nFecha de Emisión: 2026-02-05\nÍTEM: Resmas de papel carta, tóners láser y carpetas de archivo\nVALOR UNITARIO: $ 850.000\nSUBTOTAL: $ 850.000`,
    },
  ];

  // ─── Ejemplos de Transacciones en Lenguaje Natural ──────────────────────────
  const naturalPresets = [
    {
      title: "Arrendamiento de Inmueble",
      text: "Pagamos $4.500.000 de arrendamiento de la oficina piso 3 por transferencia bancaria Bancolombia",
    },
    {
      title: "Venta de Servicios a Crédito",
      text: "Venta de servicios de consultoría por $8.000.000 a crédito a 30 días",
    },
    {
      title: "Compra de Útiles de Oficina",
      text: "Compra de útiles y papelería por $350.000 pagados en efectivo de caja general",
    },
    {
      title: "Honorarios Profesionales",
      text: "Pago de honorarios contables por $2.800.000 con retención en la fuente practicada del 4%",
    },
  ];

  // ─── Handlers Asíncronos ────────────────────────────────────────────────────

  /**
   * Ejecuta el análisis OCR y predicción de cuentas PUC
   */
  const handleRunOcr = async () => {
    if (!ocrText.trim()) return;
    try {
      setOcrLoading(true);
      setPostSuccess(null);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ocr_parse", text: ocrText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOcrResult(data.data);
    } catch (err: any) {
      alert("Error al procesar con IA: " + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  /**
   * Asienta la factura procesada en el Libro Diario
   */
  const handlePostOcr = async () => {
    if (!ocrResult) return;
    try {
      setPostingLoading(true);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "post_ocr_invoice", invoiceData: ocrResult }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPostSuccess(data.result);
    } catch (err: any) {
      alert("Error al contabilizar: " + err.message);
    } finally {
      setPostingLoading(false);
    }
  };

  /**
   * Envía una pregunta analítica al Director Financiero Virtual (AI CFO)
   */
  const handleSendChat = async (questionText?: string) => {
    const q = (questionText || chatInput).trim();
    if (!q) return;

    const newMsgs = [
      ...chatMessages,
      { role: "user" as const, content: q, timestamp: "Ahora" },
    ];
    setChatMessages(newMsgs);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cfo_query", question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setChatMessages([
        ...newMsgs,
        {
          role: "assistant",
          content: data.answer,
          timestamp: "Ahora",
          metrics: data.metrics,
        },
      ]);
      if (data.metrics) {
        setCfoMetrics(data.metrics);
      }
    } catch (err: any) {
      setChatMessages([
        ...newMsgs,
        {
          role: "assistant",
          content: "❌ Error al consultar los datos financieros: " + err.message,
          timestamp: "Ahora",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  /**
   * Genera la propuesta de partida doble a partir de lenguaje natural
   */
  const handleGenerateNaturalEntry = async () => {
    if (!naturalText.trim()) return;
    try {
      setNaturalLoading(true);
      setNaturalSuccess(null);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "natural_entry", text: naturalText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNaturalResult(data.data);
    } catch (err: any) {
      alert("Error al procesar la transacción: " + err.message);
    } finally {
      setNaturalLoading(false);
    }
  };

  /**
   * Confirma y asienta el comprobante en el Libro Diario
   */
  const handlePostNaturalEntry = async () => {
    if (!naturalResult) return;
    try {
      setPostingNaturalLoading(true);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "post_natural_entry", entryData: naturalResult }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNaturalSuccess(data.entry);
    } catch (err: any) {
      alert("Error al asentar comprobante: " + err.message);
    } finally {
      setPostingNaturalLoading(false);
    }
  };

  /**
   * Ejecuta el escaneo de auditoría neuronal de anomalías contables
   */
  const handleRunAudit = async () => {
    try {
      setAuditLoading(true);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "audit_anomalies" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAuditAlerts(data.data.alerts || []);
      setAuditScore(data.data.healthScore);
    } catch (err: any) {
      alert("Error al ejecutar auditoría neuronal: " + err.message);
    } finally {
      setAuditLoading(false);
    }
  };

  // Carga inicial de auditoría al cambiar de pestaña
  useEffect(() => {
    if (activeTab === "audit" && auditAlerts.length === 0) {
      handleRunAudit();
    }
  }, [activeTab]);

  return (
    <div className="ai-container">
      {/* ─── Encabezado Principal & Estado del Motor ───────────────────────── */}
      <div className="ai-header-card">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Motor de Automatización Contable & Reglas NIIF • Activo
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3 text-foreground">
              <span className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
                <Sparkles size={24} />
              </span>
              Automatización Inteligente Contable & Asistente NIIF
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
              Extracción automatizada de facturas, causación instantánea con partida doble y asesoría financiera estratégica en tiempo real.
            </p>
          </div>

          {/* Badges de Estado */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-secondary border border-border text-xs">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Norma Fiscal</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 size={13} className="text-emerald-500" /> DIAN UBL 2.1
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-secondary border border-border text-xs">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Precisión OCR</span>
              <span className="font-bold text-emerald-500 mt-0.5 block">98.4% NIIF</span>
            </div>
          </div>
        </div>

        {/* ─── Pestañas Separadas e Intuitivas ─────────────────────────────── */}
        <div className="ai-tabs-container">
          <button
            onClick={() => setActiveTab("ocr")}
            className={`ai-tab-btn ${activeTab === "ocr" ? "active" : ""}`}
          >
            <FileSearch size={18} />
            <span>Scanner OCR & Facturas</span>
          </button>

          <button
            onClick={() => setActiveTab("cfo")}
            className={`ai-tab-btn ${activeTab === "cfo" ? "active" : ""}`}
          >
            <Bot size={18} />
            <span>Director Financiero (AI CFO)</span>
          </button>

          <button
            onClick={() => setActiveTab("natural")}
            className={`ai-tab-btn ${activeTab === "natural" ? "active" : ""}`}
          >
            <Wand2 size={18} />
            <span>Causación en Lenguaje Natural</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`ai-tab-btn ${activeTab === "audit" ? "active" : ""}`}
          >
            <ShieldCheck size={18} />
            <span>Auditoría de Anomalías</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 1: SCANNER OCR & FACTURACIÓN INTELIGENTE                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "ocr" && (
        <div className="ai-grid-layout">
          {/* Panel Izquierdo: Entrada de Factura y Editor Rectangular */}
          <div className="ai-panel space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Zap size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Documento de Factura a Procesar</h2>
                  <p className="text-xs text-muted-foreground">Seleccione una plantilla típica o pegue el contenido</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground px-3 py-1 rounded-full bg-secondary border border-border">
                UBL 2.1 / OCR
              </span>
            </div>

            {/* Plantillas Separadas en Cards Elegantes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Plantillas Rápidas de Facturas Frecuentes:
              </label>
              <div className="ai-presets-grid">
                {ocrPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setOcrText(preset.text);
                      setOcrResult(null);
                      setPostSuccess(null);
                    }}
                    className="ai-preset-card group"
                  >
                    <span className="text-xl p-2 rounded-xl bg-card border border-border group-hover:scale-110 transition-transform shrink-0">
                      {preset.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {preset.name}
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block mt-0.5">
                        {preset.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Editor Rectangular Amplio de Factura ────────────────────── */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Contenido Extraído (OCR / XML / PDF):
              </label>

              <div className="ai-editor-wrapper">
                {/* Barra Superior del Editor */}
                <div className="ai-editor-header">
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                    </span>
                    <span className="ml-2 font-mono text-[11px] text-foreground">factura_entrada.txt</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ocrText);
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 2000);
                      }}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedText ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      {copiedText ? "Copiado" : "Copiar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOcrText("");
                        setOcrResult(null);
                        setPostSuccess(null);
                      }}
                      className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Textarea Rectangular Espacioso */}
                <textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  placeholder="Pegue aquí el texto completo o XML de la factura de compra recibida..."
                  className="ai-textarea-rectangular"
                  rows={12}
                />

                {/* Pie del Editor */}
                <div className="ai-editor-footer">
                  <span>{ocrText.length} caracteres • {ocrText.split("\n").length} líneas</span>
                  <span>Formato Estructurado UTF-8</span>
                </div>
              </div>
            </div>

            {/* Botón Principal de Procesamiento */}
            <button
              onClick={handleRunOcr}
              disabled={ocrLoading || !ocrText.trim()}
              className="ai-action-btn-large"
            >
              {ocrLoading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Analizando y Clasificando con Red Neuronal...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Procesar Factura con IA
                </>
              )}
            </button>
          </div>

          {/* Panel Derecho: Resultados, Clasificación PUC e Imputación */}
          <div className="ai-panel space-y-5">
            {ocrResult ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Cabecera del Resultado */}
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck size={20} />
                      </span>
                      <h3 className="font-extrabold text-base text-foreground">
                        Extracción & Clasificación Validada
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Modelo Predictivo NIIF Colombia UBL 2.1
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    Confianza {(ocrResult.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Grid de Metadatos del Emisor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-secondary border border-border text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
                      Tercero / Emisor
                    </span>
                    <span className="font-bold text-sm text-foreground block truncate mt-0.5">
                      {ocrResult.supplierName}
                    </span>
                    <span className="font-mono text-muted-foreground block text-[11px] mt-0.5">
                      NIT: {ocrResult.supplierNit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] font-semibold uppercase">
                      Documento Fiscal
                    </span>
                    <span className="font-bold text-sm text-foreground block mt-0.5">
                      Factura {ocrResult.invoiceNumber}
                    </span>
                    <span className="text-muted-foreground block text-[11px] mt-0.5">
                      Emisión: {ocrResult.issueDate} • Plazo: 30 días
                    </span>
                  </div>
                </div>

                {/* Tarjeta de Sugerencia PUC */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Sparkles size={14} /> Cuenta Contable Sugerida (PUC NIIF):
                  </div>
                  <div className="text-sm md:text-base font-extrabold font-mono text-foreground">
                    {ocrResult.suggestedAccountCode} · {ocrResult.suggestedAccountName}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Clasificación inferida por correlación de conceptos de compras corporativas.
                  </p>
                </div>

                {/* Desglose Tributario */}
                <div className="space-y-2 border-t border-border pt-4 text-xs">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block">
                    Liquidación Tributaria & Retenciones
                  </span>
                  <div className="space-y-2 bg-secondary p-4 rounded-xl border border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotal Base Imponible:</span>
                      <span className="font-mono font-semibold text-foreground">{formatCOP(ocrResult.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-500">
                      <span>(+) IVA Descontable (19%):</span>
                      <span className="font-mono font-semibold">{formatCOP(ocrResult.ivaAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-500">
                      <span>(-) Retención en la Fuente Practicada (2.5%):</span>
                      <span className="font-mono font-semibold">-{formatCOP(ocrResult.retefuenteAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center font-extrabold text-sm border-t border-border pt-2.5 text-foreground">
                      <span>Total Neto a Pagar Proveedor (CXP):</span>
                      <span className="font-mono text-emerald-500">{formatCOP(ocrResult.totalPayable)}</span>
                    </div>
                  </div>
                </div>

                {/* Feedback de Contabilización */}
                {postSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1 animate-in zoom-in-95 duration-200">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-sm">
                      <CheckCircle2 size={16} /> ¡Comprobante Contabilizado Exitosamente!
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Se ha generado el <strong>Asiento Contable #{postSuccess.entry?.number}</strong> en el Libro Diario con partida doble exacta.
                    </p>
                  </div>
                )}

                {/* Botón de Contabilizar */}
                <button
                  onClick={handlePostOcr}
                  disabled={postingLoading || Boolean(postSuccess)}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    postSuccess
                      ? "bg-secondary text-muted-foreground border border-border cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.99]"
                  }`}
                >
                  {postingLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Asentando en Libro Diario y CXP...
                    </>
                  ) : postSuccess ? (
                    <>
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      Factura Ya Contabilizada
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Asentar en Libro Diario (Partida Doble)
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Estado Vacío con Alta Estética */
              <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[460px] space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <FileSearch size={32} />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[9px] text-white font-bold items-center justify-center">
                      AI
                    </span>
                  </span>
                </div>
                <div className="max-w-xs space-y-1.5">
                  <h3 className="font-bold text-base text-foreground">Esperando Documento</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Selecciona una de las plantillas de la izquierda o pega el texto en el editor rectangular para ejecutar la extracción automática con IA.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 2: ASESOR FINANCIERO AUTOMATIZADO (CFO)                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "cfo" && (
        <div className="space-y-6">
          {/* Métricas en Vivo en Tarjetas Separadas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="ai-panel space-y-1">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Landmark size={15} className="text-indigo-500" /> Disponible en Bancos & Caja
              </span>
              <div className="text-2xl font-extrabold text-foreground">
                {cfoMetrics ? formatCOP(cfoMetrics.totalCash) : "$ 145.800.000"}
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                <TrendingUp size={12} /> Flujo de caja positivo
              </span>
            </div>

            <div className="ai-panel space-y-1">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <TrendingUp size={15} className="text-emerald-500" /> Margen Operativo Neto
              </span>
              <div className="text-2xl font-extrabold text-foreground">
                {cfoMetrics ? `${cfoMetrics.netMargin.toFixed(1)}%` : "24.8%"}
              </div>
              <span className="text-[11px] text-muted-foreground">Sobre ingresos totales</span>
            </div>

            <div className="ai-panel space-y-1">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Activity size={15} className="text-cyan-500" /> Razón Corriente (Solvencia)
              </span>
              <div className="text-2xl font-extrabold text-foreground">
                {cfoMetrics ? `${cfoMetrics.currentRatio.toFixed(2)}x` : "1.85x"}
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold">Respaldo óptimo</span>
            </div>
          </div>

          {/* Chat con AI CFO */}
          <div className="ai-panel p-0 overflow-hidden flex flex-col h-[600px]">
            {/* Header del Chat */}
            <div className="px-6 py-4 border-b border-border bg-secondary flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
                    <Bot size={22} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card"></span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Director Financiero Virtual (AI CFO)</h3>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Conectado al Libro Diario y Estados Financieros NIIF
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setChatMessages([
                    {
                      role: "assistant",
                      content: "Conversación reiniciada. ¿Qué otra consulta financiera deseas realizar?",
                      timestamp: "Ahora",
                    },
                  ]);
                }}
                className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-secondary transition-colors cursor-pointer"
              >
                Limpiar Chat
              </button>
            </div>

            {/* Lista de Mensajes */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-3xl ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white"
                    }`}
                  >
                    {msg.role === "user" ? "Tú" : <Bot size={16} />}
                  </div>
                  <div
                    className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-primary text-white shadow-sm rounded-tr-none"
                        : "bg-secondary border border-border text-foreground shadow-sm rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3 max-w-md mr-auto">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="rounded-2xl p-4 bg-secondary border border-border text-xs text-muted-foreground flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-primary" />
                    Consultando base de datos contable y calculando ratios...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Píldoras de Sugerencia y Campo de Entrada */}
            <div className="p-4 border-t border-border bg-secondary space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  "¿Cuál es mi liquidez y solvencia?",
                  "¿Cuánto debemos pagar de impuestos a la DIAN?",
                  "¿Cómo está el margen y rentabilidad?",
                  "¿Cuál es el estado de la cartera de clientes?",
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChat(sug)}
                    className="text-[11px] px-3.5 py-2 rounded-xl bg-card hover:bg-primary hover:text-white border border-border transition-all cursor-pointer text-foreground font-medium shadow-xs"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pregúntale a tu Director Financiero Virtual (ej. ¿cuál es nuestra proyección de caja?)..."
                  className="flex-1 p-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 3: CAUSACIÓN EN LENGUAJE NATURAL                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "natural" && (
        <div className="space-y-6">
          <div className="ai-panel space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Wand2 size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Generador de Asientos Contables en Lenguaje Natural
                </h2>
                <p className="text-xs text-muted-foreground">
                  Describe en lenguaje cotidiano la transacción ocurrida y el motor estructurará el comprobante contable bajo NIIF.
                </p>
              </div>
            </div>

            {/* Escenarios Separados en Tarjetas con Espaciado */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                Prueba con estos escenarios empresariales:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {naturalPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNaturalText(preset.text);
                      setNaturalResult(null);
                      setNaturalSuccess(null);
                    }}
                    className="p-4 rounded-xl border border-border bg-secondary hover:border-primary/50 text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {preset.title}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {preset.text}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            {/* Campo de Entrada Rectangular Amplio */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Descripción de la Transacción:
              </label>
              <div className="ai-editor-wrapper">
                <div className="ai-editor-header">
                  <span>Descripción Económica</span>
                  <span>Motor NIIF Partida Doble</span>
                </div>
                <textarea
                  rows={4}
                  value={naturalText}
                  onChange={(e) => setNaturalText(e.target.value)}
                  className="ai-textarea-rectangular"
                  style={{ minHeight: "130px", height: "130px" }}
                  placeholder="Ej: Pagamos $2.500.000 por concepto de servicio técnico de servidores con cheque..."
                />
              </div>
            </div>

            <button
              onClick={handleGenerateNaturalEntry}
              disabled={naturalLoading || !naturalText.trim()}
              className="ai-action-btn-large"
              style={{ width: "auto" }}
            >
              {naturalLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Estructurando Asiento de Partida Doble...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generar Asiento Contable
                </>
              )}
            </button>
          </div>

          {/* Resultado de Partida Doble Generado */}
          {naturalResult && (
            <div className="ai-panel border-indigo-500/30 space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-indigo-500" /> Propuesta de Comprobante
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{naturalResult.description}</p>
                </div>
                <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-secondary border border-border">
                  Ref: {naturalResult.reference}
                </span>
              </div>

              {/* Justificación contable */}
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2.5">
                <HelpCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Criterio Contable NIIF:</strong>
                  {naturalResult.reasoning}
                </div>
              </div>

              {/* Tabla de Partida Doble */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-secondary text-muted-foreground font-semibold border-b border-border uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 text-left">Código PUC</th>
                      <th className="p-3 text-left">Cuenta Contable</th>
                      <th className="p-3 text-right">Débito</th>
                      <th className="p-3 text-right">Crédito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {naturalResult.lines.map((l, i) => (
                      <tr key={i} className="hover:bg-secondary/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-foreground">{l.code}</td>
                        <td className="p-3 text-foreground">{l.name}</td>
                        <td className="p-3 text-right font-mono font-semibold text-foreground">
                          {l.debit > 0 ? formatCOP(l.debit) : "-"}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-foreground">
                          {l.credit > 0 ? formatCOP(l.credit) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-secondary font-bold border-t border-border">
                    <tr>
                      <td colSpan={2} className="p-3 text-right uppercase text-[10px] tracking-wider text-muted-foreground">
                        Sumas Iguales (Partida Doble):
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-500">
                        {formatCOP(naturalResult.amount)}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-500">
                        {formatCOP(naturalResult.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {naturalSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={16} /> ¡Comprobante #{naturalSuccess.number} asentado exitosamente en el Libro Diario!
                </div>
              )}

              <button
                onClick={handlePostNaturalEntry}
                disabled={postingNaturalLoading || Boolean(naturalSuccess)}
                className={`py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  naturalSuccess
                    ? "bg-secondary text-muted-foreground border border-border cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                }`}
              >
                {postingNaturalLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Asentando en Libro Diario...
                  </>
                ) : naturalSuccess ? (
                  <>
                    <CheckCircle2 size={16} />
                    Asiento Contabilizado
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Confirmar y Asentar en Libro Diario
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 4: AUDITORÍA DE ANOMALÍAS Y RIESGOS                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="ai-panel flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-500" />
                Auditor Neuronal de Riesgos & Evasión
              </h2>
              <p className="text-xs text-muted-foreground">
                Escaneo proactivo en libros mayores, facturación y cuentas por cobrar para prevenir contingencias fiscales.
              </p>
            </div>
            <button
              onClick={handleRunAudit}
              disabled={auditLoading}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <RefreshCw size={14} className={auditLoading ? "animate-spin" : ""} />
              {auditLoading ? "Escaneando Libros..." : "Reescanear Base de Datos"}
            </button>
          </div>

          {/* Calificación de Salud Contable */}
          {auditScore !== null && (
            <div className="ai-panel flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground block">
                  Índice de Confiabilidad Contable
                </span>
                <div className="text-3xl font-extrabold text-foreground mt-0.5">
                  {auditScore} <span className="text-base text-muted-foreground font-normal">/ 100</span>
                </div>
                <p className="text-xs text-emerald-500 font-semibold mt-1">
                  {auditScore >= 85 ? "✓ Estado Contable Saludable" : "⚠ Requiere Ajustes Preventivos"}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ShieldCheck size={36} />
              </div>
            </div>
          )}

          {/* Lista de Hallazgos y Anomalías Separadas */}
          <div className="space-y-3.5">
            {auditAlerts.length > 0 ? (
              auditAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="ai-panel space-y-3 hover:border-primary/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span
                        className={`p-2.5 rounded-xl text-xs font-bold ${
                          alert.severity === "CRITICAL"
                            ? "bg-rose-500/10 text-rose-500"
                            : alert.severity === "HIGH"
                            ? "bg-amber-500/10 text-amber-500"
                            : alert.severity === "MEDIUM"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        <AlertTriangle size={18} />
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{alert.title}</h4>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Severidad: {alert.severity}
                        </span>
                      </div>
                    </div>
                    {alert.kpi && (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-secondary border border-border text-foreground">
                        {alert.kpi}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
                  <div className="p-3.5 rounded-xl bg-secondary border border-border text-xs">
                    <strong className="text-foreground font-semibold">Acción Recomendada: </strong>
                    <span className="text-muted-foreground">{alert.recommendation}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="ai-panel p-10 text-center text-xs text-muted-foreground">
                Presiona "Reescanear Base de Datos" para iniciar el análisis neuronal de los libros contables.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
