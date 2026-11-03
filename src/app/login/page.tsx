"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PieChart, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@erp.com");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        setError("Credenciales inválidas");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, var(--background) 0%, var(--secondary) 100%)"
    }}>
      <div className="glass-panel" style={{
        padding: "3rem",
        borderRadius: "1rem",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <div style={{ 
              background: "var(--primary)", 
              padding: "1rem", 
              borderRadius: "50%",
              color: "white"
            }}>
              <PieChart size={32} />
            </div>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.025em" }}>Veltrix</h1>
          <p style={{ color: "var(--secondary-foreground)", marginTop: "0.25rem", fontSize: "0.9rem" }}>ERP Contable & Financiero Cloud</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              background: "var(--destructive)", 
              color: "white", 
              padding: "0.75rem", 
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              textAlign: "center",
              fontSize: "0.875rem"
            }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ position: "relative" }}>
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--secondary-foreground)" }} />
              <input 
                type="email" 
                className="premium-input" 
                style={{ paddingLeft: "2.75rem" }}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ position: "relative", marginBottom: "2rem" }}>
            <label className="form-label">Contraseña</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--secondary-foreground)" }} />
              <input 
                type="password" 
                className="premium-input" 
                style={{ paddingLeft: "2.75rem" }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="premium-btn" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? "Iniciando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
