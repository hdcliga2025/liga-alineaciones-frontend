// src/pages/ForceLogout.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

export default function ForceLogout() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Cerrar sesión local (tokens do dispositivo)
        await supabase.auth.signOut({ scope: "local" });
      } catch (_) {}

      // Limpieza de posibles claves sb-* en storage
      try {
        const zap = (store) => {
          if (!store) return;
          const rm = [];
          for (let i = 0; i < store.length; i++) {
            const k = store.key(i);
            if (k && k.startsWith("sb-")) rm.push(k);
          }
          rm.forEach((k) => store.removeItem(k));
        };
        zap(window.localStorage);
        zap(window.sessionStorage);
      } catch (_) {}

      if (!cancelled) {
        // SPA redirect
        route("/login", true);
        // Fallback duro por se o SPA non navega (garantía)
        setTimeout(() => {
          try {
            if (location.pathname !== "/login") {
              window.location.replace("/login");
            }
          } catch (_) {}
        }, 200);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <main style={{ padding: "36px 16px", textAlign: "center" }}>
      <p
        style={{
          font: "600 18px/1.2 Montserrat, system-ui, sans-serif",
          color: "#0ea5e9",
        }}
      >
        Pechando sesión…
      </p>
    </main>
  );
}
