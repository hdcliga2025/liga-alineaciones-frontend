// src/components/AuthWatcher.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

export default function AuthWatcher() {
  useEffect(() => {
    let active = true;

    const ensureProfile = async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return;

      // Metadata esperada do rexistro
      const first_name = user.user_metadata?.first_name || user.user_metadata?.full_name || "";
      const last_name  = user.user_metadata?.last_name  || "";
      const phone      = user.user_metadata?.phone      || "";
      const email      = user.email || "";

      await supabase.from("profiles").upsert(
        { id: user.id, first_name, last_name, phone, email, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    };

    // Estado inicial
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const sess = data?.session;
      if (sess) {
        await ensureProfile();
        if (["/login", "/register", "/"].includes(location.pathname)) route("/dashboard");
      }
    });

    // Cambios de sesión
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await ensureProfile();
        if (["/login", "/register", "/"].includes(location.pathname)) route("/dashboard");
      }
      if (event === "SIGNED_OUT") {
        // navegación dura para romper estados atascados
        window.location.replace("/login");
      }
    });

    // Fallback por se queda colgado
    const fallback = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      const has = !!data?.session;
      if (has && ["/login", "/register", "/"].includes(location.pathname)) route("/dashboard");
    }, 3500);

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
      clearTimeout(fallback);
    };
  }, []);

  return null;
}

