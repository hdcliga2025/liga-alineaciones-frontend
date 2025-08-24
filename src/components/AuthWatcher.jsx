// src/components/AuthWatcher.jsx
import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

const PUBLIC_PATHS = ["/", "/login", "/register"];
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
        if (p === "/login" || p === "/register") {
          route("/dashboard", true);
        }
      } else {
        if (isPrivate(p)) {
          route("/login", true);
        }
      }
    });

    // Cambios de sesión
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const p = window.location.pathname;
      const hasSession = !!session;

      if (hasSession) {
        if (p === "/login" || p === "/register") {
          route("/dashboard", true);
        }
      } else {
        route("/", true); // logout → landing
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}

