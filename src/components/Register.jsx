// src/components/Register.jsx
import { useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

function mapAuthError(err) {
  if (!err) return "";
  const m = (err.message || "").toLowerCase();
  if (m.includes("user already registered")) return "Este correo xa está rexistrado.";
  if (m.includes("password")) return "Revisa os requisitos do contrasinal.";
  return err.message;
}

export default function Register({ onSuccess }) {
  const [form, setForm] = useState({
    nomeCompleto: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.currentTarget.name]: e.currentTarget.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Os contrasinais non coinciden.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.nomeCompleto },
        // redirección tras confirmar correo (en dev)
        emailRedirectTo: `${location.origin}/`,
      },
    });

    setLoading(false);

    if (error) {
      setError(mapAuthError(error));
      return;
    }

    // Se a túa política de Supabase require confirmar email,
    // data.user pode vir sen sesión. Avisamos.
    if (data?.user && !data.session) {
      setMsg("Revisa o teu correo e confirma a conta para continuar.");
      return;
    }

    // Se non require confirmación, xa hai sesión activa
    if (onSuccess) onSuccess(data?.session || null);
    route("/partidos");
  };

  return (
    <form class="register-form" onSubmit={handleSubmit} novalidate>
      <label>Nome e apelidos</label>
      <input
        type="text"
        name="nomeCompleto"
        placeholder="Nome e apelidos"
        value={form.nomeCompleto}
        onInput={handleChange}
        required
        autocomplete="name"
      />

      <label>Correo electrónico</label>
      <input
        type="email"
        name="email"
        placeholder="Correo electrónico"
        value={form.email}
        onInput={handleChange}
        required
        autocomplete="email"
      />

      <label>Contrasinal</label>
      <input
        type="password"
        name="password"
        placeholder="Contrasinal"
        value={form.password}
        onInput={handleChange}
        required
        autocomplete="new-password"
      />

      <label>Confirma o contrasinal</label>
      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirma o contrasinal"
        value={form.confirmPassword}
        onInput={handleChange}
        required
        autocomplete="new-password"
      />

      {error && <p class="form-error">{error}</p>}
      {msg && <p class="form-info">{msg}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Rexistrando..." : "Adiante co rexistro"}
      </button>
    </form>
  );
}

