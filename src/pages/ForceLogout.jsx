// src/pages/ForceLogout.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

export default function ForceLogout() {
  const [msg] = useState("Pechando sesión…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Cerrar sesión local (borra tokens del dispositivo)
        await supabase.auth.signOut({ scope: "local" });
      } catch (_) {}

      // Limpieza dura de claves sb-* que pueda deixar o SDK
      try {
        const clear = (store) => {
          if (!store) return;
          const keys = [];
          for (let i = 0; i < store.length; i++) {
            const k = store.key(i);
            if (k && k.startsWith("sb-")) keys.push(k);
          }
          keys.forEach((k) => store.removeItem(k));
        };
        clear(window.localStorage);
        clear(window.sessionStorage);
      } catch (_) {}

      if (!cancelled) {
        route("/login", true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main style={{ padding: "36px 16px", textAlign: "center" }}>
      <p
        style={{
          font: "600 18px/1.2 Montserrat, system-ui, sans-serif",
          color: "#0ea5e9",
        }}
      >
        {msg}
      </p>
    </main>
  );
}
