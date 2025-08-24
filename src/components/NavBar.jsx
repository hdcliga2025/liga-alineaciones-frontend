// src/components/NavBar.jsx
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

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

  // No mostrar nada en páginas públicas
  if (PUBLIC_PATHS.includes(currentPath)) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    route("/login", true);
  };

  return (
    <nav
      style={{
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        borderBottom: "1px solid #eee",
      }}
    >
      {/* Marca (solo navega a la home pública) */}
      <a href="/" style={{ fontWeight: 700, textDecoration: "underline" }}>
        HDC Liga
      </a>

      {/* Menú privado */}
      {hasSession && (
        <>
          <a href="/partidos">Partidos</a>
          <a href="/haz-tu-11">Fai o teu 11</a>
          <a href="/clasificacion">Clasificación</a>

          {/* separador flexible para empuxar o botón á dereita */}
          <span style={{ flex: 1 }} />

          {/* Botón de peche de sesión */}
          <button
            onClick={handleLogout}
            style={{
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "6px 10px",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Pechar sesión
          </button>
        </>
      )}
    </nav>
  );
}
