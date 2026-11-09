/**
 * @file VeltrixLogo.tsx
 * @description Componente de marca oficial para Veltrix ERP.
 *
 * Características del diseño:
 *   - Monograma vectorial geométrico "V" con facetas isométricas y gradientes
 *     de alta energía (Indigo eléctrico `#6366f1`, Violeta `#8b5cf6` y Cyan `#06b6d4`).
 *   - Representa velocidad contable, precisión matricial y crecimiento financiero.
 *   - Tipografía empresarial con kerning optimizado y micro-badge de especificación ERP.
 *   - Adaptable en tamaños: "sm" (barra/topbar), "md" (sidebar), "lg" (login/portada), "xl" (hero).
 */

"use client";

import React from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface VeltrixLogoProps {
  /** Tamaño del logotipo */
  size?: "sm" | "md" | "lg" | "xl";
  /** Si debe mostrar la tipografía "VELTRIX" */
  showText?: boolean;
  /** Si debe mostrar el badge de producto "ERP" */
  showBadge?: boolean;
  /** Clase CSS adicional opcional */
  className?: string;
  /** Texto personalizado para el badge (por defecto "ERP") */
  badgeText?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * `VeltrixLogo`
 *
 * Renderiza el isotipo vectorial o el imagotipo completo de Veltrix.
 */
export function VeltrixLogo({
  size = "md",
  showText = true,
  showBadge = true,
  className = "",
  badgeText = "ERP",
}: VeltrixLogoProps) {
  // Configuración de dimensiones según el tamaño solicitado
  const config = {
    sm: {
      iconSize: 24,
      fontSize: "1.1rem",
      badgeSize: "0.6rem",
      gap: "0.5rem",
    },
    md: {
      iconSize: 32,
      fontSize: "1.35rem",
      badgeSize: "0.65rem",
      gap: "0.65rem",
    },
    lg: {
      iconSize: 44,
      fontSize: "1.85rem",
      badgeSize: "0.75rem",
      gap: "0.85rem",
    },
    xl: {
      iconSize: 64,
      fontSize: "2.5rem",
      badgeSize: "0.85rem",
      gap: "1.15rem",
    },
  }[size];

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: config.gap,
        verticalAlign: "middle",
      }}
    >
      {/* ── Isotipo vectorial geométrico ──────────────────────────────────── */}
      <svg
        width={config.iconSize}
        height={config.iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-label="Veltrix Brand Icon"
      >
        <defs>
          {/* Gradiente del ala izquierda: Violeta a Indigo */}
          <linearGradient id="veltrix-grad-left" x1="4" y1="6" x2="24" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>

          {/* Gradiente del ala derecha: Cyan a Azul eléctrico */}
          <linearGradient id="veltrix-grad-right" x1="44" y1="6" x2="24" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>

          {/* Gradiente del núcleo central (foco financiero ascendente) */}
          <linearGradient id="veltrix-grad-core" x1="24" y1="12" x2="24" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.3" />
          </linearGradient>

          {/* Sombra de profundidad isométrica */}
          <filter id="veltrix-shadow" x="0" y="2" width="48" height="46" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#4f46e5" floodOpacity="0.35" />
          </filter>
        </defs>

        <g filter="url(#veltrix-shadow)">
          {/* Ala izquierda del vector V */}
          <path
            d="M6 8L19 38C19.8 39.8 22.2 40.5 23.8 39.5L25 38.6L14 8C13.4 6.7 11.9 6 10.5 6.3L6.8 7.1C6.2 7.2 5.8 7.5 6 8Z"
            fill="url(#veltrix-grad-left)"
          />

          {/* Ala derecha simétrica con ángulo de proyección */}
          <path
            d="M42 8L29 38C28.2 39.8 25.8 40.5 24.2 39.5L23 38.6L34 8C34.6 6.7 36.1 6 37.5 6.3L41.2 7.1C41.8 7.2 42.2 7.5 42 8Z"
            fill="url(#veltrix-grad-right)"
          />

          {/* Vértice central flotante (prisma contable en balance) */}
          <path
            d="M24 16L29 26H19L24 16Z"
            fill="url(#veltrix-grad-core)"
          />

          {/* Diamante micro-acento superior */}
          <circle cx="24" cy="9" r="2.25" fill="#38bdf8" />
        </g>
      </svg>

      {/* ── Tipografía de marca & Badge ───────────────────────────────────── */}
      {showText && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span
            style={{
              fontSize: config.fontSize,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "var(--foreground)",
              lineHeight: 1,
              fontFamily: "var(--font-sans)",
            }}
          >
            Veltrix
          </span>

          {showBadge && (
            <span
              style={{
                fontSize: config.badgeSize,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(99, 102, 241, 0.15)",
                color: "var(--primary)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                lineHeight: 1,
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
