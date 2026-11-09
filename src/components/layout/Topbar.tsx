/**
 * @file Topbar.tsx
 * @description Barra superior de navegación y utilidades de Veltrix ERP.
 *
 * Módulos integrados:
 *   1. **Búsqueda Global**: Entrada de texto para búsqueda rápida en el sistema.
 *   2. **Toggle de Modo Oscuro / Claro**: Alternador visual persistente mediante ThemeProvider.
 *   3. **Panel Interactivo de Notificaciones**:
 *      - Botón de campana con contador dinámico de elementos no leídos.
 *      - Menú flotante (dropdown) accesible al hacer clic.
 *      - Cierre automático al hacer clic fuera o presionar la tecla Escape.
 *      - Acciones para marcar como leídas, eliminar individualmente y navegar al módulo respectivo.
 *   4. **Perfil de Usuario**: Muestra información del usuario autenticado vía NextAuth.
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
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Clasificación de severidad de la notificación */
export type NotificationType = "info" | "warning" | "success";

/** Representación individual de un evento o alerta del sistema */
export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  read: boolean;
  link?: string;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

/**
 * `Topbar`
 *
 * Barra superior fija en el layout del dashboard.
 */
export function Topbar() {
  /* ── Hooks de contexto y navegación ─────────────────────────────────────── */
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  /* ── Estado del panel de notificaciones ─────────────────────────────────── */

  /** Controla si el dropdown de notificaciones está visible */
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  /** Referencia del contenedor del panel para detectar clics externos */
  const popoverRef = useRef<HTMLDivElement>(null);

  /** Lista inicial de notificaciones operativas del sistema contable */
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

  /** Total de notificaciones sin leer */
  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ── Efecto para cerrar al hacer clic fuera o presionar Escape ─────────── */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);

  /* ── Acciones de notificaciones ─────────────────────────────────────────── */

  /** Alterna la apertura o cierre del panel */
  const handleToggleNotifications = () => {
    setNotificationsOpen((prev) => !prev);
  };

  /** Marca todas las notificaciones como leídas */
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  /** Elimina una notificación específica por su ID */
  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  /** Elimina todas las notificaciones */
  const handleClearAll = () => {
    setNotifications([]);
  };

  /** Abre la notificación, la marca como leída y navega a su módulo si aplica */
  const handleNotificationClick = (item: SystemNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (item.link) {
      setNotificationsOpen(false);
      router.push(item.link);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="topbar">
      {/* ── 1. Barra de búsqueda global ─────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          width: "380px",
          background: "var(--secondary)",
          borderRadius: "var(--radius)",
          padding: "0.5rem 1rem",
          border: "1px solid var(--border)",
          transition: "border-color 0.2s ease",
        }}
      >
        <Search size={18} color="var(--secondary-foreground)" aria-hidden="true" />
        <input
          type="text"
          placeholder="Buscar cuentas, facturas, clientes..."
          aria-label="Búsqueda global"
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--foreground)",
            fontSize: "0.875rem",
            width: "100%",
          }}
        />
      </div>

      {/* ── 2. Acciones del usuario (Tema, Notificaciones, Perfil) ──────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Toggle de tema Claro / Oscuro */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* ── 3. Botón y Dropdown de Notificaciones ─────────────────────────── */}
        <div ref={popoverRef} style={{ position: "relative" }}>
          {/* Botón Campana */}
          <button
            onClick={handleToggleNotifications}
            aria-label={`Ver notificaciones (${unreadCount} no leídas)`}
            aria-expanded={notificationsOpen}
            title="Notificaciones"
            style={{
              position: "relative",
              background: notificationsOpen ? "var(--secondary)" : "none",
              border: "1px solid",
              borderColor: notificationsOpen ? "var(--border)" : "transparent",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            <Bell size={20} color="var(--foreground)" />

            {/* Badge con el conteo de no leídas */}
            {unreadCount > 0 && (
              <span
                aria-label={`${unreadCount} notificaciones sin leer`}
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  backgroundColor: "var(--destructive)",
                  color: "white",
                  fontSize: "0.65rem",
                  padding: "1px 5px",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  lineHeight: 1.4,
                  boxShadow: "0 0 0 2px var(--card)",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Menú flotante / Popover de Notificaciones */}
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
                maxWidth: "90vw",
                borderRadius: "var(--radius)",
                boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.3)",
                border: "1px solid var(--border)",
                background: "var(--card)",
                zIndex: 1000,
                overflow: "hidden",
                animation: "fadeIn 0.15s ease-out",
              }}
            >
              {/* Cabecera del panel */}
              <div
                style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                    Notificaciones
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>
                    {unreadCount > 0
                      ? `${unreadCount} ${unreadCount === 1 ? "pendiente" : "pendientes"}`
                      : "Todas al día"}
                  </div>
                </div>

                {/* Acciones de cabecera */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      title="Marcar todas como leídas"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--primary)",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      <CheckCheck size={14} /> Leídas
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      title="Limpiar todas"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--secondary-foreground)",
                        padding: "4px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de Notificaciones */}
              <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "2.5rem 1rem",
                      textAlign: "center",
                      color: "var(--secondary-foreground)",
                    }}
                  >
                    <CheckCircle2
                      size={36}
                      color="var(--success)"
                      style={{ margin: "0 auto 0.5rem", opacity: 0.8 }}
                    />
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      No tienes notificaciones
                    </div>
                    <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      El sistema se encuentra al día.
                    </div>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isUnread = !item.read;

                    // Icono y color semántico por tipo
                    const iconConfig = {
                      warning: {
                        icon: AlertTriangle,
                        color: "#f59e0b",
                        bg: "rgba(245, 158, 11, 0.12)",
                      },
                      success: {
                        icon: CheckCircle2,
                        color: "#10b981",
                        bg: "rgba(16, 185, 129, 0.12)",
                      },
                      info: {
                        icon: Info,
                        color: "var(--primary)",
                        bg: "rgba(79, 70, 229, 0.12)",
                      },
                    }[item.type];

                    const IconComponent = iconConfig.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        style={{
                          padding: "0.85rem 1.25rem",
                          borderBottom: "1px solid var(--border)",
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "flex-start",
                          cursor: "pointer",
                          background: isUnread
                            ? "rgba(79, 70, 229, 0.05)"
                            : "transparent",
                          transition: "background 0.15s ease",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--secondary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isUnread
                            ? "rgba(79, 70, 229, 0.05)"
                            : "transparent";
                        }}
                      >
                        {/* Icono de estado */}
                        <div
                          style={{
                            background: iconConfig.bg,
                            color: iconConfig.color,
                            borderRadius: "50%",
                            padding: "0.4rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          <IconComponent size={16} />
                        </div>

                        {/* Contenido textual */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: isUnread ? 700 : 600,
                                fontSize: "0.825rem",
                                color: "var(--foreground)",
                              }}
                            >
                              {item.title}
                            </span>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--secondary-foreground)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.time}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: "0.775rem",
                              color: "var(--secondary-foreground)",
                              marginTop: "0.2rem",
                              lineHeight: 1.35,
                            }}
                          >
                            {item.description}
                          </div>

                          {item.link && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                marginTop: "0.35rem",
                                fontSize: "0.72rem",
                                color: "var(--primary)",
                                fontWeight: 600,
                              }}
                            >
                              <span>Ir al módulo</span>
                              <ExternalLink size={10} />
                            </div>
                          )}
                        </div>

                        {/* Botón de descarte individual */}
                        <button
                          onClick={(e) => handleDeleteNotification(item.id, e)}
                          title="Eliminar notificación"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--secondary-foreground)",
                            padding: "2px",
                            opacity: 0.6,
                            flexShrink: 0,
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pie del panel con acceso rápido a módulos */}
              <div
                style={{
                  padding: "0.75rem 1.25rem",
                  borderTop: "1px solid var(--border)",
                  textAlign: "center",
                  background: "var(--card)",
                }}
              >
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    router.push("/dashboard/audit");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--primary)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                  }}
                >
                  Ver registro de auditoría completo &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Perfil del Usuario ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.4rem 0.75rem",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--secondary)",
            transition: "background-color 0.2s ease",
          }}
        >
          <UserCircle size={28} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.2 }}>
              {session?.user?.name ?? "Administrador"}
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--secondary-foreground)",
                lineHeight: 1.2,
              }}
            >
              {(session?.user as any)?.role ?? "ADMIN"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
