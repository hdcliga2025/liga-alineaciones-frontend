// src/pages/ForceLogout.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

export default function ForceLogout() {
  useEffect(() => {
    (async () => {
      try { await supabase.auth.signOut(); } catch {}
      try { localStorage.clear(); sessionStorage.clear(); } catch {}
      // intentos encadeados para asegurar a redirección
      try { route("/login"); } catch {}
      try { window.location.replace("/login"); } catch {}
      setTimeout(() => { window.location.href = "/login"; }, 30);
    })();
  }, []);

  return (
    <main style={{ padding: "16px", fontFamily: "Montserrat, system-ui, sans-serif" }}>
      <h3 style={{ color: "#0ea5e9" }}>Pechando sesión…</h3>
      <p>Redirixindo a /login</p>
    </main>
  );
}
