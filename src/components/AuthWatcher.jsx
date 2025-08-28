// src/components/AuthWatcher.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

export default function AuthWatcher() {
  useEffect(() => {
    let alive = true;
    const PUBLIC = ["/", "/login", "/register"];

    const upsertOwnProfile = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;
      const md = user.user_metadata || {};
      const first_name = (md.first_name || "").trim();
      const last_name  = (md.last_name  || "").trim();
      const full_name  = (md.full_name  || `${first_name} ${last_name}`).trim();
      const phone = md.phone || "";
      const email = user.email || "";
      await supabase.from("profiles").upsert(
        {
          id: user.id, first_name, last_name, full_name, phone, email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    };

    const goDashboardIfAuthOnPublic = async () => {
      const path = location.pathname;
      if (!PUBLIC.includes(path)) return;
      const { data } = await supabase.auth.getUser();
      if (data?.user) route("/dashboard");
    };

    const goLoginIfNoAuthOnPrivate = async () => {
      const path = location.pathname;
      if (PUBLIC.includes(path)) return;
      const { data } = await supabase.auth.getUser();
      if (!data?.user) route("/login");
    };

    // Estado inicial
    (async () => {
      await goDashboardIfAuthOnPublic();
      await goLoginIfNoAuthOnPrivate();
      const { data } = await supabase.auth.getUser();
      if (data?.user) await upsertOwnProfile();
    })();

    // Listener cambios
    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (!alive) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await upsertOwnProfile();
        await goDashboardIfAuthOnPublic();
      }
      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        await goLoginIfNoAuthOnPrivate();
      }
    });

    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  return null;
}
