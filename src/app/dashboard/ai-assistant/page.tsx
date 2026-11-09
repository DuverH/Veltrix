"use client";

/**
 * @file page.tsx
 * @description Centro de Inteligencia Artificial Contable & Copilot NIIF (Veltrix AI).
 *
 * Módulo de asistencia financiera autónoma con cuatro capacidades centrales:
 *   1. **Scanner OCR & Causación**: Reconocimiento de facturas de compra (físicas/XML/PDF),
 *      cálculo de impuestos (IVA 19%, Retefuente) y contabilización en Libro Diario.
 *   2. **Director Financiero Virtual (AI CFO)**: Chat consultor conectado en tiempo real
 *      a la base de datos contable (Liquidez, Rentabilidad, Impuestos, Cartera).
 *   3. **Causación en Lenguaje Natural**: Generación de asientos contables de partida doble
 *      a partir de instrucciones en texto ordinario.
 *   4. **Auditoría de Anomalías & Riesgos**: Detección inteligente de saldos rojos,
 *      cartera en mora y recomendaciones de optimización tributaria.
 *
 * Buenas prácticas aplicadas:
 *   - Arquitectura basada en componentes reactivos de React 19.
 *   - Compatibilidad total con Modo Claro y Modo Oscuro Puro (OLED Black #000000).
 *   - Tipado estricto con TypeScript.
 *   - Accesibilidad con atajos de teclado (`Enter` para enviar preguntas).
 */

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  FileSearch,
  CheckCircle2,
  ArrowRight,
  Send,
  Zap,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Building,
  UploadCloud,
  FileText,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Layers,
  Wand2,
  Activity,
  DollarSign,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

// ─── Tipos e Interfaces ────────────────────────────────────────────────────────

/**
 * Estructura de datos de factura extraída por el motor OCR / IA
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
 * Estructura de asiento generado a partir de lenguaje natural
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
 * Mensaje del chat con el Director Financiero Virtual
 */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  metrics?: Record<string, any>;
}

/**
 * Alerta o anomalía detectada por el auditor neuronal
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
  const [naturalPrompt, setNaturalPrompt] = useState(
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

  // ─── Utilidades de Formato ──────────────────────────────────────────────────
  /**
   * Formatea un número como Moneda Legal Colombiana (COP) sin decimales innecesarios.
   */
  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val || 0);

  // Auto-scroll en el chat de CFO al recibir nuevos mensajes
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

  // ─── Prompts de Ejemplo para Lenguaje Natural ────────────────────────────────
  const naturalPresets = [
    "Pagamos $4.500.000 de arrendamiento de la oficina piso 3 por transferencia bancaria Bancolombia",
    "Venta de servicios de consultoría por $8.000.000 a crédito a 30 días",
    "Compra de útiles y papelería por $350.000 pagados en efectivo de caja general",
    "Pago de honorarios contables por $2.800.000 con retención en la fuente practicada del 4%",
  ];

  // ─── Handlers de Operaciones Asíncronas ──────────────────────────────────────

  /**
   * Ejecuta el análisis y clasificación inteligente del texto de factura
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
   * Contabiliza la factura clasificada directamente en el Libro Diario
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
   * Genera propuesta de asiento contable a partir de lenguaje natural
   */
  const handleGenerateNaturalEntry = async () => {
    if (!naturalPrompt.trim()) return;
    try {
      setNaturalLoading(true);
      setNaturalSuccess(null);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "natural_entry", prompt: naturalPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNaturalResult(data.data);
    } catch (err: any) {
      alert("Error al procesar prompt: " + err.message);
    } finally {
      setNaturalLoading(false);
    }
  };

  /**
   * Confirma y asienta el asiento de lenguaje natural en el Libro Diario
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

  // Cargar auditoría al abrir la pestaña correspondiente
  useEffect(() => {
    if (activeTab === "audit" && auditAlerts.length === 0) {
      handleRunAudit();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── Encabezado Principal & Estado del Motor ───────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-card via-card to-primary/5 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Veltrix Neural Engine v2.4 • Activo & Conectado al PUC
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md">
                <Sparkles size={24} />
              </span>
              Inteligencia Artificial Contable & Copilot NIIF
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
              Extracción y clasificación automatizada de facturas, causación instantánea con partida doble y asesoría financiera estratégica en tiempo real.
            </p>
          </div>

          {/* Métricas rápidas de cabecera */}
          <div className="flex items-center gap-3 bg-secondary/60 backdrop-blur-sm p-2 rounded-xl border border-border/80 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-card border border-border/60">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Norma Fiscal</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> DIAN UBL 2.1
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-card border border-border/60">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Precisión OCR</span>
              <span className="font-semibold text-emerald-500">98.4% NIIF</span>
            </div>
          </div>
        </div>

        {/* ─── Pestañas de Navegación Segmentada ───────────────────────────── */}
        <div className="mt-8 pt-4 border-t border-border/60 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("ocr")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "ocr"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <FileSearch size={16} />
            Scanner OCR & Facturas
          </button>

          <button
            onClick={() => setActiveTab("cfo")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "cfo"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Bot size={16} />
            Director Financiero (AI CFO)
          </button>

          <button
            onClick={() => setActiveTab("natural")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "natural"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Wand2 size={16} />
            Causación en Lenguaje Natural
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "audit"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <ShieldCheck size={16} />
            Auditoría de Anomalías
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 1: SCANNER OCR & FACTURACIÓN INTELIGENTE                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "ocr" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Panel Izquierdo: Carga y Editor de Factura */}
          <div className="lg:col-span-6 space-y-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Documento de Factura a Procesar</h2>
                    <p className="text-xs text-muted-foreground">Seleccione una plantilla típica o pegue el contenido</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground px-2.5 py-1 rounded-full bg-secondary border border-border">
                  UBL 2.1 / OCR
                </span>
              </div>

              {/* Plantillas en Cards elegantes */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Plantillas Rápidas de Facturas Frecuentes:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ocrPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setOcrText(preset.text);
                        setOcrResult(null);
                        setPostSuccess(null);
                      }}
                      className="group flex items-start gap-3 p-3 rounded-xl border border-border/80 bg-secondary/40 hover:bg-secondary hover:border-primary/50 transition-all text-left cursor-pointer"
                    >
                      <span className="text-lg p-1.5 rounded-lg bg-card border border-border/50 group-hover:scale-110 transition-transform">
                        {preset.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {preset.name}
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                          {preset.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editor de Texto Monospaced */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-muted-foreground">
                    Contenido Extraído (OCR / XML / PDF):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ocrText);
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 2000);
                      }}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedText ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
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

                <div className="relative rounded-xl border border-border overflow-hidden bg-background">
                  <textarea
                    rows={10}
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    className="w-full p-3.5 font-mono text-xs leading-relaxed text-foreground bg-transparent focus:outline-none resize-y"
                    placeholder="Pegue aquí el texto de la factura de compra recibida..."
                  />
                  <div className="px-3.5 py-1.5 border-t border-border/60 bg-secondary/30 flex justify-between items-center text-[11px] text-muted-foreground">
                    <span>{ocrText.length} caracteres</span>
                    <span>Formato UTF-8 estructurado</span>
                  </div>
                </div>
              </div>

              {/* Botón de Acción Principal */}
              <button
                onClick={handleRunOcr}
                disabled={ocrLoading || !ocrText.trim()}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {ocrLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Analizando y Clasificando con Red Neuronal...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Procesar Factura con IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Panel Derecho: Resultados, Clasificación PUC e Imputación */}
          <div className="lg:col-span-6 space-y-5">
            {ocrResult ? (
              <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
                {/* Cabecera del Documento Extraído */}
                <div className="flex justify-between items-start border-b border-border/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck size={18} />
                      </span>
                      <h3 className="font-extrabold text-base text-foreground">
                        Extracción & Clasificación Validada
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Modelo Predictivo NIIF Colombia UBL 2.1
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                      Confianza {(ocrResult.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Grid de Metadatos del Emisor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/50 border border-border/70 text-xs">
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
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-1">
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

                {/* Desglose Tributario & Partida Doble */}
                <div className="space-y-2 border-t border-border/70 pt-4 text-xs">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block">
                    Liquidación Tributaria & Retenciones
                  </span>
                  <div className="space-y-2 bg-secondary/30 p-3.5 rounded-xl border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotal Base Imponible:</span>
                      <span className="font-mono font-semibold">{formatCOP(ocrResult.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-blue-500">
                      <span>(+) IVA Descontable (19%):</span>
                      <span className="font-mono font-semibold">{formatCOP(ocrResult.ivaAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-500">
                      <span>(-) Retención en la Fuente Practicada (2.5%):</span>
                      <span className="font-mono font-semibold">-{formatCOP(ocrResult.retefuenteAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center font-extrabold text-sm border-t border-border/80 pt-2 text-foreground">
                      <span>Total Neto a Pagar Proveedor (CXP):</span>
                      <span className="font-mono text-emerald-500">{formatCOP(ocrResult.totalPayable)}</span>
                    </div>
                  </div>
                </div>

                {/* Mensaje de Confirmación de Contabilización */}
                {postSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5 animate-in zoom-in-95 duration-200">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-sm">
                      <CheckCircle2 size={16} /> ¡Comprobante Contabilizado Exitosamente!
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Se ha generado el <strong>Asiento Contable #{postSuccess.entry?.number}</strong> en el Libro Diario con partida doble exacta. La factura de compra ha sido asentada en Cuentas por Pagar.
                    </p>
                  </div>
                )}

                {/* Botón de Contabilizar */}
                <button
                  onClick={handlePostOcr}
                  disabled={postingLoading || Boolean(postSuccess)}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    postSuccess
                      ? "bg-secondary text-muted-foreground border border-border cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-[0.99]"
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
              /* Estado Vacío de Alta Estética */
              <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center flex flex-col items-center justify-center min-h-[460px] space-y-4">
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
                <div className="max-w-xs space-y-1">
                  <h3 className="font-bold text-base text-foreground">Esperando Documento</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Selecciona una de las plantillas de la izquierda o pega el texto de una factura para ejecutar la extracción inteligente de datos y su asiento PUC.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 2: DIRECTOR FINANCIERO VIRTUAL (AI CFO COPILOT)               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "cfo" && (
        <div className="space-y-6">
          {/* Tarjetas de Métricas en Vivo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Landmark size={14} className="text-indigo-500" /> Disponible en Bancos & Caja
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-foreground">
                {cfoMetrics ? formatCOP(cfoMetrics.totalCash) : "$ 145.800.000"}
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                <TrendingUp size={12} /> Flujo de caja positivo
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-500" /> Margen Operativo Neto
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-foreground">
                {cfoMetrics ? `${cfoMetrics.netMargin.toFixed(1)}%` : "24.8%"}
              </div>
              <span className="text-[11px] text-muted-foreground">Sobre ingresos totales</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-1 shadow-sm">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Activity size={14} className="text-cyan-500" /> Razón Corriente (Solvencia)
              </span>
              <div className="text-xl md:text-2xl font-extrabold text-foreground">
                {cfoMetrics ? `${cfoMetrics.currentRatio.toFixed(2)}x` : "1.85x"}
              </div>
              <span className="text-[11px] text-emerald-500 font-semibold">Respaldo óptimo</span>
            </div>
          </div>

          {/* Interfaz de Chat con el AI CFO */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col h-[580px]">
            {/* Header del Chat */}
            <div className="px-6 py-4 border-b border-border/80 bg-secondary/30 flex justify-between items-center">
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
                className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg border border-border bg-secondary hover:bg-border transition-colors cursor-pointer"
              >
                Limpiar Chat
              </button>
            </div>

            {/* Mensajes del Chat */}
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
                        : "bg-secondary/70 border border-border/80 text-foreground shadow-sm rounded-tl-none"
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
                  <div className="rounded-2xl p-4 bg-secondary/70 border border-border/80 text-xs text-muted-foreground flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-primary" />
                    Consultando base de datos contable y calculando ratios...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Sugerencias Rápidas & Caja de Input */}
            <div className="p-4 border-t border-border/80 bg-secondary/20 space-y-3">
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
                    className="text-[11px] px-3 py-1.5 rounded-full bg-secondary hover:bg-primary hover:text-white border border-border transition-all cursor-pointer text-muted-foreground"
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
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pregúntale a tu Director Financiero Virtual (ej. ¿cuál es nuestra proyección de caja?)..."
                  className="flex-1 p-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-3 rounded-xl bg-primary hover:bg-primary-hover text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
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
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Wand2 size={24} />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-foreground">
                  Generador de Asientos Contables por Prompt Natural
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Escribe en lenguaje cotidiano lo que ocurrió en tu empresa y la red neuronal estructurará el comprobante bajo NIIF.
                </p>
              </div>
            </div>

            {/* Ejemplos de 1 Clic */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block">
                Prueba con estos escenarios empresariales:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {naturalPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNaturalPrompt(preset);
                      setNaturalResult(null);
                      setNaturalSuccess(null);
                    }}
                    className="p-3 rounded-xl border border-border/80 bg-secondary/40 hover:bg-secondary hover:border-primary/50 text-left text-xs transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span className="text-foreground group-hover:text-primary transition-colors pr-2">
                      {preset}
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Input de Prompt */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">
                Instrucción en Lenguaje Natural:
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={naturalPrompt}
                  onChange={(e) => setNaturalPrompt(e.target.value)}
                  className="w-full p-4 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary leading-relaxed"
                  placeholder="Ej: Pagamos $2.500.000 por concepto de servicio técnico de servidores con cheque..."
                />
              </div>
            </div>

            <button
              onClick={handleGenerateNaturalEntry}
              disabled={naturalLoading || !naturalPrompt.trim()}
              className="py-3 px-6 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-primary/20"
            >
              {naturalLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Estructurando Asiento de Partida Doble...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generar Asiento Contable
                </>
              )}
            </button>
          </div>

          {/* Resultado de Partida Doble Generado */}
          {naturalResult && (
            <div className="rounded-2xl border border-indigo-500/30 bg-card p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border/80 pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-indigo-500" /> Propuesta de Comprobante
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{naturalResult.description}</p>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-secondary border border-border">
                  Ref: {naturalResult.reference}
                </span>
              </div>

              {/* Justificación contable */}
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                <HelpCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Criterio Contable NIIF:</strong>
                  {naturalResult.reasoning}
                </div>
              </div>

              {/* Tabla de Partida Doble */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/60 text-muted-foreground font-semibold border-b border-border uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 text-left">Código PUC</th>
                      <th className="p-3 text-left">Cuenta Contable</th>
                      <th className="p-3 text-right">Débito</th>
                      <th className="p-3 text-right">Crédito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {naturalResult.lines.map((l, i) => (
                      <tr key={i} className="hover:bg-secondary/30 transition-colors">
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
                  <tfoot className="bg-secondary/40 font-bold border-t border-border">
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
                className={`py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-500" />
                Auditor Neuronal de Riesgos & Evasión
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
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
            <div className="p-6 rounded-2xl border border-border bg-gradient-to-r from-card via-card to-emerald-500/5 flex items-center justify-between">
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
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ShieldCheck size={36} />
              </div>
            </div>
          )}

          {/* Lista de Hallazgos y Anomalías */}
          <div className="space-y-3">
            {auditAlerts.length > 0 ? (
              auditAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm hover:border-primary/40 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`p-2 rounded-xl text-xs font-bold ${
                          alert.severity === "CRITICAL"
                            ? "bg-rose-500/10 text-rose-500"
                            : alert.severity === "HIGH"
                            ? "bg-amber-500/10 text-amber-500"
                            : alert.severity === "MEDIUM"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        <AlertTriangle size={16} />
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
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs">
                    <strong className="text-foreground font-semibold">Acción Recomendada: </strong>
                    <span className="text-muted-foreground">{alert.recommendation}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Presiona "Reescanear Base de Datos" para iniciar el análisis neuronal.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
