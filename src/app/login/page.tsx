/**
 * @file login/page.tsx
 * @description Página de inicio de sesión de Veltrix ERP.
 *
 * Flujo:
 *   1. El usuario introduce su correo y contraseña.
 *   2. Se llama a `signIn("credentials", { redirect: false })` de NextAuth.
 *   3. Si la autenticación es exitosa, se redirige a `/dashboard`.
 *   4. Si falla, se muestra un mensaje de error en pantalla.
 *
 * Estilo:
 *   - El fondo y el panel de formulario respetan los tokens CSS del tema activo
 *     (claro u oscuro), de modo que el cambio de tema es automático sin
 *     necesidad de lógica adicional en este componente.
 *   - Se usa la clase `.glass-panel` que tiene variantes para ambos temas
 *     definidas en `globals.css`.
 */

"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PieChart, Lock, Mail } from "lucide-react";

/**
 * `LoginPage`
 *
 * Renderiza el formulario de autenticación centrado verticalmente en pantalla.
 * Es una página pública — el middleware excluye `/login` de la protección.
 */
export default function LoginPage() {
  const router = useRouter();

  /* ── Estado del formulario ──────────────────────────────────────────────── */

  /**
   * Valores iniciales precargados para facilitar el acceso en modo demo.
   * En un entorno de producción real estos campos estarían vacíos.
   */
  const [email, setEmail] = useState("admin@erp.com");
  const [password, setPassword] = useState("Admin2026!*");

  /** Mensaje de error visible al usuario tras un intento fallido */
  const [error, setError] = useState("");

  /** Indica si hay una petición de autenticación en curso */
  const [loading, setLoading] = useState(false);

  /* ── Manejador de envío ─────────────────────────────────────────────────── */

  /**
   * `handleSubmit`
   *
   * Previene el comportamiento por defecto del formulario, llama a NextAuth
   * con las credenciales ingresadas y gestiona la respuesta.
   *
   * @param e - Evento de envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Limpia errores previos

    try {
      const res = await signIn("credentials", {
        redirect: false, // Manejamos la redirección manualmente
        email,
        password,
      });

      if (res?.error) {
        // Error de autenticación (credenciales incorrectas, usuario inactivo, etc.)
        setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      } else {
        // Autenticación exitosa → redirigir al dashboard principal
        router.push("/dashboard");
        router.refresh(); // Fuerza la actualización del layout del servidor
      }
    } catch {
      // Error inesperado de red o servidor
      setError("Error al conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    /*
     * Contenedor de pantalla completa con gradiente de fondo.
     * Los colores del gradiente usan tokens CSS y cambian automáticamente
     * con el tema activo.
     */
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, var(--background) 0%, var(--secondary) 100%)",
        transition: "background 0.3s ease",
      }}
    >
      {/*
       * Panel de formulario con efecto glass-morphism.
       * `.glass-panel` tiene variantes para claro y oscuro en globals.css.
       */}
      <div
        className="glass-panel"
        style={{
          padding: "3rem",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* ── Encabezado con logo y nombre ────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>

          {/* Logo circular con color primario */}
          <div
            style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}
          >
            <div
              style={{
                background: "var(--primary)",
                padding: "1rem",
                borderRadius: "50%",
                color: "white",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
              }}
            >
              <PieChart size={32} aria-hidden="true" />
            </div>
          </div>

          {/* Nombre de la aplicación */}
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "var(--foreground)",
            }}
          >
            Veltrix
          </h1>

          {/* Subtítulo descriptivo */}
          <p
            style={{
              color: "var(--secondary-foreground)",
              marginTop: "0.3rem",
              fontSize: "0.9rem",
            }}
          >
            ERP Contable &amp; Financiero Cloud
          </p>
        </div>

        {/* ── Formulario de autenticación ──────────────────────────────────── */}
        <form onSubmit={handleSubmit}>

          {/* Alerta de error — solo visible si `error` tiene contenido */}
          {error && (
            <div
              role="alert"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "var(--destructive)",
                border: "1px solid var(--destructive)",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
                textAlign: "center",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          {/* ── Campo de correo electrónico ──────────────────────────────── */}
          <div className="form-group" style={{ position: "relative" }}>
            <label htmlFor="login-email" className="form-label">
              Correo Electrónico
            </label>
            <div style={{ position: "relative" }}>
              {/* Ícono decorativo dentro del input */}
              <Mail
                size={18}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--secondary-foreground)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="login-email"
                type="email"
                className="premium-input"
                style={{ paddingLeft: "2.75rem" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* ── Campo de contraseña ──────────────────────────────────────── */}
          <div
            className="form-group"
            style={{ position: "relative", marginBottom: "2rem" }}
          >
            <label htmlFor="login-password" className="form-label">
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              {/* Ícono decorativo dentro del input */}
              <Lock
                size={18}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--secondary-foreground)",
                  pointerEvents: "none",
                }}
              />
              <input
                id="login-password"
                type="password"
                className="premium-input"
                style={{ paddingLeft: "2.75rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* ── Botón de envío ───────────────────────────────────────────── */}
          <button
            type="submit"
            className="premium-btn"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading}
            aria-busy={loading}
          >
            {/* Texto cambia durante la carga para dar retroalimentación visual */}
            {loading ? "Autenticando..." : "Iniciar Sesión"}
          </button>

          {/* ── Panel informativo de credenciales demo ───────────────────── */}
          <div
            style={{
              marginTop: "1.5rem",
              padding: "0.85rem",
              borderRadius: "0.6rem",
              background: "rgba(79, 70, 229, 0.06)",
              border: "1px solid rgba(79, 70, 229, 0.18)",
              fontSize: "0.8rem",
              textAlign: "center",
              color: "var(--secondary-foreground)",
            }}
          >
            <p
              style={{
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: "0.3rem",
              }}
            >
              Credenciales de acceso:
            </p>
            <p style={{ fontFamily: "monospace", letterSpacing: "0.02em" }}>
              admin@erp.com &bull; Admin2026!*
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
