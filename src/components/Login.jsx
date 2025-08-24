// src/components/Login.jsx
import { useState, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

function mapAuthError(err) {
  if (!err) return "";
  const m = (err.message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Credenciais incorrectas.";
  if (m.includes("email not confirmed")) return "Confirma o teu correo antes de iniciar sesión.";
  return err.message;
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "true") {
      setMsg("Correo verificado. Xa podes iniciar sesión.");
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.currentTarget.name]: e.currentTarget.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    setLoading(false);

    if (error) {
      setError(mapAuthError(error));
      return;
    }

    if (data?.session) {
      route("/partidos", true);
    } else {
      setMsg("Sesión non creada. Proba de novo.");
    }
  };

  return (
    <form class="login-form" onSubmit={handleSubmit} noValidate>
      <label>Correo electrónico</label>
      <input
        type="email"
        name="email"
        placeholder="Correo electrónico"
        value={form.email}
        onInput={handleChange}
        required
        autoComplete="email"
      />

      <label>Contrasinal</label>
      <input
        type="password"
        name="password"
        placeholder="Contrasinal"
        value={form.password}
        onInput={handleChange}
        required
        autoComplete="current-password"
      />

      {error && <p class="form-error">{error}</p>}
      {msg && <p class="form-info">{msg}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Imos!!"}
      </button>
    </form>
  );
}
