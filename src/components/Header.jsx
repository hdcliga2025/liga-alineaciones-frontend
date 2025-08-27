// src/components/Header.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";

const IcoBack = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);

export default function Header() {
  const [now, setNow] = useState("");
  const [blink, setBlink] = useState(false);

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
    const t1 = setInterval(() => setNow(fmt()), 1000);

    // Parpadeo: cada 5s pintamos celeste durante 600ms
    const t2 = setInterval(() => {
      setBlink(true);
      const to = setTimeout(() => setBlink(false), 600);
      return () => clearTimeout(to);
    }, 5000);

    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const bar = {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 52,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    padding: "8px 12px",
    background: "rgba(0, 64, 128, 0.10)", // ~90% transparente
    backdropFilter: "saturate(120%) blur(2px)", WebkitBackdropFilter: "saturate(120%) blur(2px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  };

  const clock = {
    fontFamily: "'Montserrat', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
    fontWeight: 800,
    fontSize: 14,            // un poco mayor
    color: blink ? "#0ea5e9" : "#0f172a",  // negro → celeste al parpadear
    whiteSpace: "nowrap",
    transition: "color .25s ease",
    opacity: 0.96,
  };

  const backBtn = {
    position: "absolute", left: 8, top: 7, width: 38, height: 38,
    display: "grid", placeItems: "center",
    borderRadius: 12, border: "1px solid #e5e7eb",
    background: "#fff", color: "#0ea5e9",
    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    cursor: "pointer",
  };

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else route("/dashboard");
  };

  return (
    <>
      <header style={bar}>
        <button style={backBtn} title="Atrás" onClick={goBack}>
          <IcoBack />
        </button>
        <div style={clock}>{now}</div>
      </header>
      <div style={{ height: 52 }} />
    </>
  );
}

