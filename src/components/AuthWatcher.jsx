// src/components/AuthWatcher.jsx
import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

// Rutas públicas
const PUBLIC_PATHS = ["/", "/login", "/register"];
// Prefijos privados
const PRIVATE_PREFIXES = ["/dashboard", "/partidos", "/haz-tu-11", "/clasificacion"];

function isPrivate(pathname) {
  return PRIVATE_PREFIXES.some((p) => pathname.startsWith(p));
}

export default function AuthWatcher() {
  useEffect(() => {
    const path = () => window.location.pathname;

    // Estado inicial ao cargar
    supabase.auth.getSession().then(({ data }) => {
      const hasSession = !!data.session;
      const p = path();

      if (hasSession) {
        // Se hai sesión e estás en auth → leva ao panel
        if (p === "/login" || p === "/register") {
          route("/dashboard", true);
        }
      } else {
        // Sen sesión: se tentas ir a privada → manda a login
        if (isPrivate(p)) {
          route("/login", true);
        }
        // En "/", "/login" e "/register" déixase estar
      }
    });

    // Responder a cambios de sesión (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const p = window.location.pathname;
      const hasSession = !!session;

      if (hasSession) {
        if (p === "/login" || p === "/register") {
          route("/dashboard", true);
        }
      } else {
        // Tras logout → landing
        route("/", true);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}

