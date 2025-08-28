// src/pages/ForceLogout.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getParam(name) {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export default function ForceLogout() {
  useEffect(() => {
    let cancelled = false;

    const hardRedirect = () => {
      const to = getParam("to") || "/"; // ← por defecto, a la Landing
      try {
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
      window.location.replace(to);
    };

    (async () => {
      try {
        try { await supabase.auth.signOut({ scope: "global" }); } catch {}
        try { await supabase.auth.signOut({ scope: "local"  }); } catch {}
        await sleep(250);
      } finally {
        if (!cancelled) hardRedirect();
      }
    })();

    const failSafe = setTimeout(() => {
      if (!cancelled) hardRedirect();
    }, 2000);

    return () => { cancelled = true; clearTimeout(failSafe); };
  }, []);

  return (
    <main style={{ padding: "32px", textAlign: "center" }}>
      <h2 style={{ color: "#0ea5e9", fontWeight: 700, margin: 0 }}>Pechando sesión…</h2>
    </main>
  );
}
