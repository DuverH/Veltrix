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

export function Sidebar() {
  const pathname = usePathname();

  const coreNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Libro Diario & PUC", href: "/dashboard/accounting", icon: BookOpen },
    { name: "IA Contable & OCR", href: "/dashboard/ai-assistant", icon: Sparkles },
    { name: "Nómina Electrónica", href: "/dashboard/payroll", icon: Briefcase },
    { name: "Inventarios & Kardex", href: "/dashboard/inventory", icon: Boxes },
    { name: "Tesorería & Flujo Caja", href: "/dashboard/treasury", icon: TrendingUp },
    { name: "Conciliación Bancos", href: "/dashboard/accounting/bank", icon: RefreshCcw },
    { name: "Costos de Producción", href: "/dashboard/accounting/production", icon: Layers },
    { name: "Cierres Contables", href: "/dashboard/accounting/closing", icon: Lock },
    { name: "Préstamos & Amortización", href: "/dashboard/accounting/loans", icon: Landmark },
    { name: "Estados Financieros", href: "/dashboard/reports", icon: PieChart },
    { name: "Facturación & DSE", href: "/dashboard/billing", icon: FileText },
    { name: "Terceros (Clientes/Prov)", href: "/dashboard/contacts", icon: Users },
    { name: "Activos Fijos", href: "/dashboard/assets", icon: Building },
    { name: "Auditoría Inmutable", href: "/dashboard/audit", icon: Shield },
  ];

  return (
    <div className="sidebar" style={{ overflowY: "auto" }}>
      <div className="sidebar-logo">
        <PieChart size={28} />
        <span style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Veltrix</span>
      </div>

      <div style={{ flex: 1 }}>
        {coreNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span style={{ fontSize: "0.85rem" }}>{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
        <Link href="/dashboard/settings" className={`nav-item ${pathname === "/dashboard/settings" ? "active" : ""}`}>
          <Settings size={18} />
          <span style={{ fontSize: "0.85rem" }}>Configuración</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
        >
          <LogOut size={18} />
          <span style={{ fontSize: "0.85rem" }}>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
