/**
 * @file Topbar.tsx
 * @description Barra superior interactiva de navegación, búsqueda global y utilidades de Veltrix ERP.
 *
 * Módulos integrados:
 *   1. **Búsqueda Global Inteligente (Command Palette / Ctrl+K)**:
 *      - Filtrado en tiempo real de módulos del sistema, cuentas contables y acciones rápidas.
 *      - Navegación con un clic hacia cualquier módulo.
 *   2. **Indicador de Empresa y Contexto Multi-Compañía**:
 *      - Muestra la razón social activa y moneda funcional (COP).
 *   3. **Modal de Ayuda y Guía Rápida (`?`)**:
 *      - Explica las funciones principales y atajos del sistema.
 *   4. **Panel de Notificaciones Interactivo**:
 *      - Contador dinámico, marcar leídas, eliminar y redirección.
 *   5. **Toggle de Modo Oscuro Puro (OLED) / Claro**:
 *      - Transición instantánea y persistente con ThemeProvider.
 *   6. **Perfil de Usuario**:
 *      - Nombre y rol de la sesión activa de NextAuth.
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  UserCircle,
  Sun,
  Moon,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ExternalLink,
  HelpCircle,
  Building2,
  ArrowRight,
  BookOpen,
  FileText,
  TrendingUp,
  Boxes,
  Briefcase,
  Layers,
  Sparkles,
  Shield,
  Command,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type NotificationType = "info" | "warning" | "success";

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  read: boolean;
  link?: string;
}

interface SearchItem {
  name: string;
  category: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// ─── Módulos Disponibles para Búsqueda Global ─────────────────────────────────

const searchableModules: SearchItem[] = [
  { name: "Dashboard Ejecutivo", category: "General", href: "/dashboard", description: "Resumen de ingresos, gastos, KPIs y flujo", icon: TrendingUp },
  { name: "Libro Diario & PUC", category: "Contabilidad", href: "/dashboard/accounting", description: "Asientos contables, catálogo PUC y balance comprobación", icon: BookOpen },
  { name: "IA Contable & OCR", category: "Inteligencia", href: "/dashboard/ai-assistant", description: "Clasificación asistida de facturas con Inteligencia Artificial", icon: Sparkles },
  { name: "Facturación & DSE (DIAN)", category: "Operación", href: "/dashboard/billing", description: "Emisión de facturas electrónicas, CUFE y XML UBL 2.1", icon: FileText },
  { name: "Tesorería & Flujo de Caja", category: "Operación", href: "/dashboard/treasury", description: "Antigüedad de saldos cartera (Aging) y previsión 30 días", icon: TrendingUp },
  { name: "Inventarios & Kardex", category: "Operación", href: "/dashboard/inventory", description: "Valuación promedio ponderado y bodegas 1405/1435", icon: Boxes },
  { name: "Nómina Electrónica", category: "Operación", href: "/dashboard/payroll", description: "Liquidación laboral, seguridad social, parafiscales y CUNE", icon: Briefcase },
  { name: "Conciliación Bancaria", category: "Contabilidad", href: "/dashboard/accounting/bank", description: "Cruce de extractos bancarios contra libro contable", icon: CheckCircle2 },
  { name: "Costos de Producción", category: "Contabilidad", href: "/dashboard/accounting/production", description: "Órdenes de producción, materia prima, MOD y CIF", icon: Layers },
  { name: "Cierres Contables", category: "Contabilidad", href: "/dashboard/accounting/closing", description: "Bloqueo mensual, depreciación y amortización de períodos", icon: Shield },
  { name: "Préstamos & Amortización", category: "Contabilidad", href: "/dashboard/accounting/loans", description: "Tablas de amortización sistema francés y cuotas bancarias", icon: BookOpen },
  { name: "Activos Fijos", category: "Contabilidad", href: "/dashboard/assets", description: "Control patrimonial y depreciación en línea recta", icon: Building2 },
  { name: "Estados Financieros NIIF", category: "Reportes", href: "/dashboard/reports", description: "Balance General, Estado de Resultados y Flujo de Efectivo", icon: FileText },
  { name: "Auditoría Inmutable", category: "Seguridad", href: "/dashboard/audit", description: "Registro forense de eventos con cadena de bloques SHA-256", icon: Shield },
  { name: "Configuración del Sistema", category: "Ajustes", href: "/dashboard/settings", description: "Parámetros de compañía, facturación y preferencias de tema", icon: Building2 },
];

// ─── Componente Principal ─────────────────────────────────────────────────────

export function Topbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  /* ── Estado de búsqueda rápida ──────────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  /* ── Estado del panel de notificaciones ─────────────────────────────────── */
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  /* ── Estado del modal de ayuda ──────────────────────────────────────────── */
  const [helpOpen, setHelpOpen] = useState(false);

  /* ── Notificaciones del sistema ─────────────────────────────────────────── */
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: "notif-1",
      title: "Facturación Electrónica DIAN",
      description: "2 facturas electrónicas emitidas pendientes de confirmación por la DIAN.",
      time: "Hace 15 min",
      type: "warning",
      read: false,
      link: "/dashboard/billing",
    },
    {
      id: "notif-2",
      title: "Conciliación Bancaria",
      description: "Extracto Bancolombia importado. Existen 4 movimientos para conciliar.",
      time: "Hace 1 hora",
      type: "info",
      read: false,
      link: "/dashboard/accounting/bank",
    },
    {
      id: "notif-3",
      title: "Automatización Contable",
      description: "Depreciación de activos fijos del mes calculada y asentada exitosamente.",
      time: "Hace 3 horas",
      type: "success",
      read: false,
      link: "/dashboard/accounting/closing",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ── Filtrado de búsqueda global ────────────────────────────────────────── */
  const filteredModules = searchQuery.trim()
    ? searchableModules.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  /* ── Efecto de atajo Ctrl + K y cierre al hacer clic fuera ──────────────── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Atajo Ctrl+K o Cmd+K para enfocar búsqueda
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        const input = document.getElementById("global-search-input");
        if (input) input.focus();
      }

      // Escape para cerrar cualquier popover activo
      if (e.key === "Escape") {
        setNotificationsOpen(false);
        setSearchOpen(false);
        setHelpOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ── Manejadores de acciones ────────────────────────────────────────────── */
  const handleSelectModule = (href: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (item: SystemNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.link) {
      setNotificationsOpen(false);
      router.push(item.link);
    }
  };

  return (
    <header className="topbar" role="banner">
      {/* ── 1. Búsqueda Global Inteligente con autocompletado ──────────────── */}
      <div ref={searchContainerRef} style={{ position: "relative", width: "360px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "var(--secondary)",
            borderRadius: "var(--radius-sm)",
            padding: "0.45rem 0.85rem",
            border: "1px solid var(--border)",
            transition: "all 0.15s ease",
          }}
        >
          <Search size={16} color="var(--secondary-foreground)" aria-hidden="true" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Buscar módulo, factura o cuenta (Ctrl+K)..."
            aria-label="Búsqueda global"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--foreground)",
              fontSize: "0.825rem",
              width: "100%",
            }}
          />

          {/* Atajo de teclado visual */}
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 600,
              padding: "2px 5px",
              borderRadius: "4px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--secondary-foreground)",
              whiteSpace: "nowrap",
            }}
          >
            ⌘K
          </span>
        </div>

        {/* Dropdown de resultados de búsqueda */}
        {searchOpen && searchQuery.trim() && (
          <div
            className="glass-panel"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              maxHeight: "340px",
              overflowY: "auto",
              borderRadius: "var(--radius-sm)",
              boxShadow: "0 16px 36px rgba(0, 0, 0, 0.4)",
              zIndex: 1000,
              padding: "0.5rem",
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            {filteredModules.length === 0 ? (
              <div
                style={{
                  padding: "1.25rem",
                  textAlign: "center",
                  fontSize: "0.8rem",
                  color: "var(--secondary-foreground)",
                }}
              >
                No se encontraron módulos con &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredModules.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.href}
                    onClick={() => handleSelectModule(item.href)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--secondary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div
                      style={{
                        padding: "0.4rem",
                        borderRadius: "6px",
                        background: "rgba(99, 102, 241, 0.12)",
                        color: "var(--primary)",
                      }}
                    >
                      <IconComponent size={16} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.825rem",
                          color: "var(--foreground)",
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--secondary-foreground)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.description}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: "var(--secondary)",
                        color: "var(--secondary-foreground)",
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── 2. Contexto de Empresa Activa ──────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.35rem 0.85rem",
          borderRadius: "9999px",
          background: "var(--secondary)",
          border: "1px solid var(--border)",
          fontSize: "0.75rem",
          color: "var(--foreground)",
        }}
        title="Compañía Contable Activa (Multi-empresa)"
      >
        <Building2 size={14} color="var(--primary)" />
        <span style={{ fontWeight: 600 }}>Inversiones y Servicios S.A.S.</span>
        <span style={{ color: "var(--secondary-foreground)" }}>•</span>
        <span style={{ color: "var(--secondary-foreground)" }}>COP (NIIF)</span>
      </div>

      {/* ── 3. Acciones de Utilidad (Ayuda, Tema, Notificaciones, Perfil) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Botón de Ayuda / Manual Rápido */}
        <button
          onClick={() => setHelpOpen(true)}
          className="theme-toggle-btn"
          title="Manual Rápido y Guía del Sistema"
          aria-label="Abrir manual y ayuda del sistema"
        >
          <HelpCircle size={18} />
        </button>

        {/* Toggle de Modo Oscuro Puro (Pitch Black) / Claro */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro puro (OLED)"}
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro puro"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* ── Panel de Notificaciones ──────────────────────────────────────── */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label={`Ver notificaciones (${unreadCount} pendientes)`}
            aria-expanded={notificationsOpen}
            title="Notificaciones del sistema"
            className="theme-toggle-btn"
            style={{
              position: "relative",
              borderColor: notificationsOpen ? "var(--primary)" : "var(--border)",
            }}
          >
            <Bell size={18} />

            {/* Badge con el contador dinámico */}
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  backgroundColor: "var(--destructive)",
                  color: "white",
                  fontSize: "0.62rem",
                  padding: "1px 5px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  boxShadow: "0 0 0 2px var(--card)",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Popover desplegable de notificaciones */}
          {notificationsOpen && (
            <div
              className="glass-panel"
              role="region"
              aria-label="Panel de notificaciones"
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                width: "360px",
                maxWidth: "92vw",
                borderRadius: "var(--radius)",
                boxShadow: "0 20px 45px rgba(0, 0, 0, 0.45)",
                border: "1px solid var(--border)",
                background: "var(--card)",
                zIndex: 1000,
                overflow: "hidden",
                animation: "fadeIn 0.15s ease-out",
              }}
            >
              {/* Cabecera */}
              <div
                style={{
                  padding: "0.9rem 1.15rem",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Notificaciones</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--secondary-foreground)" }}>
                    {unreadCount > 0 ? `${unreadCount} pendientes` : "Todo al día"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.4rem" }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--primary)",
                        padding: "3px 6px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                      }}
                    >
                      <CheckCheck size={13} /> Leídas
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAllNotifs}
                      title="Limpiar todas"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--secondary-foreground)",
                        padding: "3px",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista */}
              <div style={{ maxHeight: "330px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--secondary-foreground)" }}>
                    <CheckCircle2 size={32} color="var(--success)" style={{ margin: "0 auto 0.5rem" }} />
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>No hay alertas pendientes</div>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isUnread = !item.read;
                    const config = {
                      warning: { icon: AlertTriangle, color: "var(--warning)", bg: "rgba(245, 158, 11, 0.12)" },
                      success: { icon: CheckCircle2, color: "var(--success)", bg: "rgba(16, 185, 129, 0.12)" },
                      info: { icon: Info, color: "var(--primary)", bg: "rgba(99, 102, 241, 0.12)" },
                    }[item.type];
                    const IconComp = config.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        style={{
                          padding: "0.8rem 1.15rem",
                          borderBottom: "1px solid var(--border)",
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "flex-start",
                          cursor: "pointer",
                          background: isUnread ? "rgba(99, 102, 241, 0.05)" : "transparent",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--secondary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isUnread ? "rgba(99, 102, 241, 0.05)" : "transparent";
                        }}
                      >
                        <div
                          style={{
                            background: config.bg,
                            color: config.color,
                            borderRadius: "50%",
                            padding: "0.35rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          <IconComp size={15} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                            <span style={{ fontWeight: isUnread ? 700 : 600, fontSize: "0.8rem" }}>{item.title}</span>
                            <span style={{ fontSize: "0.68rem", color: "var(--secondary-foreground)" }}>{item.time}</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)", marginTop: "0.2rem" }}>
                            {item.description}
                          </div>
                          {item.link && (
                            <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "0.3rem", fontSize: "0.7rem", color: "var(--primary)", fontWeight: 600 }}>
                              <span>Abrir módulo</span>
                              <ExternalLink size={10} />
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => handleDeleteNotification(item.id, e)}
                          title="Descartar"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--secondary-foreground)", padding: "2px" }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Perfil de Usuario ────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.55rem",
            padding: "0.35rem 0.75rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--secondary)",
          }}
        >
          <UserCircle size={26} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.82rem", lineHeight: 1.1 }}>
              {session?.user?.name ?? "Administrador"}
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--secondary-foreground)" }}>
              {(session?.user as any)?.role ?? "ADMIN"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Modal Interactivo de Ayuda y Guía de Menús ─────────────────── */}
      {helpOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: "680px",
              maxWidth: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "1.75rem",
              borderRadius: "var(--radius)",
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <HelpCircle size={22} color="var(--primary)" />
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Guía de Uso Rápido — Veltrix ERP</h2>
              </div>
              <button
                onClick={() => setHelpOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--secondary-foreground)" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.825rem", color: "var(--secondary-foreground)", marginBottom: "1.25rem" }}>
              Veltrix está organizado en 4 bloques operativos adaptados a NIIF y la reglamentación colombiana DIAN:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ padding: "0.75rem", borderRadius: "6px", background: "var(--secondary)" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)", marginBottom: "0.25rem" }}>
                  1. Panel Principal & Asistente IA
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--foreground)" }}>
                  Dashboard con métricas de caja, ingresos y gastos. Módulo de IA para analizar y pre-contabilizar facturas con OCR automático.
                </div>
              </div>

              <div style={{ padding: "0.75rem", borderRadius: "6px", background: "var(--secondary)" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)", marginBottom: "0.25rem" }}>
                  2. Contabilidad & NIIF
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--foreground)" }}>
                  Plan Único de Cuentas (PUC 6 dígitos), libro diario con partida doble obligatoria, conciliación de extractos bancarios, depreciación de activos fijos y cierre de períodos fiscales.
                </div>
              </div>

              <div style={{ padding: "0.75rem", borderRadius: "6px", background: "var(--secondary)" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)", marginBottom: "0.25rem" }}>
                  3. Operación & Comercial
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--foreground)" }}>
                  Facturación Electrónica DIAN (UBL 2.1 con CUFE y QR), Tesorería y Flujo a 30 días con cobranza, inventarios por Promedio Ponderado y liquidación de Nómina Electrónica con CUNE.
                </div>
              </div>

              <div style={{ padding: "0.75rem", borderRadius: "6px", background: "var(--secondary)" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)", marginBottom: "0.25rem" }}>
                  4. Reportes & Auditoría
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--foreground)" }}>
                  Balance General y Estado de Resultados exportables a PDF/Impresión, respaldados por una bitácora forense de auditoría inmutable basada en bloques SHA-256.
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.25rem", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(99, 102, 241, 0.2)", background: "rgba(99, 102, 241, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>
                ¿Buscas el manual técnico y de modificación completo?
              </span>
              <button
                onClick={() => {
                  setHelpOpen(false);
                  router.push("/dashboard/settings");
                }}
                className="premium-btn"
                style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
              >
                Abrir Ajustes <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
