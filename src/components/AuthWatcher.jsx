// src/components/AuthWatcher.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

export default function AuthWatcher() {
  useEffect(() => {
    let active = true;

    const upsertOwnProfile = async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return;

      const md = user.user_metadata || {};
      const email = user.email || "";

      const fullByMd = (md.full_name || "").trim();
      const fnByMd = (md.first_name || "").trim();
      const lnByMd = (md.last_name || "").trim();

      let first_name =
        fnByMd ||
        (fullByMd ? fullByMd.split(" ")[0] : "") ||
        (email.includes("@") ? email.split("@")[0] : "amig@");

      let last_name = lnByMd || "";
      let full_name =
        fullByMd ||
        `${first_name}${last_name ? " " + last_name : ""}`.trim();

      const phone = md.phone || "";

      await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            first_name,
            last_name,
            full_name,
            phone,
            email,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
    };

    const goDashboardIfAuthOnPublic = (sess) => {
      const p = location.pathname;
      const isPublic = p === "/" || p === "/login" || p === "/register";
      if (sess && isPublic) route("/dashboard");
    };

    const goLoginIfNoAuthOnPrivate = (sess) => {
      if (sess) return;
      const p = location.pathname;
      const privatePrefixes = [
        "/dashboard",
        "/notificacions",
        "/perfil",
        "/partidos",
        "/haz-tu-11",
        "/clasificacion",
        "/admin",
      ];
      if (privatePrefixes.some((pre) => p.startsWith(pre))) {
        route("/login");
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      const sess = data?.session || null;
      if (sess) upsertOwnProfile();
      goDashboardIfAuthOnPublic(sess);
      goLoginIfNoAuthOnPrivate(sess);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await upsertOwnProfile();
          goDashboardIfAuthOnPublic(session);
        }
        if (event === "SIGNED_OUT") {
          goLoginIfNoAuthOnPrivate(null);
        }
      }
    );

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return null;
}
