// src/components/NavBar.jsx
import { h } from "preact";
import { route } from "preact-router";

export default function NavBar() {
  const go = (url) => route(url, true);

  const wrap = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "10px 14px",
    backdropFilter: "saturate(180%) blur(8px)",
    background: "rgba(241, 245, 249, 0.90)", // slate-100, 90% transparente
  };

  const btn = {
    display: "grid",
    placeItems: "center",
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 2px 14px rgba(0,0,0,.08)",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    userSelect: "none",
  };

  const icon = { fontSize: "18px", lineHeight: 1 };

  return (
    <header style={wrap}>
      <button style={btn} title="Notificacións" onClick={() => go("/notificacions")}>
        <span style={icon}>🔔</span>
      </button>
      <button style={btn} title="Perfil" onClick={() => go("/perfil")}>
        <span style={icon}>👤</span>
      </button>
      <button
        style={{ ...btn, borderColor: "#fecaca", background: "#fff" }}
        title="Pechar sesión"
        onClick={() => go("/logout")}
        aria-label="Pechar sesión"
      >
        <span style={{ ...icon, color: "#ef4444" }}>✖</span>
      </button>
    </header>
  );
}
