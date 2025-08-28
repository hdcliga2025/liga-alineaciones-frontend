import { h } from "preact";
import { useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ForceLogout() {
  useEffect(() => {
    let cancelled = false;

    const hardRedirectToLogin = () => {
      try {
        // Limpieza agresiva de storage
        if (typeof localStorage !== "undefined") {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith("sb-") || k.includes("supabase")) localStorage.removeItem(k);
          });
        }
        if (typeof sessionStorage !== "undefined") {
          Object.keys(sessionStorage).forEach((k) => {
            if (k.startsWith("sb-") || k.includes("supabase")) sessionStorage.removeItem(k);
          });
        }
      } catch {}
      // Redirección dura (evita quedarse en SPA)
      window.location.replace("/login");
    };

    (async () => {
      try {
        // 1) Cerrar sesión global y local
        try { await supabase.auth.signOut({ scope: "global" }); } catch {}
        try { await supabase.auth.signOut({ scope: "local"  }); } catch {}

        // 2) Espera breve para que se invalide el estado auth
        await sleep(250);
      } finally {
        if (!cancelled) hardRedirectToLogin();
      }
    })();

    // Safety net: si por lo que sea seguimos aquí, nos vamos igualmente
    const failSafe = setTimeout(() => {
      if (!cancelled) window.location.replace("/login");
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(failSafe);
    };
  }, []);

  return (
    <main style={{ padding: "32px", textAlign: "center" }}>
      <h2 style={{ color: "#0ea5e9", fontWeight: 700, margin: 0 }}>Pechando sesión…</h2>
    </main>
  );
}
