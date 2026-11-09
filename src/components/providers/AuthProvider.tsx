/**
 * @file AuthProvider.tsx
 * @description Proveedor raíz del cliente para Veltrix ERP.
 *
 * Combina dos proveedores de contexto necesarios para toda la aplicación:
 *   - `SessionProvider` (NextAuth): gestión de la sesión de usuario.
 *   - `ThemeProvider` (Veltrix): gestión del tema claro/oscuro.
 *
 * Al anidarlos aquí evitamos repetir la configuración en cada layout y
 * garantizamos que el orden de inicialización sea correcto:
 * la sesión se establece antes que el tema para que componentes que
 * necesiten ambos contextos puedan acceder a los dos desde el primer render.
 */

"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./ThemeProvider";

/**
 * `AuthProvider`
 *
 * Envuelve la aplicación con los proveedores globales de cliente.
 * Se declara en el layout raíz (`src/app/layout.tsx`) y no debe
 * instanciarse más de una vez en el árbol de componentes.
 *
 * @param children - Nodos hijos que tendrán acceso a la sesión y al tema.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    /* SessionProvider gestiona tokens JWT y refresco automático de sesión */
    <SessionProvider>
      {/* ThemeProvider controla claro/oscuro y persiste la preferencia */}
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
