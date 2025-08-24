// src/components/AuthWatcher.jsx
import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

// Rutas que NO requieren sesión (públicas)
const PUBLIC_PATHS = ["/", "/login", "/register"];

// Rutas privadas (requieren sesión)
const PRIVATE_PREFIXES = ["/partidos", "/haz-tu-11", "/clasificacion", "/dashboard"];

function isPublic(pathname) {
  return PUBLIC_PATHS.includes(pathname);
}

function isPrivate(pathname) {
  return PRIVATE_PREFIXES.some((p) => pathname.startsWith(p));
}

export default function AuthWatcher() {
  useEffect(() => {
    const pathname = () => window.location.pathname;

    // Estado inicial al cargar
    supabase.auth.getSession().then(({ data }) => {
      const hasSession = !!data.session;

      if (hasSession) {
        // Si ya hay sesión y estás en páginas de auth → vete a la app
        if (pathname() === "/login" || pathname() === "/register") {
          route("/partidos", true);
        }
      } else {
        // Sin sesión: si intentas ir a una privada → vete al login
        if (isPrivate(pathname())) {
          route("/login", true);
        }
        // Si entras a "/" o "/login" o "/register", se permite (públicas)
      }
    });

    // Responder a cambios de sesión (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const hasSession = !!session;
      const path = pathname();

      if (hasSession) {
        // Tras login, si estás en auth → a la app
        if (path === "/login" || path === "/register") {
          route("/partidos", true);
        }
      } else {
        // Tras logout, si estabas en privada → al login
        if (isPrivate(path)) {
          route("/login", true);
        }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}

