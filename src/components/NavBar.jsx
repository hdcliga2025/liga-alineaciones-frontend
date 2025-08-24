// src/components/NavBar.jsx
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

export default function NavBar() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // estado inicial
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
    // escuchar cambios (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setHasSession(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    // Si ya no hay sesión, no hagas nada
    const { data } = await supabase.auth.getSession();
    if (!data?.session) {
      route("/login", true);
      return;
    }
    await supabase.auth.signOut();
    route("/login", true); // navega limpio al login
  };

  return (
    <nav class="navbar" style={{ padding: "0.5rem" }}>
      {/* aquí iría tu logo / enlaces */}
      {/* 👇 Mostrar "Saír" SOLO si hay sesión */}
      {hasSession && (
        <button onClick={handleLogout} class="px-3 py-1 rounded border">
          Saír
        </button>
      )}
    </nav>
  );
}
