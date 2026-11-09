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
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

/**
 * `DashboardLayout`
 *
 * Layout padre de todas las páginas dentro de `/dashboard`.
 * Verifica autenticación en el servidor y monta la estructura
 * visual (sidebar + topbar + área de contenido).
 *
 * @param children - Página activa renderizada por Next.js App Router.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* ── Verificación de sesión en servidor ─────────────────────────────────── */

  /**
   * `getServerSession` lee el cookie de sesión del request entrante.
   * Si no existe, `session` es `null` y se redirige al login.
   * No expone el token al cliente, lo que es más seguro que verificarlo
   * sólo desde el middleware.
   */
  const session = await getServerSession();

  if (!session) {
    /*
     * `redirect` lanza un error interno de Next.js que detiene el render
     * y retorna un 307 Temporary Redirect al cliente.
     */
    redirect("/login");
  }

  /* ── Render del layout ──────────────────────────────────────────────────── */

  return (
    /*
     * `.app-container` establece el layout flex horizontal de pantalla completa:
     *   flex-direction: row → Sidebar | contenido
     *   height: 100vh       → ocupa toda la altura de la ventana
     *   overflow: hidden    → el scroll lo gestiona `.page-content`
     */
    <div className="app-container">

      {/* Barra lateral de navegación (ancho fijo, flex-shrink: 0 implícito) */}
      <Sidebar />

      {/* Área principal: topbar + contenido desplazable */}
      <div className="main-content">

        {/* Barra superior con búsqueda, toggle de tema y perfil de usuario */}
        <Topbar />

        {/*
         * Área de contenido desplazable.
         * Los componentes hijos (páginas) aplican su propio padding interno
         * y no deben sobrescribir el `overflow-y: auto` de esta clase.
         */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
