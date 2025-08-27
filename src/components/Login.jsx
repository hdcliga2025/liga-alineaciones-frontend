// src/components/Login.jsx
import { h } from "preact";
import { useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      route("/dashboard");
    } catch (e) {
      setErr(e.message || "Erro de acceso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main class="landing">
      <header class="landing-header">
        <img src="/logoHDC.jpg" alt="HDC" class="landing-logo" />
        <h1 class="landing-title">Herdeeirxs do Celta</h1>
        <p class="landing-subtitle">Benvidxs á vosa comunidade celeste</p>
      </header>

      <section class="landing-main">
        <div class="auth-card">
          <div class="auth-tabs">
            <button class="tab-btn is-active">Entra</button>
            <button class="tab-btn" onClick={() => route("/register")}>Rexístrate</button>
          </div>

          <form class="tab-body" onSubmit={onSubmit}>
            <label>Email</label>
            <input type="email" required value={email} onInput={(e) => setEmail(e.currentTarget.value)} />

            <label>Contrasinal</label>
            <input type="password" required value={pass} onInput={(e) => setPass(e.currentTarget.value)} />

            {err && <p style={{color:"#ef4444",margin:"8px 0 0"}}>{err}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Accedendo…" : "Veña, dálle!!"}
            </button>
          </form>
        </div>
      </section>

      <footer class="landing-footer">
        © 2025 Heredeirxs do Celta | Feito por Iago Fernández
      </footer>
    </main>
  );
}


