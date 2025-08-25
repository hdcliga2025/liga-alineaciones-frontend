import { h } from "preact";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

export default function NavBar({ currentPath = "" }) {
  // Non amosar en páxinas públicas
  const isPublic = ["/", "/login", "/register"].includes(currentPath);
  if (isPublic) return null;

  const showMenu = currentPath !== "/dashboard"; // ocultar en dashboard

  const btn = {
    base: {
      padding: "8px 14px",
      fontWeight: 700,
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      color: "#fff",
      boxShadow: "0 4px 14px rgba(0,0,0,.12)",
    },
    menu: {
      background: "linear-gradient(135deg, #60a5fa, #ef4444)",
      marginRight: 8,
    },
    logout: {
      background: "linear-gradient(135deg, #ef4444, #60a5fa)",
    },
    bar: {
      position: "sticky",
      top: 0,
      zIndex: 40,
      background: "transparent",
      display: "flex",
      justifyContent: "flex-end",
      padding: "8px 12px",
    },
  };

  const goMenu = () => route("/dashboard");
  const logout = async () => {
    await supabase.auth.signOut();
    route("/login");
  };

  return (
    <div style={btn.bar}>
      {showMenu && (
        <button style={{ ...btn.base, ...btn.menu }} onClick={goMenu} aria-label="Menú">
          ← Menú
        </button>
      )}
      <button style={{ ...btn.base, ...btn.logout }} onClick={logout} aria-label="Pechar sesión">
        Pechar sesión ✕
      </button>
    </div>
  );
}
