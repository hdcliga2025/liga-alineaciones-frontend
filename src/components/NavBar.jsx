// src/components/NavBar.jsx
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

// En rutas públicas seguimos ocultando la barra
const PUBLIC_PATHS = ["/", "/login", "/register"];

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    route("/", true); // tras pechar sesión → landing
  };

  return (
    <nav
      style={{
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid #eef2ff",
        boxShadow: "0 2px 6px rgba(0,0,0,.04)",
        background: "#fff",
      }}
    >
      {/* empuxamos o botón á dereita */}
      <span style={{ flex: 1 }} />
      {hasSession && (
        <button
          onClick={handleLogout}
          style={{
            border: "1px solid #1f2937",
            borderRadius: "8px",
            padding: "8px 12px",
            background: "transparent",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Pechar sesión
        </button>
      )}
    </nav>
  );
}
