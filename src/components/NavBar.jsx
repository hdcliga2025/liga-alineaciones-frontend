// src/components/NavBar.jsx
import { h } from "preact";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

/* Iconas SVG (ASCII-safe) */
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 1112 0c0 7 3 7 3 7H3s3 0 3-7"></path>
      <path d="M10 21h4"></path>
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M6 20a6 6 0 0112 0"></path>
    </svg>
  );
}

export default function NavBar({ currentPath = "" }) {
  const isPublic = ["/", "/login", "/register"].includes(currentPath);
  if (isPublic) return null;

  const styles = {
    bar: {
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 120,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end", // todo alineado á dereita
      gap: "10px",
      padding: "8px 12px",
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "saturate(180%) blur(10px)",
      WebkitBackdropFilter: "saturate(180%) blur(10px)",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
    },
    // Botón redondo blanco (campá)
    roundWhite: {
      width: 40, height: 40,
      borderRadius: "50%",
      display: "grid", placeItems: "center",
      background: "#fff",
      color: "#0f172a",
      border: "1px solid #e5e7eb",
      boxShadow: "0 6px 14px rgba(0,0,0,.12)",
      cursor: "pointer",
    },
    // Botón redondo negro (perfil)
    roundBlack: {
      width: 40, height: 40,
      borderRadius: "50%",
      display: "grid", placeItems: "center",
      background: "#0f172a",
      color: "#fff",
      border: "1px solid #0f172a",
      boxShadow: "0 6px 14px rgba(0,0,0,.22)",
      cursor: "pointer",
    },
  };

  const goNotis = () => route("/notificacions");
  const goPerfil = () => route("/perfil");

  // Se queres pechar sesión dende Perfil máis adiante, úsase supabase.auth.signOut()

  return (
    <div style={styles.bar}>
      <button style={styles.roundWhite} onClick={goNotis} aria-label="Notificacións" title="Notificacións">
        <BellIcon />
      </button>
      <button style={styles.roundBlack} onClick={goPerfil} aria-label="Perfil" title="Perfil">
        <UserIcon />
      </button>
    </div>
  );
}
