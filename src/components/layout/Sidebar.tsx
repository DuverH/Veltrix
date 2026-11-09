/**
 * @file Sidebar.tsx
 * @description Barra lateral de navegación principal categorizada de Veltrix ERP.
 *
 * Características:
 *   - Integra el logotipo vectorial oficial de Veltrix.
 *   - Agrupación semántica intuitiva en 4 secciones funcionales:
 *     1. **PANEL PRINCIPAL** (Resumen ejecutivo e IA)
 *     2. **CONTABILIDAD & NIIF** (Operaciones de libro diario, bancos, activos y cierres)
 *     3. **OPERACIÓN & COMERCIAL** (Facturación DIAN, tesorería, nómina e inventarios)
 *     4. **REPORTES & CONTROL** (Estados financieros y auditoría SHA-256)
 *   - Resaltado de la ruta activa con micro-interacciones suaves.
 *   - Pie con accesos directos a configuración, cierre de sesión y badge de estado.
 */

"use client";

import React from "react";
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
  HelpCircle,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { VeltrixLogo } from "@/components/ui/VeltrixLogo";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * `Sidebar`
 *
 * Barra de navegación izquierda con agrupación jerárquica intuitiva.
 */
export function Sidebar() {
  const pathname = usePathname();

  // ── Estructura jerárquica del menú ─────────────────────────────────────────
  const navigationSections: NavSection[] = [
    {
      title: "Panel Principal",
      items: [
        { name: "Dashboard Ejecutivo", href: "/dashboard", icon: LayoutDashboard },
        { name: "IA Contable & OCR", href: "/dashboard/ai-assistant", icon: Sparkles, badge: "AI" },
      ],
    },
    {
      title: "Contabilidad & NIIF",
      items: [
        { name: "Libro Diario & PUC", href: "/dashboard/accounting", icon: BookOpen },
        { name: "Conciliación Bancos", href: "/dashboard/accounting/bank", icon: RefreshCcw },
        { name: "Cierres Contables", href: "/dashboard/accounting/closing", icon: Lock },
        { name: "Préstamos & Amortización", href: "/dashboard/accounting/loans", icon: Landmark },
        { name: "Activos Fijos", href: "/dashboard/assets", icon: Building },
        { name: "Costos de Producción", href: "/dashboard/accounting/production", icon: Layers },
      ],
    },
    {
      title: "Operación & Comercial",
      items: [
        { name: "Facturación & DSE (DIAN)", href: "/dashboard/billing", icon: FileText },
        { name: "Tesorería & Flujo Caja", href: "/dashboard/treasury", icon: TrendingUp },
        { name: "Inventarios & Kardex", href: "/dashboard/inventory", icon: Boxes },
        { name: "Nómina Electrónica", href: "/dashboard/payroll", icon: Briefcase },
        { name: "Terceros (Clientes/Prov)", href: "/dashboard/contacts", icon: Users },
      ],
    },
    {
      title: "Informes & Control",
      items: [
        { name: "Estados Financieros NIIF", href: "/dashboard/reports", icon: PieChart },
        { name: "Auditoría Inmutable", href: "/dashboard/audit", icon: Shield },
      ],
    },
  ];

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      {/* ── 1. Logotipo oficial de la marca Veltrix ─────────────────────────── */}
      <div className="sidebar-logo">
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <VeltrixLogo size="md" showBadge={true} badgeText="ERP" />
        </Link>
      </div>

      {/* ── 2. Lista de navegación categorizada con scroll ─────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
        {navigationSections.map((section, idx) => (
          <div key={section.title} style={{ marginBottom: "0.85rem" }}>
            <div className="nav-section-title">{section.title}</div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={17} />
                  <span style={{ flex: 1 }}>{item.name}</span>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        fontWeight: 700,
                        background: isActive
                          ? "rgba(255, 255, 255, 0.25)"
                          : "rgba(99, 102, 241, 0.15)",
                        color: isActive ? "#ffffff" : "var(--primary)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── 3. Acciones de sesión y utilidades (Footer) ────────────────────── */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "0.85rem",
          borderTop: "1px solid var(--border)",
        }}
      >
        <Link
          href="/dashboard/settings"
          className={`nav-item ${pathname === "/dashboard/settings" ? "active" : ""}`}
          aria-current={pathname === "/dashboard/settings" ? "page" : undefined}
        >
          <Settings size={17} />
          <span>Configuración</span>
        </Link>

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
            color: "var(--destructive)",
          }}
        >
          <LogOut size={17} />
          <span>Cerrar Sesión</span>
        </button>

        {/* Indicador de versión y estado del sistema */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.4rem 0.75rem 0 0.75rem",
            fontSize: "0.7rem",
            color: "var(--secondary-foreground)",
          }}
        >
          <span>Veltrix v0.1.0</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--success)",
              }}
            />
            En línea
          </span>
        </div>
      </div>
    </aside>
  );
}
