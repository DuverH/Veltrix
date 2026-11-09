/**
 * @file Sidebar.tsx
 * @description Barra lateral de navegación de Veltrix ERP.
 *
 * Renderiza:
 *   - Logo / nombre de la aplicación en la parte superior.
 *   - Lista de elementos de navegación principal (módulos del ERP).
 *   - Acciones de sesión en la parte inferior: Configuración y Cerrar sesión.
 *
 * La clase `active` se determina comparando `pathname` (ruta actual) con
 * el `href` de cada elemento, de modo que el resaltado siempre refleja
 * la página en la que se encuentra el usuario.
 *
 * El Sidebar hereda el tema activo a través de los tokens CSS definidos
 * en `globals.css`; no necesita importar `useTheme` directamente.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  RefreshCcw,
  Layers,
  Lock,
  Landmark,
  Shield,
  FileText,
  Users,
  Building,
  PieChart,
  Settings,
  Briefcase,
  Boxes,
  Sparkles,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Definición de un elemento de navegación en el sidebar */
interface NavItem {
  /** Texto mostrado al usuario */
  name: string;
  /** Ruta interna de Next.js */
  href: string;
  /** Componente de ícono de lucide-react */
  icon: React.ComponentType<{ size?: number }>;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * `Sidebar`
 *
 * Barra lateral persistente en todas las páginas del dashboard.
 * Se instancia en `src/app/dashboard/layout.tsx`.
 */
export function Sidebar() {
  /** Ruta actual del navegador — usada para resaltar el ítem activo */
  const pathname = usePathname();

  // ── Lista de módulos principales ─────────────────────────────────────────

  /**
   * Elementos de navegación principales ordenados por flujo contable:
   * Dashboard → Contabilidad → Módulos operativos → Reportes → Configuración.
   */
  const coreNavItems: NavItem[] = [
    { name: "Dashboard",                   href: "/dashboard",                       icon: LayoutDashboard },
    { name: "Libro Diario & PUC",          href: "/dashboard/accounting",            icon: BookOpen       },
    { name: "IA Contable & OCR",           href: "/dashboard/ai-assistant",          icon: Sparkles       },
    { name: "Nómina Electrónica",          href: "/dashboard/payroll",               icon: Briefcase      },
    { name: "Inventarios & Kardex",        href: "/dashboard/inventory",             icon: Boxes          },
    { name: "Tesorería & Flujo Caja",      href: "/dashboard/treasury",              icon: TrendingUp     },
    { name: "Conciliación Bancos",         href: "/dashboard/accounting/bank",       icon: RefreshCcw     },
    { name: "Costos de Producción",        href: "/dashboard/accounting/production", icon: Layers         },
    { name: "Cierres Contables",           href: "/dashboard/accounting/closing",    icon: Lock           },
    { name: "Préstamos & Amortización",    href: "/dashboard/accounting/loans",      icon: Landmark       },
    { name: "Estados Financieros",         href: "/dashboard/reports",               icon: PieChart       },
    { name: "Facturación & DSE",           href: "/dashboard/billing",               icon: FileText       },
    { name: "Terceros (Clientes/Prov)",    href: "/dashboard/contacts",              icon: Users          },
    { name: "Activos Fijos",              href: "/dashboard/assets",                icon: Building       },
    { name: "Auditoría Inmutable",         href: "/dashboard/audit",                 icon: Shield         },
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    /*
     * El sidebar usa `overflowY: "auto"` para permitir desplazamiento vertical
     * cuando el contenido excede la altura disponible (pantallas pequeñas).
     */
    <div className="sidebar" style={{ overflowY: "auto" }}>

      {/* ── Logo y nombre de la aplicación ──────────────────────────────── */}
      <div className="sidebar-logo">
        {/* Ícono de marca */}
        <PieChart size={28} />
        {/* Nombre de la aplicación con fuente en negrita y kerning ajustado */}
        <span style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
          Veltrix
        </span>
      </div>

      {/* ── Navegación principal ─────────────────────────────────────────── */}
      <div style={{ flex: 1 }}>
        {coreNavItems.map((item) => {
          const Icon = item.icon;

          /*
           * Comparación exacta de rutas para resaltar el ítem activo.
           * Se usa `===` y no `startsWith` para evitar que rutas padre
           * aparezcan activas cuando se navega a un hijo.
           */
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
              /* Accesibilidad: indica la página actual al lector de pantalla */
              aria-current={isActive ? "page" : undefined}
            >
              {/* Ícono del módulo */}
              <Icon size={18} aria-hidden="true" />

              {/* Nombre del módulo */}
              <span style={{ fontSize: "0.85rem" }}>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Acciones de sesión (parte inferior) ─────────────────────────── */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "1rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        {/* Enlace a la página de Configuración */}
        <Link
          href="/dashboard/settings"
          className={`nav-item ${
            pathname === "/dashboard/settings" ? "active" : ""
          }`}
          aria-current={pathname === "/dashboard/settings" ? "page" : undefined}
        >
          <Settings size={18} aria-hidden="true" />
          <span style={{ fontSize: "0.85rem" }}>Configuración</span>
        </Link>

        {/* Botón de cierre de sesión — llama a NextAuth signOut */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item"
          aria-label="Cerrar sesión"
          style={{
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <LogOut size={18} aria-hidden="true" />
          <span style={{ fontSize: "0.85rem" }}>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
