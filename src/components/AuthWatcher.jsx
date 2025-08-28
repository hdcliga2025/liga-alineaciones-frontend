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
      const phone = md.phone || "";

      // Lee perfil existente para NO machacar el 'first_name' guardado en el registro
      const { data: existing } = await supabase
        .from("profiles")
        .select("first_name,last_name,full_name,phone,email")
        .eq("id", user.id)
        .maybeSingle();

      // Sólo tomar del metadata si existe explícitamente
      const mdFirst = (md.first_name || "").trim();
      const mdLast  = (md.last_name  || "").trim();
      const mdFull  = (md.full_name  || "").trim();

      const nextFirst = existing?.first_name?.trim()
        ? existing.first_name.trim()
        : (mdFirst || ""); // si no había perfil previo, intenta metadata; jamás email-prefix

      const nextLast = existing?.last_name?.trim()
        ? existing.last_name.trim()
        : (mdLast || "");

      const nextFull = existing?.full_name?.trim()
        ? existing.full_name.trim()
        : (mdFull || (nextFirst || nextLast ? `${nextFirst}${nextLast ? " " + nextLast : ""}`.trim() : ""));

      // Construye payload sólo con lo que sabemos sin inventar
      const payload = {
        id: user.id,
        email,
        phone: phone || existing?.phone || null,
        updated_at: new Date().toISOString(),
      };
      if (nextFirst) payload.first_name = nextFirst;
      if (nextLast)  payload.last_name = nextLast;
      if (nextFull)  payload.full_name = nextFull;

      await supabase.from("profiles").upsert(payload, { onConflict: "id" });
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

    // Estado inicial
    supabase.auth.getSession().then(({ data }) => {
      const sess = data?.session || null;
      if (sess) upsertOwnProfile();
      goDashboardIfAuthOnPublic(sess);
      goLoginIfNoAuthOnPrivate(sess);
    });

    // Listener auth
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await upsertOwnProfile();
        goDashboardIfAuthOnPublic(session);
      }
      if (event === "SIGNED_OUT") {
        goLoginIfNoAuthOnPrivate(null);
      }
    });

    return () => { active = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  return null;
}

