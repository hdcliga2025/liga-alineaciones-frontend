// src/components/AuthWatcher.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

const PUBLIC_PATHS = ["/", "/login", "/register"];

export default function AuthWatcher() {
  useEffect(() => {
    let alive = true;

    const ensureProfile = async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return;

      // Lee perfil existente (por se hai valores xa gardados)
      const { data: existing } = await supabase
        .from("profiles")
        .select("first_name,last_name,full_name,phone,email")
        .eq("id", user.id)
        .maybeSingle();

      const metaFirst = user.user_metadata?.first_name || "";
      const metaLast  = user.user_metadata?.last_name  || "";
      const first_name = metaFirst || existing?.first_name || "";
      const last_name  = metaLast  || existing?.last_name  || "";
      const full_name  =
        (first_name || last_name) ?
          `${first_name} ${last_name}`.trim() :
          (existing?.full_name || user.user_metadata?.full_name || "");

      const email = user.email || existing?.email || "";
      const phone = existing?.phone || user.user_metadata?.phone || "";

      await supabase
        .from("profiles")
        .upsert(
          { id: user.id, first_name, last_name, full_name, phone, email, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        );
    };

    // Estado inicial
    supabase.auth.getSession().then(async ({ data }) => {
      const sess = data?.session;
      if (sess) {
        await ensureProfile();
        if (PUBLIC_PATHS.includes(location.pathname)) {
          try { route("/dashboard"); } catch {}
        }
      } else {
        // Sen sesión, fóra das públicas → a login
        if (!PUBLIC_PATHS.includes(location.pathname)) {
          route("/login");
        }
      }
    });

    // Listener de cambios
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!alive) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await ensureProfile();
        if (PUBLIC_PATHS.includes(location.pathname)) {
          try { route("/dashboard"); } catch {}
        }
      }
      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        try { route("/login"); } catch {}
      }
    });

    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  return null;
}

