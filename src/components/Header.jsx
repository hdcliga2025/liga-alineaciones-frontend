// src/components/Header.jsx
import { h } from "preact";
import { Link } from "preact-router/match";

export default function Header() {
  const wrap = {
    padding: "8px 14px",
    background: "rgba(0, 64, 128, 0.06)",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    backdropFilter: "saturate(120%) blur(3px)",
    WebkitBackdropFilter: "saturate(120%) blur(3px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const link = {
    color: "white",
    textDecoration: "none",
    fontWeight: 600,
    padding: "6px 8px",
    borderRadius: "8px",
  };

  const linkActive = { ...link, background: "rgba(255,255,255,0.18)" };

  return (
    <header style={wrap}>
      <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link activeClassName="active" href="/" style={link} activeStyle={linkActive}>
          Inicio
        </Link>
        <span style={{ opacity: 0.35 }}>|</span>
        <Link activeClassName="active" href="/partidos" style={link} activeStyle={linkActive}>
          Partidos
        </Link>
        <span style={{ opacity: 0.35 }}>|</span>
        {/* Ruta coherente con App.jsx */}
        <Link activeClassName="active" href="/haz-tu-11" style={link} activeStyle={linkActive}>
          Fai o teu 11
        </Link>
        <span style={{ opacity: 0.35 }}>|</span>
        <Link activeClassName="active" href="/clasificacion" style={link} activeStyle={linkActive}>
          Clasificación
        </Link>
      </nav>
    </header>
  );
}
