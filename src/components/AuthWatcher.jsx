// src/components/AuthWatcher.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";
import { route } from "preact-router";

export default function AuthWatcher() {
  useEffect(() => {
    let active = true;

    const isPublicPath = (p) => p === "/" || p === "/login" || p === "/register";
    const isPrivatePath = (p) =>
      ["/dashboard", "/notificacions", "/perfil", "/partidos", "/haz-tu-11", "/clasificacion", "/admin"].some((pre) =>
        p.startsWith(pre)
      );

    const upsertOwnProfile = async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return;

      const md = user.user_metadata || {};
      const email = user.email || "";
      const phone = md.phone || "";

      // Lee perfil existente para NO machacar nombres ya guardados
      const { data: existing } = await supabase
        .from("profiles")
        .select("first_name,last_name,full_name,phone,email")
        .eq("id", user.id)
        .maybeSingle();

      const mdFirst = (md.first_name || "").trim();
      const mdLast  = (md.last_name  || "").trim();
      const mdFull  = (md.full_name  || "").trim();

      const nextFirst = existing?.first_name?.trim()
        ? existing.first_name.trim()
        : (mdFirst || "");

      const nextLast = existing?.last_name?.trim()
        ? existing.last_name.trim()
        : (mdLast || "");

      const nextFull = existing?.full_name?.trim()
        ? existing.full_name.trim()
        : (mdFull || (nextFirst || nextLast ? `${nextFirst}${nextLast ? " " + nextLast : ""}`.trim() : ""));

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
      if (!sess) return;
      const p = location.pathname;
      if (isPublicPath(p)) route("/dashboard", true);
    };

    const goLoginIfNoAuthOnPrivate = (sess) => {
      if (sess) return;
      const p = location.pathname;
      if (isPrivatePath(p)) route("/login", true);
    };

    // Estado inicial
    supabase.auth.getSession().then(async ({ data }) => {
      const sess = data?.session || null;
      if (sess) await upsertOwnProfile();
      goDashboardIfAuthOnPublic(sess);
      goLoginIfNoAuthOnPrivate(sess);
    });

    // Listener auth
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;

      // Algunos navegadores móviles agradecen un refresh al cambiar el token
      if (event === "TOKEN_REFRESHED") {
        goDashboardIfAuthOnPublic(session);
        return;
      }

      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") {
        await upsertOwnProfile();
        goDashboardIfAuthOnPublic(session);
        return;
      }

      if (event === "SIGNED_OUT") {
        goLoginIfNoAuthOnPrivate(null);
        return;
      }
    });

    // Refrescar sesión al recuperar foco (iOS/Safari puede “adormecer” tokens)
    const onFocus = async () => {
      try {
        await supabase.auth.refreshSession();
      } catch {}
    };
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}

