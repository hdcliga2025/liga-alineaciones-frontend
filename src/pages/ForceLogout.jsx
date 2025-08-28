// src/pages/ForceLogout.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

export default function ForceLogout() {
  useEffect(() => {
    let done = false;

    const hardGoto = (path) => {
      try {
        // 1º intento
        window.location.replace(path);
        // 2º intento de seguridad
        setTimeout(() => {
          if (location.pathname !== "/login") {
            window.location.href = path;
          }
        }, 600);
      } catch {
        // 3º intento definitivo
        window.location.href = path;
      }
    };

    (async () => {
      try {
        // Cerramos sesión en servidor y cliente (por si acaso)
        try { await supabase.auth.signOut({ scope: "global" }); } catch {}
        try { await supabase.auth.signOut({ scope: "local"  }); } catch {}

        // Limpiar posibles restos de claves sb-* (tokens de Supabase)
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
      } catch {}

      if (!done) {
        const bust = `?t=${Date.now()}`;
        hardGoto(`/login${bust}`);
        done = true;
      }
    })();

    return () => { done = true; };
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
