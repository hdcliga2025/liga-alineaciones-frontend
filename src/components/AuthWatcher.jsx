// src/components/AuthWatcher.jsx
import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

/**
 * AuthWatcher
 * - Control global de sesión + upsert de perfil
 * - Keepalive de token
 * - Autoreload tras deploy detectando cambio de build (hash de /assets/*)
 *   con antibucle para evitar recargas infinitas.
 */

const LS_BUILD_KEY = "APP_BUILD_ID";
const LS_RELOAD_FLAG = "APP_RELOADING_AT";
const RELOAD_COOLDOWN_MS = 12_000; // anti-bucle: 12s
const KEEPALIVE_MS = 5 * 60_000;   // 5 min

function now() {
  return Date.now();
}

function withinReloadCooldown() {
  try {
    const t = parseInt(localStorage.getItem(LS_RELOAD_FLAG) || "0", 10);
    return t && now() - t < RELOAD_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function setReloadFlag() {
  try {
    localStorage.setItem(LS_RELOAD_FLAG, String(now()));
  } catch {}
}

function clearReloadFlag() {
  try {
    localStorage.removeItem(LS_RELOAD_FLAG);
  } catch {}
}

/** Lee un posible BUILD_ID desde variables de entorno (si lo defines en Vite). */
function getEnvBuildId() {
  try {
    // @ts-ignore
    const v = import.meta?.env?.VITE_BUILD_ID;
    return (v && String(v)) || null;
  } catch {
    return null;
  }
}

/** Extrae el hash principal del bundle de Vite desde el DOM (script o modulepreload). */
function getBundleHashFromDom() {
  try {
    // 1) script type="module" src="/assets/xxxxx.js"
    const scripts = Array.from(
      document.querySelectorAll('script[type="module"][src^="/assets/"]')
    );
    for (const s of scripts) {
      const src = s.getAttribute("src") || "";
      const h = src.split("/").pop(); // index-<hash>.js
      if (h) return h;
    }
    // 2) link rel="modulepreload" href="/assets/xxxxx.js"
    const links = Array.from(
      document.querySelectorAll('link[rel="modulepreload"][href^="/assets/"]')
    );
    for (const l of links) {
      const href = l.getAttribute("href") || "";
      const h = href.split("/").pop();
      if (h) return h;
    }
  } catch {}
  return null;
}

/** Calcula el BUILD_ID actual (prioriza env, si no hay, usa hash de assets). */
function getCurrentBuildId() {
  return getEnvBuildId() || getBundleHashFromDom() || "dev";
}

/** Recarga hard con pequeño cache-buster para garantizar nuevo HTML (aunque ya es no-store). */
function hardReload() {
  try {
    const url = new URL(location.href);
    url.searchParams.set("_r", String(Date.now()));
    location.replace(url.toString());
  } catch {
    location.reload();
  }
}

export default function AuthWatcher() {
  const mounted = useRef(false);
  const keepaliveId = useRef(0);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    let active = true;

    // ===== Versión de build & autoreload (al montar) =====
    try {
      const currentId = getCurrentBuildId();
      const prevId = localStorage.getItem(LS_BUILD_KEY);

      // Guard para evitar bucles si ya recargamos hace nada
      const inCooldown = withinReloadCooldown();

      if (prevId && currentId && prevId !== currentId && !inCooldown) {
        // Nueva versión detectada → set flag y recargar
        setReloadFlag();
        // Guardamos el nuevo para que tras recargar ya no dispare
        localStorage.setItem(LS_BUILD_KEY, currentId);
        hardReload();
        return; // importante: no continuar montaje si vamos a recargar
      } else {
        // Primera vez o idéntico → almacenar y limpiar flag
        localStorage.setItem(LS_BUILD_KEY, currentId || "dev");
        clearReloadFlag();
      }
    } catch {
      // en caso de error, seguimos
    }

    // ===== Funciones auxiliares =====
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
      const mdLast = (md.last_name || "").trim();
      const mdFull = (md.full_name || "").trim();

      const nextFirst = existing?.first_name?.trim()
        ? existing.first_name.trim()
        : mdFirst || "";
      const nextLast = existing?.last_name?.trim()
        ? existing.last_name.trim()
        : mdLast || "";
      const nextFull = existing?.full_name?.trim()
        ? existing.full_name.trim()
        : mdFull ||
          (nextFirst || nextLast
            ? `${nextFirst}${nextLast ? " " + nextLast : ""}`.trim()
            : "");

      const payload = {
        id: user.id,
        email,
        phone: phone || existing?.phone || null,
        updated_at: new Date().toISOString(),
      };
      if (nextFirst) payload.first_name = nextFirst;
      if (nextLast) payload.last_name = nextLast;
      if (nextFull) payload.full_name = nextFull;

      await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    };

    const safeRouteTo = (path) => {
      try {
        if (location.pathname !== path) route(path, true);
      } catch {
        if (location.pathname !== path) location.href = path;
      }
    };

    const isPublicPath = (p) =>
      p === "/" || p.startsWith("/login") || p.startsWith("/register");

    // ===== Manejo inicial de sesión =====
    const handleInitial = async () => {
      const { data } = await supabase.auth.getSession();
      const sess = data?.session || null;
      const p = location.pathname;

      if (sess) {
        await upsertOwnProfile();
        if (isPublicPath(p)) safeRouteTo("/dashboard");
      } else if (!isPublicPath(p)) {
        safeRouteTo("/login");
      }
    };

    handleInitial().catch(() => {});

    // ===== Suscripción a cambios de auth =====
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;
        const p = location.pathname;

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          try {
            await upsertOwnProfile();
          } catch {}
          if (isPublicPath(p)) safeRouteTo("/dashboard");
        }

        if (event === "SIGNED_OUT") {
          safeRouteTo("/login");
        }
      }
    );

    // ===== Keepalive de token cada 5 minutos =====
    keepaliveId.current = window.setInterval(async () => {
      try {
        await supabase.auth.getSession();
      } catch {}
    }, KEEPALIVE_MS);

    // ===== Al volver a primer plano: keepalive + comprobar nueva versión =====
    const onVis = async () => {
      if (document.hidden) return;
      try {
        await supabase.auth.getSession();
      } catch {}

      // Re-chequear versión de build al volver a foreground
      try {
        const currentId = getCurrentBuildId();
        const prevId = localStorage.getItem(LS_BUILD_KEY);
        if (prevId && currentId && prevId !== currentId && !withinReloadCooldown()) {
          setReloadFlag();
          localStorage.setItem(LS_BUILD_KEY, currentId);
          hardReload();
        }
      } catch {}
    };
    document.addEventListener("visibilitychange", onVis);

    // ===== Limpieza =====
    return () => {
      active = false;
      sub?.subscription?.unsubscribe?.();
      document.removeEventListener("visibilitychange", onVis);
      if (keepaliveId.current) {
        clearInterval(keepaliveId.current);
        keepaliveId.current = 0;
      }
    };
  }, []);

  return null;
}
