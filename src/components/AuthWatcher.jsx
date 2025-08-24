// src/components/AuthWatcher.jsx
import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

export default function AuthWatcher() {
  useEffect(() => {
    // Ao cargar: se hai sesión e estás en login/register → vai a /partidos
    supabase.auth.getSession().then(({ data }) => {
      const path = window.location.pathname;
      const inAuth = path.startsWith("/login") || path.startsWith("/register");
      if (data.session && inAuth) route("/partidos", true);
    });

    // Cando cambia a sesión (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      const path = window.location.pathname;
      const inAuth = path.startsWith("/login") || path.startsWith("/register");
      if (session && inAuth) route("/partidos", true);
      if (!session && !inAuth) route("/login", true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}

