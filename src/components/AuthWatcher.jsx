// src/components/AuthWatcher.jsx
import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

// Rutas públicas
const PUBLIC_PATHS = ["/", "/login", "/register"];
// Prefixs privados
const PRIVATE_PREFIXES = ["/partidos", "/haz-tu-11", "/clasificacion", "/dashboard"];

function isPrivate(pathname) {
  return PRIVATE_PREFIXES.some((p) => pathname.startsWith(p));
}

export default function AuthWatcher() {
  useEffect(() => {
    const pathname = () => window.location.pathname;

    // Estado inicial
    supabase.auth.getSession().then(({ data }) => {
      const hasSession = !!data.session;
      const path = pathname();

      if (hasSession) {
        // Se hai sesión e estás en auth → vai á app
        if (path === "/login" || path === "/register") {
          route("/partidos", true);
        }
      } else {
        // Sen sesión: se vas a privada → a /login (primeira protección)
        if (isPrivate(path)) {
          route("/login", true);
        }
        // En "/", "/login" e "/register" déixase estar
      }
    });

    // Cambios de sesión
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const path = window.location.pathname;
      const hasSession = !!session;

      if (hasSession) {
        // Tras login, se estás en auth → vai á app
        if (path === "/login" || path === "/register") {
          route("/partidos", true);
        }
      } else {
        // Tras logout → ir sempre á landing
        route("/", true);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}

