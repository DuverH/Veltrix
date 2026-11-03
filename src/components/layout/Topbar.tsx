"use client";

import { Bell, Search, UserCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", width: "400px" }}>
        <Search size={20} color="var(--secondary-foreground)" />
        <input 
          type="text" 
          placeholder="Buscar cuentas, facturas, clientes..." 
          className="premium-input"
          style={{ padding: "0.5rem 1rem" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div style={{ position: "relative", cursor: "pointer" }}>
          <Bell size={24} color="var(--foreground)" />
          <span style={{
            position: "absolute",
            top: -5,
            right: -5,
            backgroundColor: "var(--destructive)",
            color: "white",
            fontSize: "0.7rem",
            padding: "2px 6px",
            borderRadius: "10px",
            fontWeight: "bold"
          }}>3</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <UserCircle size={32} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{session?.user?.name || "Cargando..."}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--secondary-foreground)" }}>Admin</div>
          </div>
        </div>
      </div>
    </div>
  );
}
