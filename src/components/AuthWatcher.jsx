// src/components/AuthWatcher.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

const PUBLIC = ["/", "/login", "/register"];

export default function AuthWatcher() {
  useEffect(() => {
    let alive = true;

    const ensureProfile = async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return;

      const { data: existing } = await supabase
        .from("profiles")
        .select("first_name,last_name,full_name,phone,email")
        .eq("id", user.id)
        .maybeSingle();

      const first = user.user_metadata?.first_name || existing?.first_name || "";
      const last  = user.user_metadata?.last_name  || existing?.last_name  || "";
      const full  = (first || last)
        ? `${first} ${last}`.trim()
        : (existing?.full_name || user.user_metadata?.full_name || "");

      const phone = existing?.phone || user.user_metadata?.phone || "";
      const email = user.email || existing?.email || "";

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          first_name: first,
          last_name:  last,
          full_name:  full,
          phone,
          email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    };

    // Estado inicial
    supabase.auth.getSession().then(async ({ data }) => {
      const sess = data?.session;
      if (sess) {
        await ensureProfile();
        // Sólo saltamos a /dashboard si está en una pública
        if (PUBLIC.includes(location.pathname)) route("/dashboard");
      } else if (!PUBLIC.includes(location.pathname)) {
        route("/login");
      }
    });

    // Cambios de auth
    const { data: sub } = supabase.auth.onAuthStateChange(async (ev) => {
      if (!alive) return;
      if (ev === "SIGNED_IN" || ev === "TOKEN_REFRESHED") {
        await ensureProfile();
        if (PUBLIC.includes(location.pathname)) route("/dashboard");
      }
      if (ev === "SIGNED_OUT" || ev === "USER_DELETED") {
        route("/login");
      }
    });

    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  return null;
}
