"use client";

/**
 * @file DashboardShell.tsx
 * @description Contenedor cliente y gestor de estado responsivo para el Dashboard de Veltrix ERP.
 *
 * Características:
 *   - Provee el contexto `SidebarContext` para abrir/cerrar el menú lateral en dispositivos móviles y táctiles.
 *   - Bloqueo de desplazamiento de fondo cuando el menú desplegable está abierto.
 *   - Cierre automático del menú al navegar entre rutas.
 *   - Compatible con todos los navegadores móviles (iOS Safari, Android Chrome, Firefox, Edge).
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// ─── Contexto de Navegación Móvil ─────────────────────────────────────────────

interface SidebarContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  openSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

// ─── Componente Contenedor ────────────────────────────────────────────────────

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar el drawer móvil automáticamente al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevenir scroll en la página de fondo cuando el drawer móvil está abierto
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const closeSidebar = () => setIsOpen(false);
  const openSidebar = () => setIsOpen(true);

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, closeSidebar, openSidebar }}>
      <div className={`app-container ${isOpen ? "sidebar-mobile-open" : ""}`}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

