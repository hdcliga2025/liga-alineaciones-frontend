// src/components/NavBar.jsx
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

const PUBLIC_PATHS = ["/", "/login", "/register"];

/** Iconos SVG inline (trazo un pouco máis groso) */
const IconArrowLeft = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M15 6l-6 6 6 6" />
    <path d="M21 12H9" />
  </svg>
);

const IconX = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
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

  if (PUBLIC_PATHS.includes(currentPath)) return null;

  const handleBack = (e) => {
    e?.preventDefault?.();
    route("/dashboard", true);
  };

  const handleLogout = async (e) => {
    e?.preventDefault?.();
    await supabase.auth.signOut();
    route("/", true);
  };

  // Botóns estilo “landing”
  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "18px",
    border: "1px solid rgba(15,23,42,.2)",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: "0 6px 14px rgba(0,0,0,.12)",
    cursor: "pointer",
    userSelect: "none",
    outline: "none",
    transition: "transform .12s ease, box-shadow .12s ease, filter .12s ease",
  };

  const btnPrimary = {
    ...btnBase,
    background: "linear-gradient(135deg, rgba(29,78,216,1), rgba(37,99,235,1))",
  };

  const btnDanger = {
    ...btnBase,
    background: "linear-gradient(135deg, rgba(239,68,68,1), rgba(185,28,28,1))",
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

  if (!hasSession) return null;

  return (
    <nav style={navStyle}>
      {/* Esquerda: VOLVER */}
      <div style={leftWrap}>
        <button
          type="button"
          onClick={handleBack}
          onMouseEnter={onHoverIn}
          onMouseLeave={onHoverOut}
          onFocus={onHoverIn}
          onBlur={onHoverOut}
          style={btnPrimary}
          aria-label="Volver ao panel"
        >
          <IconArrowLeft size={18} />
          <span>Volver</span>
        </button>
      </div>

      {/* Dereita: SAÍR */}
      <div style={rightWrap}>
        <button
          type="button"
          onClick={handleLogout}
          onMouseEnter={onHoverIn}
          onMouseLeave={onHoverOut}
          onFocus={onHoverIn}
          onBlur={onHoverOut}
          style={btnDanger}
          aria-label="Saír (pechar sesión)"
        >
          <IconX size={18} />
          <span>Saír</span>
        </button>
      </div>
    </nav>
  );
}
