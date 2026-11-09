/**
 * @file layout.tsx  (raíz)
 * @description Layout raíz de Next.js para Veltrix ERP.
 *
 * Responsabilidades:
 *   - Define los metadatos globales (título, descripción).
 *   - Aplica la fuente Inter de Google Fonts.
 *   - Importa la hoja de estilos global (`globals.css`).
 *   - Envuelve el árbol de componentes con `AuthProvider`, que a su vez
 *     incluye `SessionProvider` (NextAuth) y `ThemeProvider` (modo oscuro).
 *
 * Nota sobre `suppressHydrationWarning`:
 *   El atributo `class` del elemento `<html>` puede diferir entre el servidor
 *   (que siempre renderiza sin la clase `.dark`) y el cliente (que añade
 *   la clase según la preferencia guardada en localStorage). Sin esta
 *   directiva React emite una advertencia de hidratación inofensiva pero
 *   molesta; con ella simplemente ignora la discrepancia conocida.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

/** Configuración de la fuente Inter (subconjunto latino para menor tamaño de bundle) */
const inter = Inter({ subsets: ["latin"] });

/** Metadatos de la aplicación — usados por los motores de búsqueda y el navegador */
export const metadata: Metadata = {
  title: "Veltrix ERP | Sistema Contable, Financiero & Tributario NIIF",
  description:
    "Plataforma integral empresarial de gestión contable, nómina, activos y facturación electrónica adaptada a la normativa colombiana (NIIF / DIAN).",
};

/**
 * `RootLayout`
 *
 * Layout de más alto nivel de la aplicación.
 * Todos los layouts y páginas anidadas herederan este envoltorio.
 *
 * @param children - Nodos hijos renderizados por Next.js (layouts hijos o páginas).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
     * `suppressHydrationWarning={true}` en <html>:
     * ThemeProvider escribe la clase "dark" en este elemento desde el cliente
     * usando `document.documentElement.classList`. El servidor siempre
     * renderiza sin esa clase → diferencia esperada → suprimimos la advertencia.
     */
    <html lang="es" suppressHydrationWarning>
      <head>
        {/*
         * Script anti-FOUC (Flash of Unstyled Content) para el modo oscuro.
         *
         * Se ejecuta de forma síncrona y bloqueante ANTES de que el navegador
         * pinte cualquier contenido, garantizando que la clase `.dark` esté
         * presente en <html> desde el primer frame visible.
         *
         * Prioridad de resolución:
         *   1. Preferencia guardada en localStorage ("veltrix-theme").
         *   2. Preferencia del sistema operativo (prefers-color-scheme).
         *   3. Fallback: modo claro.
         *
         * `dangerouslySetInnerHTML` es necesario porque Next.js no permite
         * scripts inline con `<script>` JSX estándar por razones de seguridad
         * (Content Security Policy). Este patrón es el recomendado por la
         * comunidad de Next.js para implementar dark mode sin parpadeo.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('veltrix-theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = stored === 'dark' || (!stored && systemDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {/* AuthProvider provee sesión (NextAuth) y tema (ThemeProvider) */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
