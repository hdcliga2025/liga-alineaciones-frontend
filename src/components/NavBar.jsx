// src/components/NavBar.jsx
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

const PUBLIC_PATHS = ["/", "/login", "/register"];

/* Iconas SVG (trazo groso) */
const IconArrowLeft = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M15 6l-6 6 6 6" />
    <path d="M21 12H9" />
  </svg>
);

const IconX = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

export default function NavBar({ currentPath = "/" }) {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) =>
      setHasSession(!!session)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (PUBLIC_PATHS.includes(currentPath) || !hasSession) return null;

  const handleMenu = (e) => {
    e?.preventDefault?.();
    route("/dashboard", true);
  };

  const handleLogout = async (e) => {
    e?.preventDefault?.();
    await supabase.auth.signOut();
    route("/", true);
  };

  // Botóns estilo landing con degradado e borde redondeado moderado
  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "18px",
    border: "1px solid rgba(15,23,42,.18)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
    boxShadow: "0 6px 14px rgba(0,0,0,.12)",
    cursor: "pointer",
    userSelect: "none",
    outline: "none",
    transition: "transform .12s ease, box-shadow .12s ease, filter .12s ease",
  };

  const btnBlue = {
    ...btnBase,
    background: "linear-gradient(135deg, #60a5fa, #2563eb)", // azul degradado
  };

  const btnRed = {
    ...btnBase,
    background: "linear-gradient(135deg, #f87171, #ef4444)", // vermello degradado
  };

  const navStyle = {
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom: "1px solid #eef2ff",
    boxShadow: "0 2px 6px rgba(0,0,0,.04)",
    background: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 20,
  };

  const leftWrap = { display: "flex", alignItems: "center", gap: "8px" };
  const rightWrap = { marginLeft: "auto", display: "flex", gap: "8px" };

  const onHoverIn = (e) => {
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,.18)";
    e.currentTarget.style.filter = "saturate(1.05)";
  };
  const onHoverOut = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,.12)";
    e.currentTarget.style.filter = "none";
  };

  return (
    <nav style={navStyle}>
      {/* Esquerda: MENÚ */}
      <div style={leftWrap}>
        <button
          type="button"
          onClick={handleMenu}
          onMouseEnter={onHoverIn}
          onMouseLeave={onHoverOut}
          onFocus={onHoverIn}
          onBlur={onHoverOut}
          style={btnBlue}
          aria-label="Ir ao menú principal"
        >
          <IconArrowLeft size={18} />
          <span>{"Men\u00FA"}</span>
        </button>
      </div>

      {/* Dereita: PECHAR SESI\u00D3N (X á dereita) */}
      <div style={rightWrap}>
        <button
          type="button"
          onClick={handleLogout}
          onMouseEnter={onHoverIn}
          onMouseLeave={onHoverOut}
          onFocus={onHoverIn}
          onBlur={onHoverOut}
          style={btnRed}
          aria-label="Pechar sesi\u00F3n"
        >
          <span>{"Pechar sesi\u00F3n"}</span>
          <IconX size={18} />
        </button>
      </div>
    </nav>
  );
}
