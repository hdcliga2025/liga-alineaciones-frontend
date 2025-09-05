import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

export default function AuthWatcher() {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    let active = true;

    const upsertOwnProfile = async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return;

      const md = user.user_metadata || {};
      const email = user.email || "";
      const phone = md.phone || "";

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

    const safeRouteTo = (path) => {
      try { route(path, true); } catch { location.href = path; }
    };

    const handleInitial = async () => {
      const { data } = await supabase.auth.getSession();
      const sess = data?.session || null;
      const p = location.pathname;

      // perfiles públicos
      const isPublic = p === "/" || p.startsWith("/login") || p.startsWith("/register");
      if (sess) {
        await upsertOwnProfile();
        if (isPublic) safeRouteTo("/dashboard");
      } else if (!isPublic) {
        safeRouteTo("/login");
      }
    };

    handleInitial();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await upsertOwnProfile();
        const p = location.pathname;
        if (p === "/" || p.startsWith("/login") || p.startsWith("/register")) {
          safeRouteTo("/dashboard");
        }
      }
      if (event === "SIGNED_OUT") {
        safeRouteTo("/login");
      }
    });

    const onVis = async () => {
      if (document.hidden) return;
      // tocar sesión para forzar token vivo
      try { await supabase.auth.getSession(); } catch {}
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}

