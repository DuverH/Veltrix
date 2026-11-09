/**
 * @file dashboard/layout.tsx
 * @description Layout protegido del área de dashboard de Veltrix ERP.
 *
 * Este es un Server Component (no lleva "use client") porque utiliza
 * `getServerSession` de NextAuth para verificar la sesión en el servidor
 * antes de renderizar cualquier contenido.
 *
 * Estructura de la UI:
 * ┌────────────────────────────────────────────────┐
 * │  Sidebar (280px fijo)  │  Topbar (70px alto)   │
 * │                        ├───────────────────────┤
 * │                        │  <children> (scroll)  │
 * └────────────────────────┴───────────────────────┘
 *
 * Protección de ruta:
 *   Si no existe una sesión activa se redirige inmediatamente a `/login`.
 *   Esto actúa como segunda capa de seguridad junto con el middleware.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

/**
 * `DashboardLayout`
 *
 * Layout padre de todas las páginas dentro de `/dashboard`.
 * Verifica autenticación en el servidor y monta la estructura
 * visual responsiva (sidebar móvil + topbar + área de contenido).
 *
 * @param children - Página activa renderizada por Next.js App Router.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ── Verificación de sesión en servidor ─────────────────────────────────── */
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  /* ── Render del layout responsivo con DashboardShell ────────────────────── */
  return (
    <DashboardShell>
      {/* Barra lateral de navegación (modo escritorio o cajón móvil deslizante) */}
      <Sidebar />

      {/* Área principal: topbar responsiva + contenido desplazable */}
      <div className="main-content">
        {/* Barra superior con botón hamburguesa móvil, búsqueda, tema y perfil */}
        <Topbar />

        {/* Área de contenido desplazable */}
        <main className="page-content">{children}</main>
      </div>
    </DashboardShell>
  );
}
