// src/components/NavBar.jsx
import { h } from "preact";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

/* Flecha gruesa → ahora mismo tamaño que la X (14x14, trazo 2.4) */
function ArrowLeftBold() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M15 6l-6 6 6 6"></path>
      <path d="M9 12h10"></path>
    </svg>
  );
}
function SmallX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12"></path>
    </svg>
  );
}

export default function NavBar({ currentPath = "" }) {
  const isPublic = ["/", "/login", "/register"].includes(currentPath);
  if (isPublic) return null;

  const showMenu = currentPath !== "/dashboard"; // ocultar no dashboard

  const styles = {
    bar: {
      position: "fixed",        // barra superior fixa
      top: 0,
      left: 0,
      right: 0,
      zIndex: 120,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between", // Menú izq, Pechar der
      padding: "8px 12px",
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "saturate(180%) blur(10px)",
      WebkitBackdropFilter: "saturate(180%) blur(10px)",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
    },
    btnBase: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      fontWeight: 700,
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      color: "#fff",
      boxShadow: "0 8px 18px rgba(0,0,0,.18)",
      lineHeight: 1,
      userSelect: "none",
    },
    // Degradados
    menu:   { background: "linear-gradient(135deg, #38bdf8, #60a5fa)" }, // celeste
    logout: { background: "linear-gradient(135deg, #ef4444, #dc2626)" }, // vermello
    left:   { display: "flex", gap: 8, alignItems: "center" },
    right:  { display: "flex", gap: 8, alignItems: "center" },
  };

  const goMenu = () => route("/dashboard");
  const logout = async () => {
    await supabase.auth.signOut();
    route("/login");
  };

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        {showMenu && (
          <button style={{ ...styles.btnBase, ...styles.menu }} onClick={goMenu} aria-label="Menú">
            <ArrowLeftBold />
            Menú
          </button>
        )}
      </div>
      <div style={styles.right}>
        <button style={{ ...styles.btnBase, ...styles.logout }} onClick={logout} aria-label="Pechar">
          Pechar <SmallX />
        </button>
      </div>
    </div>
  );
}

