// src/components/NavBar.jsx
import { h } from "preact";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

export default function NavBar({ currentPath = "" }) {
  const isPublic = ["/", "/login", "/register"].includes(currentPath);
  if (isPublic) return null;

  const showMenu = currentPath !== "/dashboard"; // ocultar no dashboard

  const styles = {
    bar: {
      position: "sticky",
      top: 0,
      zIndex: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",   // menú á esquerda, pechar á dereita
      padding: "8px 12px",
      background: "transparent",
    },
    btnBase: {
      padding: "8px 14px",
      fontWeight: 700,
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      color: "#fff",
      boxShadow: "0 4px 14px rgba(0,0,0,.12)",
    },
    /* degradado celeste para Menú */
    menu: { background: "linear-gradient(135deg, #38bdf8, #60a5fa)" },
    /* degradado vermello para Pechar */
    logout: { background: "linear-gradient(135deg, #ef4444, #dc2626)" },
    left: { display: "flex", gap: 8, alignItems: "center" },
    right: { display: "flex", gap: 8, alignItems: "center" },
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
            ← Menú
          </button>
        )}
      </div>
      <div style={styles.right}>
        <button style={{ ...styles.btnBase, ...styles.logout }} onClick={logout} aria-label="Pechar">
          Pechar
        </button>
      </div>
    </div>
  );
}

