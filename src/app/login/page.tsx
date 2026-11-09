/**
 * @file login/page.tsx
 * @description Página de inicio de sesión de Veltrix ERP.
 *
 * Flujo:
 *   1. El usuario introduce su correo (o usuario "admin") y contraseña.
 *   2. Se llama a `signIn("credentials", { redirect: false })` de NextAuth.
 *   3. Si la autenticación es exitosa, se redirige a `/dashboard`.
 *   4. Si falla, se muestra un mensaje de error con sugerencias claras.
 *
 * Usabilidad:
 *   - Botón para mostrar/ocultar contraseña (evita errores de tipografía).
 *   - Botón de auto-completado rápido para credenciales de prueba.
 *   - Compatible con tema claro y oscuro de Veltrix.
 */

"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PieChart, Lock, Mail, Eye, EyeOff, Check, ShieldCheck } from "lucide-react";

/**
 * `LoginPage`
 *
 * Renderiza el formulario de autenticación centrado verticalmente en pantalla.
 * Página pública excluida de la protección del middleware.
 */
export default function LoginPage() {
  const router = useRouter();

  /* ── Estado del formulario ──────────────────────────────────────────────── */

  /** Usuario / Correo predeterminado */
  const [email, setEmail] = useState("admin@erp.com");

  /** Contraseña predeterminada */
  const [password, setPassword] = useState("Admin2026!*");

  /** Control de visibilidad de la contraseña en texto plano */
  const [showPassword, setShowPassword] = useState(false);

  /** Mensaje de error visible al usuario tras un intento fallido */
  const [error, setError] = useState("");

  /** Indicador de petición de autenticación en curso */
  const [loading, setLoading] = useState(false);

  /** Indicador visual temporal cuando se autocompletan las credenciales */
  const [autoFilled, setAutoFilled] = useState(false);

  /* ── Manejadores de eventos ─────────────────────────────────────────────── */

  /**
   * `handleSubmit`
   *
   * Procesa el envío del formulario mediante NextAuth.
   *
   * @param e - Evento del formulario HTML
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Usuario o contraseña incorrectos. Puedes usar admin@erp.com con Admin2026!* o admin.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Error de conexión al servidor de autenticación. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * `fillCredentials`
   *
   * Autocompleta los campos de usuario y contraseña con las credenciales maestras.
   *
   * @param demoUser - Correo o nombre de usuario
   * @param demoPass - Contraseña preestablecida
   */
  const fillCredentials = (demoUser: string, demoPass: string) => {
    setEmail(demoUser);
    setPassword(demoPass);
    setError("");
    setAutoFilled(true);
    setTimeout(() => setAutoFilled(false), 2000);
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, var(--background) 0%, var(--secondary) 100%)",
        transition: "background 0.3s ease",
        padding: "1rem",
      }}
    >
      <div
        className="glass-panel"
        style={{
          padding: "2.5rem",
          borderRadius: "1.25rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* ── 1. Encabezado de la aplicación ────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}
          >
            <div
              style={{
                background: "var(--primary)",
                padding: "0.85rem",
                borderRadius: "50%",
                color: "white",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)",
              }}
            >
              <PieChart size={30} aria-hidden="true" />
            </div>
          </div>

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

          <p
            style={{
              color: "var(--secondary-foreground)",
              marginTop: "0.25rem",
              fontSize: "0.875rem",
            }}
          >
            ERP Contable &amp; Financiero Cloud
          </p>
        </div>

        {/* ── 2. Formulario de acceso ───────────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          {/* Mensaje de alerta de error */}
          {error && (
            <div
              role="alert"
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                color: "var(--destructive)",
                border: "1px solid var(--destructive)",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
                fontSize: "0.825rem",
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          {/* Campo: Correo / Usuario */}
          <div className="form-group" style={{ position: "relative" }}>
            <label htmlFor="login-email" className="form-label">
              Correo Electrónico o Usuario
            </label>
            <div style={{ position: "relative" }}>
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
                type="text"
                className="premium-input"
                style={{ paddingLeft: "2.75rem" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@erp.com o admin"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Campo: Contraseña con toggle Ver/Ocultar */}
          <div
            className="form-group"
            style={{ position: "relative", marginBottom: "1.75rem" }}
          >
            <label htmlFor="login-password" className="form-label">
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
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
                type={showPassword ? "text" : "password"}
                className="premium-input"
                style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              {/* Botón para alternar visibilidad de contraseña */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--secondary-foreground)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.25rem",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Botón principal de inicio de sesión */}
          <button
            type="submit"
            className="premium-btn"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Autenticando..." : "Iniciar Sesión"}
          </button>

          {/* ── 3. Tarjeta de credenciales rápidas de prueba ───────────────── */}
          <div
            style={{
              marginTop: "1.25rem",
              padding: "0.85rem",
              borderRadius: "0.6rem",
              background: "rgba(79, 70, 229, 0.06)",
              border: "1px solid rgba(79, 70, 229, 0.2)",
              fontSize: "0.8rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.4rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontWeight: 600,
                  color: "var(--foreground)",
                }}
              >
                <ShieldCheck size={16} color="var(--primary)" />
                <span>Credenciales válidas:</span>
              </div>
              <button
                type="button"
                onClick={() => fillCredentials("admin@erp.com", "Admin2026!*")}
                style={{
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "2px 8px",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {autoFilled ? <Check size={12} /> : null}
                {autoFilled ? "Cargado" : "Cargar"}
              </button>
            </div>

            <div style={{ color: "var(--secondary-foreground)", fontSize: "0.75rem", lineHeight: 1.5 }}>
              <div><strong>Usuario:</strong> <code>admin@erp.com</code> (o simplemente <code>admin</code>)</div>
              <div><strong>Clave:</strong> <code>Admin2026!*</code> o <code>admin</code></div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
