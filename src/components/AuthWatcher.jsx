// src/components/AuthWatcher.jsx
import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

/**
 * Detección global de nueva versión (segura):
 * - Lee /index.html con cache: "no-store".
 * - Usa solo ETag o Last-Modified como firma. Si no hay NINGUNO, no recarga.
 * - Throttle: no comprobar más de una vez cada 30s por pestaña.
 * - Anti-loop: si ya recargamos por nueva build en esta pestaña, no repetir.
 */
async function ensureFreshAppSafe() {
  try {
    const RELOAD_FLAG = "__reloaded_for_build";
    const LAST_CHECK = "__last_build_check_ms";
    const SIG_KEY = "__app_index_sig";

    // Throttle 30s
    const now = Date.now();
    const last = Number(sessionStorage.getItem(LAST_CHECK) || "0");
    if (now - last < 30000) return true;
    sessionStorage.setItem(LAST_CHECK, String(now));

    // Si ya forzamos una recarga en esta pestaña, no insistir
    if (sessionStorage.getItem(RELOAD_FLAG) === "1") return true;

    const res = await fetch("/index.html", { cache: "no-store" });
    const etag = res.headers.get("etag");
    const lm = res.headers.get("last-modified");

    // Si el server no provee firma estable, NO recargamos
    const sig = etag || lm || null;
    if (!sig) return true;

    const prev = localStorage.getItem(SIG_KEY);
    if (prev && prev !== sig) {
      // Nueva build detectada -> recarga limpia sin cerrar sesión
      sessionStorage.setItem(RELOAD_FLAG, "1");
      location.replace(location.href);
      return false;
    }
    localStorage.setItem(SIG_KEY, sig);
    return true;
  } catch {
    // Si hay error de red/headers, no forzamos recarga
    return true;
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
      // Comprobación de build segura (no-loop, throttle, sin fallback variable)
      const fresh = await ensureFreshAppSafe();
      if (!fresh) return;

      // Mantener sesión viva (con intento de refresh)
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

    // Listener de auth
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

    // Al volver a la pestaña: comprobar build (seguro) y tocar sesión
    const onVis = async () => {
      if (document.hidden) return;
      const fresh = await ensureFreshAppSafe();
      if (!fresh) return;
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
