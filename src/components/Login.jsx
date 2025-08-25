// src/components/Login.jsx
import { h } from "preact";
import { useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message || "Erro ao iniciar sesión");
      return;
    }
    // ⬇️ aquí el cambio clave
    route("/dashboard");
  };

  return (
    <main style={{ padding: "72px 16px 24px" }}>
      <h1 style={{ fontFamily: "Montserrat,system-ui", fontWeight: 700 }}>Entrar</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        <input
          type="email" placeholder="Correo"
          value={email} onInput={(e)=>setEmail(e.currentTarget.value)} required
        />
        <input
          type="password" placeholder="Contrasinal"
          value={password} onInput={(e)=>setPassword(e.currentTarget.value)} required
        />
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Accedendo..." : "Imos!!"}
        </button>
      </form>
    </main>
  );
}

