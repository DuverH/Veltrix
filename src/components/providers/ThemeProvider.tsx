/**
 * @file ThemeProvider.tsx
 * @description Proveedor global del tema de la aplicación (claro / oscuro).
 *
 * Estrategia de persistencia:
 *   1. Se lee la preferencia almacenada en `localStorage` (clave "veltrix-theme").
 *   2. Si no existe preferencia guardada se detecta la preferencia del sistema
 *      mediante `prefers-color-scheme: dark`.
 *   3. El tema activo se aplica añadiendo/quitando la clase CSS `"dark"` en
 *      el elemento `<html>` para que todas las variables CSS respondan.
 *   4. Cualquier componente hijo puede consumir el contexto `ThemeContext`
 *      con el hook `useTheme` para leer el tema actual y alternarlo.
 */

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Valores posibles del tema */
type Theme = "light" | "dark";

/** Forma del contexto expuesto a los consumidores */
interface ThemeContextValue {
  /** Tema actualmente activo */
  theme: Theme;
  /** Alterna entre claro y oscuro */
  toggleTheme: () => void;
  /** Fija un tema específico */
  setTheme: (theme: Theme) => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

/**
 * Contexto de React para el tema.
 * Inicialmente `undefined`; los consumidores deben usar el hook `useTheme`
 * que valida que exista el proveedor padre.
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ─── Proveedor ────────────────────────────────────────────────────────────────

/**
 * `ThemeProvider`
 *
 * Envuelve la aplicación o un sub-árbol para proveer acceso al tema.
 * Debe estar en un `"use client"` y ubicarse cerca de la raíz del árbol
 * (p. ej., dentro de `AuthProvider` en `layout.tsx`).
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  /**
   * Estado interno del tema.
   * Arranca como "light" para evitar un mismatch entre el servidor (SSR)
   * y el cliente; el efecto de inicialización lo corrige inmediatamente.
   */
  const [theme, setThemeState] = useState<Theme>("light");

  // ── Inicialización ──────────────────────────────────────────────────────────

  useEffect(() => {
    /**
     * Lee la preferencia persistida o detecta la del sistema operativo.
     * Este efecto corre sólo en el cliente, donde `localStorage` y
     * `window.matchMedia` están disponibles.
     */
    const stored = localStorage.getItem("veltrix-theme") as Theme | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    // Prioridad: preferencia guardada → preferencia del sistema
    const resolved: Theme = stored ?? (systemDark ? "dark" : "light");
    applyTheme(resolved);
    setThemeState(resolved);
  }, []);

  // ── Aplicar clase al DOM ────────────────────────────────────────────────────

  /**
   * Añade o elimina la clase `"dark"` en `<html>` y persiste la elección
   * en `localStorage`.
   *
   * @param newTheme - El tema que se desea activar.
   */
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("veltrix-theme", newTheme);
  };

  // ── API pública ──────────────────────────────────────────────────────────────

  /**
   * Fija el tema y lo persiste.
   * Estable entre renders gracias a `useCallback`.
   */
  const setTheme = useCallback((newTheme: Theme) => {
    applyTheme(newTheme);
    setThemeState(newTheme);
  }, []);

  /**
   * Alterna entre los temas claro y oscuro.
   * Lee el estado del tema directamente del elemento <html>
   * para evitar depender del estado React (que puede estar desactualizado
   * si el toggle se llama de forma muy rápida).
   */
  const toggleTheme = useCallback(() => {
    const currentlyDark = document.documentElement.classList.contains("dark");
    setTheme(currentlyDark ? "light" : "dark");
  }, [setTheme]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook consumidor ──────────────────────────────────────────────────────────

/**
 * `useTheme`
 *
 * Hook de conveniencia para consumir el contexto del tema.
 * Lanza un error descriptivo si se usa fuera de `ThemeProvider`.
 *
 * @returns `{ theme, toggleTheme, setTheme }`
 *
 * @example
 * ```tsx
 * const { theme, toggleTheme } = useTheme();
 * ```
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme debe usarse dentro de <ThemeProvider>.");
  }
  return ctx;
}
