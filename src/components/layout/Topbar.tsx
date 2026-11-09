/**
 * @file Topbar.tsx
 * @description Barra superior de la aplicación Veltrix ERP.
 *
 * Renderiza tres secciones horizontales:
 *   1. **Búsqueda global** — input de texto para buscar cuentas, facturas, etc.
 *   2. **Acciones rápidas** — toggle de modo oscuro y botón de notificaciones.
 *   3. **Perfil del usuario** — avatar con nombre y rol de la sesión activa.
 *
 * El toggle de tema usa el contexto `ThemeProvider` a través del hook `useTheme`,
 * por lo que no necesita props adicionales y funciona de forma autónoma.
 */

"use client";

import { Bell, Search, UserCircle, Sun, Moon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/ThemeProvider";

/**
 * `Topbar`
 *
 * Componente de cliente (requiere acceso a sesión y al hook de tema).
 * Se instancia en `src/app/dashboard/layout.tsx`.
 */
export function Topbar() {
  /* ── Hooks ──────────────────────────────────────────────────────────────── */

  /** Datos de la sesión del usuario autenticado */
  const { data: session } = useSession();

  /** Tema actual y función para alternarlo */
  const { theme, toggleTheme } = useTheme();

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="topbar">

      {/* ── 1. Barra de búsqueda global ───────────────────────────────────── */}
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
        {/* Icono de lupa */}
        <Search size={18} color="var(--secondary-foreground)" />

        {/* Input sin estilos propios — hereda el fondo del contenedor */}
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

      {/* ── 2. Acciones rápidas ───────────────────────────────────────────── */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "1rem" }}
      >

        {/* ── 2a. Toggle de modo oscuro / claro ──────────────────────────── */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          /*
           * Atributo `title` y `aria-label` para accesibilidad:
           * indica al usuario cuál es el tema destino al presionar el botón.
           */
          title={
            theme === "dark"
              ? "Cambiar a modo claro"
              : "Cambiar a modo oscuro"
          }
          aria-label={
            theme === "dark"
              ? "Cambiar a modo claro"
              : "Cambiar a modo oscuro"
          }
        >
          {/*
           * Se muestra el ícono opuesto al tema actual:
           *  - Modo oscuro activo  → muestra Sol  (para activar el claro)
           *  - Modo claro activo   → muestra Luna (para activar el oscuro)
           */}
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* ── 2b. Botón de notificaciones ────────────────────────────────── */}
        <button
          aria-label="Ver notificaciones"
          title="Notificaciones"
          style={{
            position: "relative",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "0.25rem",
          }}
        >
          <Bell size={22} color="var(--foreground)" />

          {/* Badge con el conteo de notificaciones no leídas */}
          <span
            aria-label="3 notificaciones sin leer"
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              backgroundColor: "var(--destructive)",
              color: "white",
              fontSize: "0.65rem",
              padding: "1px 5px",
              borderRadius: "10px",
              fontWeight: "bold",
              lineHeight: 1.4,
            }}
          >
            3
          </span>
        </button>

        {/* ── 3. Perfil del usuario ──────────────────────────────────────── */}
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
          {/* Avatar genérico del usuario */}
          <UserCircle size={28} color="var(--primary)" />

          <div>
            {/* Nombre del usuario: llega de la sesión de NextAuth */}
            <div style={{ fontWeight: 600, fontSize: "0.85rem", lineHeight: 1.2 }}>
              {session?.user?.name ?? "Cargando..."}
            </div>

            {/* Rol estático — en una versión futura puede llegar de session.user.role */}
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--secondary-foreground)",
                lineHeight: 1.2,
              }}
            >
              Administrador
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
