// src/components/Header.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

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

  const bar = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 52,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    background: "rgba(0, 64, 128, 0.10)", // ~90% transparente
    backdropFilter: "saturate(120%) blur(2px)",
    WebkitBackdropFilter: "saturate(120%) blur(2px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  };

  const clock = {
    fontFamily:
      "'Montserrat', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
    fontWeight: 700,
    fontSize: 13,
    color: "#0f172a", // negro/azul muy oscuro para contraste
    whiteSpace: "nowrap",
    opacity: 0.95,
  };

  return (
    <>
      <header style={bar}>
        <div style={clock}>{now}</div>
        {/* No links aquí: el header sólo muestra el reloj. 
            Los botones (campá, perfil, pechar) se colocan con NavBar, fijados arriba a la derecha. */}
      </header>
      {/* Espaciador para que o contido non quede cuberto polo header fixo */}
      <div style={{ height: 52 }} />
    </>
  );
}

