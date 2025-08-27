// src/components/Header.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Link } from "preact-router/match";

export default function Header() {
  const [now, setNow] = useState("");

  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("gl-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Europe/Madrid",
      }).format(new Date());
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  const wrap = {
    position: "relative",
    padding: "8px 14px",
    background: "rgba(0, 64, 128, 0.10)", // ~90% transparente
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    backdropFilter: "saturate(120%) blur(2px)",
    WebkitBackdropFilter: "saturate(120%) blur(2px)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  };

  const left = {
    fontFamily: "'Montserrat', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    fontWeight: 600,
    fontSize: "13px",
    opacity: 0.95,
    whiteSpace: "nowrap",
  };

  const nav = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
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
      {/* Reloxo á esquerda */}
      <div style={left}>{now}</div>

      {/* Ligazóns simples (axusta rutas reais) */}
      <nav style={nav}>
        <Link activeClassName="active" href="/" style={link} activeStyle={linkActive}>
          Inicio
        </Link>
        <span style={{ opacity: 0.35 }}>|</span>
        <Link activeClassName="active" href="/partidos" style={link} activeStyle={linkActive}>
          Partidos
        </Link>
        <span style={{ opacity: 0.35 }}>|</span>
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

