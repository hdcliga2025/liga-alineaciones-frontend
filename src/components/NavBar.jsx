// src/components/NavBar.jsx
import { h } from "preact";
import { route } from "preact-router";

export default function NavBar({ currentPath = "" }) {
  const isPublic = currentPath === "/" || currentPath === "/login" || currentPath === "/register";
  if (isPublic) return null;

  const wrap = {
    position: "sticky", top: 0, zIndex: 40,
    background: "rgba(255,255,255,.75)", backdropFilter: "blur(8px)",
    borderBottom: "1px solid #eef2ff",
  };
  const bar = {
    maxWidth: 1080, margin: "0 auto", padding: "10px 12px",
    display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
  };
  const round = {
    width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,.12)", cursor: "pointer", border: "1px solid #e5e7eb",
  };
  const whiteBtn = { ...round, background: "#fff", color: "#0f172a" };
  const exitBtn = {
    ...round,
    background: "linear-gradient(135deg,#fecaca,#f87171)", // vermello degradado
    color: "#0f172a", border: "1px solid #ef4444",
  };
  const ico = { fontSize: 18, fontWeight: 800, lineHeight: 1 };

  return (
    <div style={wrap}>
      <div style={bar}>
        {/* Notificacións */}
        <button style={whiteBtn} aria-label="Notificacións" onClick={() => route("/notificacions")}>
          <span style={ico}>🔔</span>
        </button>
        {/* Perfil */}
        <button style={whiteBtn} aria-label="Perfil" onClick={() => route("/perfil")}>
          <span style={ico}>👤</span>
        </button>
        {/* Saír á landing (non pecha sesión, só vai a "/") */}
        <button style={exitBtn} aria-label="Saír ao inicio" title="Saír ao inicio" onClick={() => route("/")}>
          <span style={{ ...ico, fontSize: 20, fontWeight: 900, color: "#111" }}>✖</span>
        </button>
      </div>
    </div>
  );
}
