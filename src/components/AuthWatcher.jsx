// src/components/AuthWatcher.jsx
import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

/**
 * Detección global de nueva versión:
 * - Consulta /index.html con cache: "no-store" para leer ETag/Last-Modified.
 * - Si cambian respecto al valor guardado en localStorage, recarga la app.
 */
async function ensureFreshApp() {
  try {
    const res = await fetch("/index.html", { cache: "no-store" });
    const etag = res.headers.get("etag");
    const lm = res.headers.get("last-modified");
    const sig = etag || lm || String(Date.now());
    const KEY = "__app_index_sig";

    const prev = localStorage.getItem(KEY);
    if (prev && prev !== sig) {
      // Build nueva: recarga limpia (sin cerrar sesión manualmente)
      location.replace(location.href);
      return false;
    }
    localStorage.setItem(KEY, sig);
    return true;
  } catch {
    return true; // si no podemos comprobar, seguimos
  }
}

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
      // 0) Comprobar versión nueva: si hay, recarga y no seguimos.
      const fresh = await ensureFreshApp();
      if (!fresh) return;

      // 1) Sesión viva (intenta refrescar si no hay)
      let { data } = await supabase.auth.getSession();
      let sess = data?.session || null;
      if (!sess) {
        try { await supabase.auth.refreshSession(); } catch {}
        const again = await supabase.auth.getSession();
        sess = again?.data?.session || null;
      }

      const p = location.pathname;
      const isPublic = p === "/" || p.startsWith("/login") || p.startsWith("/register");

      if (sess) {
        await upsertOwnProfile();
        if (isPublic) safeRouteTo("/dashboard");
      } else if (!isPublic) {
        safeRouteTo("/login");
      }
    };

    handleInitial();

    // Auth listener
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

    // Al volver a la pestaña: comprobar nueva build + mantener sesión viva
    const onVis = async () => {
      if (document.hidden) return;
      const fresh = await ensureFreshApp();
      if (!fresh) return; // si hay nueva versión, se recarga
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
