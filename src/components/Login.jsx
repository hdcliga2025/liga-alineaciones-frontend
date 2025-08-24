// src/components/Login.jsx
import { useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

function mapAuthError(err) {
  if (!err) return "";
  const m = (err.message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo ou contrasinal incorrectos.";
  if (m.includes("email not confirmed")) return "Debes confirmar o correo antes de entrar.";
  if (m.includes("rate limit")) return "Demasiados intentos. Agarda uns segundos e proba de novo.";
  return err.message;
}

export default function Login({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(mapAuthError(error));
      return;
    }

    // Éxito
    if (onSuccess) onSuccess(data?.session);
    // Navegamos a unha pantalla interna (axústaa se queres)
    route("/partidos");
  };

  return (
    <form class="login-form" onSubmit={handleSubmit} novalidate>
      <label>Correo electrónico</label>
      <input
        type="email"
        name="email"
        placeholder="Correo electrónico"
        value={email}
        onInput={(e) => setEmail(e.currentTarget.value)}
        required
        autocomplete="email"
      />

      <label>Contrasinal</label>
      <input
        type="password"
        name="password"
        placeholder="Contrasinal"
        value={password}
        onInput={(e) => setPassword(e.currentTarget.value)}
        required
        autocomplete="current-password"
      />

      {error && <p class="form-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Imos !!"}
      </button>
    </form>
  );
}
