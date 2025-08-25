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

      const full_name = user.user_metadata?.full_name || "";
      const phone = user.user_metadata?.phone || "";
      const email = user.email || "";

      // Crea/actualiza o perfil do propio usuario (id = auth.uid())
      await supabase
        .from("profiles")
        .upsert(
          { id: user.id, full_name, phone, email },
          { onConflict: "id" }
        );
    };

    // Estado inicial
    supabase.auth.getSession().then(({ data }) => {
      const sess = data?.session;
      if (sess) ensureProfile();
      // Se está en /login e hai sesión, manda a /dashboard
      if (location.pathname === "/login" && sess) route("/dashboard");
    });

    // Listener de cambios
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await ensureProfile();
        if (location.pathname === "/login") route("/dashboard");
      }
      if (event === "SIGNED_OUT") {
        // quedamos en páxinas públicas
        if (location.pathname.startsWith("/dashboard")) route("/login");
      }
    });

    return () => { active = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  return null;
}

