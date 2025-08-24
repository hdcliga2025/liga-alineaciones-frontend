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

  // No mostrar NADA en páginas públicas
  if (PUBLIC_PATHS.includes(currentPath)) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    route("/login", true);
  };

  return (
    <nav style={{ padding: "8px", display: "flex", gap: "12px", alignItems: "center" }}>
      <a href="/" style={{ fontWeight: 700 }}>HDC Liga</a>

      {hasSession && (
        <>
          <a href="/partidos">Partidos</a>
          <a href="/haz-tu-11">Fai o teu 11</a>
          <a href="/clasificacion">Clasificación</a>
          <button onClick={handleLogout} style={{ marginLeft: "auto" }}>
            Saír
          </button>
        </>
      )}
    </nav>
  );
}
