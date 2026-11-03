"use client";

import { useState } from "react";
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
} from "lucide-react";

export default function AiAssistantPage() {
  const [activeTab, setActiveTab] = useState<"ocr" | "cfo">("ocr");

  // OCR state
  const [ocrText, setOcrText] = useState(
    `SOLUCIONES CLOUD & HARDWARE S.A.S.
NIT: 901.445.892-1
FACTURA ELECTRÓNICA DE VENTA No. FE-2026-9810
Fecha de Emisión: 2026-02-10
Fecha de Vencimiento: 2026-03-12

ÍTEM: Servicio de suscripción a servidores en la nube y mantenimiento de equipos informáticos
CANTIDAD: 1
VALOR UNITARIO: $ 3.500.000
SUBTOTAL: $ 3.500.000
IVA (19%): $ 665.000
TOTAL FACTURA: $ 4.165.000`
  );

  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [postingLoading, setPostingLoading] = useState(false);
  const [postSuccess, setPostSuccess] = useState<any>(null);

  // CFO Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content:
        "¡Hola! Soy tu Director Financiero Virtual (AI CFO). Analizo en tiempo real los libros contables, balances, estado de resultados y flujo de caja de tu empresa. ¿Qué indicador o diagnóstico financiero deseas consultar hoy?",
    },
  ]);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val || 0);

  const presets = [
    {
      name: "Factura Infraestructura Cloud / Servidores",
      text: `SOLUCIONES CLOUD & HARDWARE S.A.S.\nNIT: 901.445.892-1\nFACTURA ELECTRÓNICA DE VENTA No. FE-2026-9810\nFecha de Emisión: 2026-02-10\nÍTEM: Servicio de servidores en la nube y licencias software\nVALOR UNITARIO: $ 3.500.000\nSUBTOTAL: $ 3.500.000`,
    },
    {
      name: "Factura Honorarios Asesoría Jurídica y Tributaria",
      text: `ASESORES LEGALES Y TRIBUTARIOS S.A.S.\nNIT: 830.120.945-8\nFACTURA ELECTRÓNICA No. SETP-4402\nFecha de Emisión: 2026-02-12\nÍTEM: Honorarios profesionales por asesoría jurídica y planeación fiscal NIIF\nVALOR UNITARIO: $ 2.800.000\nSUBTOTAL: $ 2.800.000`,
    },
    {
      name: "Factura Arrendamiento Oficinas y Bodega",
      text: `INMOBILIARIA CORPORATIVA DEL ORIENTE S.A.S.\nNIT: 860.035.771-4\nFACTURA ELECTRÓNICA No. AR-8891\nFecha de Emisión: 2026-02-01\nÍTEM: Canon de arrendamiento oficina administrativa piso 4\nVALOR UNITARIO: $ 4.200.000\nSUBTOTAL: $ 4.200.000`,
    },
    {
      name: "Factura Papelería y Suministros de Oficina",
      text: `DISTRIBUIDORA PAPELERA NACIONAL S.A.S.\nNIT: 900.221.789-0\nFACTURA No. PAP-1029\nFecha de Emisión: 2026-02-05\nÍTEM: Resmas de papel carta, tóners láser y carpetas de archivo\nVALOR UNITARIO: $ 850.000\nSUBTOTAL: $ 850.000`,
    },
  ];

  const handleRunOcr = async () => {
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
      alert("Error al procesar OCR: " + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

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

  const handleSendChat = async (questionText?: string) => {
    const q = questionText || chatInput;
    if (!q.trim()) return;

    const newMsgs = [...chatMessages, { role: "user" as const, content: q }];
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

      setChatMessages([...newMsgs, { role: "assistant", content: data.answer }]);
    } catch (err: any) {
      setChatMessages([
        ...newMsgs,
        { role: "assistant", content: "Error al consultar los datos financieros: " + err.message },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-amber-500" size={28} />
            Inteligencia Artificial Contable & OCR
          </h1>
          <p className="text-muted-foreground text-sm">
            Extracción inteligente de facturas, clasificación automática en PUC y Director Financiero Virtual (AI CFO) en tiempo real.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("ocr")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "ocr"
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSearch size={16} />
          OCR de Facturas & Asiento PUC Automático
        </button>
        <button
          onClick={() => setActiveTab("cfo")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "cfo"
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bot size={16} />
          Director Financiero Virtual (AI CFO)
        </button>
      </div>

      {/* PESTAÑA 1: OCR DE FACTURAS */}
      {activeTab === "ocr" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Entrada de texto / plantillas */}
          <div className="lg:col-span-6 space-y-4">
            <div className="card p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" /> Plantillas de Factura Electrónica
                </span>
                <span className="text-xs text-muted-foreground">O pegue texto extraído</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setOcrText(p.text);
                      setOcrResult(null);
                      setPostSuccess(null);
                    }}
                    className="p-2 text-left text-xs bg-accent/40 hover:bg-accent border border-border rounded transition-colors"
                  >
                    <div className="font-semibold text-foreground truncate">{p.name}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Texto de Factura Electrónica (OCR / XML / PDF):
                </label>
                <textarea
                  rows={9}
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  className="input font-mono text-xs w-full leading-relaxed"
                  placeholder="Pegue aquí el contenido de la factura..."
                />
              </div>

              <button
                onClick={handleRunOcr}
                disabled={ocrLoading}
                className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {ocrLoading ? "Analizando y clasificando con IA..." : "Procesar Factura con IA"}
              </button>
            </div>
          </div>

          {/* Columna Derecha: Resultado y Contabilización */}
          <div className="lg:col-span-6 space-y-4">
            {ocrResult ? (
              <div className="card p-5 space-y-4 border-amber-500/30">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-500" />
                      Datos Extraídos & Clasificación PUC
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Modelo Predictivo de Cuentas NIIF
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-success text-xs font-semibold">
                      Confianza {(ocrResult.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Proveedor / Emisor</span>
                    <span className="font-semibold text-sm">{ocrResult.supplierName}</span>
                    <span className="font-mono text-muted-foreground block">NIT: {ocrResult.supplierNit}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Factura No.</span>
                    <span className="font-semibold text-sm">{ocrResult.invoiceNumber}</span>
                    <span className="text-muted-foreground block">Emisión: {ocrResult.issueDate}</span>
                  </div>
                </div>

                {/* Clasificación de Cuenta PUC */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                    <Sparkles size={13} /> Cuenta Contable Sugerida (PUC Colombia):
                  </div>
                  <div className="text-sm font-bold font-mono mt-0.5">
                    {ocrResult.suggestedAccountCode} - {ocrResult.suggestedAccountName}
                  </div>
                </div>

                {/* Desglose Tributario */}
                <div className="space-y-1.5 text-xs border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal Base:</span>
                    <span className="font-mono font-medium">{formatCOP(ocrResult.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA Descontable (19%):</span>
                    <span className="font-mono font-medium text-blue-600">{formatCOP(ocrResult.ivaAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retención en la Fuente practicada (2.5%):</span>
                    <span className="font-mono font-medium text-amber-600">-{formatCOP(ocrResult.retefuenteAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm border-t border-border pt-2 text-foreground">
                    <span>Neto a Pagar Proveedor (CXP):</span>
                    <span className="font-mono text-emerald-600">{formatCOP(ocrResult.totalPayable)}</span>
                  </div>
                </div>

                {/* Éxito de Contabilización */}
                {postSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Contabilizado Exitosamente en el Libro Diario
                    </div>
                    <div className="text-muted-foreground">
                      Asiento Contable #{postSuccess.entry?.number} generado con partida doble exacta. Factura de compra #{postSuccess.invoice?.number} guardada en Cuentas por Pagar.
                    </div>
                  </div>
                )}

                {/* Botón de Contabilizar */}
                <button
                  onClick={handlePostOcr}
                  disabled={postingLoading || Boolean(postSuccess)}
                  className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  {postSuccess
                    ? "Factura ya Contabilizada"
                    : postingLoading
                    ? "Generando Asiento..."
                    : "Contabilizar en PUC y Crear CXP"}
                </button>
              </div>
            ) : (
              <div className="card p-12 text-center text-muted-foreground flex flex-col items-center justify-center border-dashed">
                <FileSearch size={40} className="mb-3 opacity-30 text-amber-500" />
                <div className="font-semibold text-sm">Ninguna factura procesada todavía</div>
                <div className="text-xs max-w-xs mt-1">
                  Seleccione una plantilla a la izquierda o pegue el texto de una factura para ejecutar la extracción automática con IA.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: AI CFO CHATBOT */}
      {activeTab === "cfo" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-8 card flex flex-col h-[600px]">
            {/* Encabezado Chat */}
            <div className="p-4 border-b border-border flex items-center gap-3 bg-card/50">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI CFO - Asesor Financiero Ejecutivo</h3>
                <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conectado al Libro Mayor y Balances en tiempo real
                </span>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3.5 text-xs leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-accent/50 border border-border text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-accent/40 border border-border rounded-lg p-3 text-xs text-muted-foreground animate-pulse">
                    Consultando balance general y calculando indicadores...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions Chips */}
            <div className="p-2 border-t border-border bg-muted/20 flex gap-2 overflow-x-auto text-[11px]">
              <button
                onClick={() => handleSendChat("¿Cómo está la liquidez y razón corriente?")}
                className="px-2.5 py-1 bg-background hover:bg-accent border border-border rounded-full whitespace-nowrap"
              >
                💧 Liquidez & Razón Corriente
              </button>
              <button
                onClick={() => handleSendChat("¿Cuál es el margen de rentabilidad y utilidad neta?")}
                className="px-2.5 py-1 bg-background hover:bg-accent border border-border rounded-full whitespace-nowrap"
              >
                📈 Rentabilidad & Utilidad
              </button>
              <button
                onClick={() => handleSendChat("¿Cuánto debemos pagar de IVA y Retefuente a la DIAN?")}
                className="px-2.5 py-1 bg-background hover:bg-accent border border-border rounded-full whitespace-nowrap"
              >
                🏛️ Impuestos DIAN
              </button>
              <button
                onClick={() => handleSendChat("¿Cuál es el estado de la cartera de clientes?")}
                className="px-2.5 py-1 bg-background hover:bg-accent border border-border rounded-full whitespace-nowrap"
              >
                👥 Estado de Cartera
              </button>
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Escriba su consulta financiera o estratégica..."
                className="input text-xs flex-1"
                disabled={chatLoading}
              />
              <button
                onClick={() => handleSendChat()}
                disabled={chatLoading || !chatInput.trim()}
                className="btn btn-primary px-4 flex items-center gap-1 text-xs"
              >
                <Send size={14} />
                Enviar
              </button>
            </div>
          </div>

          {/* Panel Lateral: Capacidades del AI CFO */}
          <div className="lg:col-span-4 space-y-4">
            <div className="card p-5 space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" /> Capacidades Analíticas
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                El AI CFO inspecciona dinámicamente las cuentas de balance (Clases 1 a 3) y resultados (Clases 4 a 7), brindando asesoría estratégica instantánea conforme a NIIF.
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-accent/30 rounded border border-border">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Landmark size={14} className="text-blue-500" /> Prueba Ácida & Solvencia
                  </div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">
                    Monitorea la capacidad de cubrir pasivos de corto plazo sin depender de liquidar inventarios.
                  </div>
                </div>

                <div className="p-2.5 bg-accent/30 rounded border border-border">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Building size={14} className="text-amber-500" /> Capital de Trabajo Neto
                  </div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">
                    Calcula fondos disponibles para operar y proyecta escenarios de flujo de caja.
                  </div>
                </div>

                <div className="p-2.5 bg-accent/30 rounded border border-border">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" /> Auditoría de Márgenes
                  </div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">
                    Detecta sobrecostos de producción o desviación de gastos operacionales frente a ingresos.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
