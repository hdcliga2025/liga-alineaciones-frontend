// src/components/Header.jsx
import { h } from "preact";
import { Link } from "preact-router/match";

export default function Header() {
  const wrap = {
    padding: "10px 16px",
    background: "rgba(0, 64, 128, 0.28)",     // máis transparente
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    backdropFilter: "saturate(120%) blur(4px)", // lixeiro efecto, opcional
    WebkitBackdropFilter: "saturate(120%) blur(4px)",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
  };

  const link = {
    color: "white",
    textDecoration: "none",
    fontWeight: 600,
    padding: "6px 8px",
    borderRadius: "8px",
  };

  const linkActive = {
    ...link,
    background: "rgba(255,255,255,0.18)",
  };

  return (
    <header style={wrap}>
      <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link activeClassName="active" href="/" style={link} activeStyle={linkActive}>
          Inicio
        </Link>
        <span style={{ opacity: 0.4 }}>|</span>
        <Link activeClassName="active" href="/partidos" style={link} activeStyle={linkActive}>
          Partidos
        </Link>
        <span style={{ opacity: 0.4 }}>|</span>
        <Link activeClassName="active" href="/haztu11" style={link} activeStyle={linkActive}>
          Fai o teu 11
        </Link>
        <span style={{ opacity: 0.4 }}>|</span>
        <Link activeClassName="active" href="/clasificacion" style={link} activeStyle={linkActive}>
          Clasificación
        </Link>
      </nav>
    </header>
  );
}
