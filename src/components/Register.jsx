// src/components/Register.jsx
import { useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

// Mapea mensaxes de erro de Supabase a algo máis claro
function mapAuthError(err) {
  if (!err) return "";
  const m = (err.message || "").toLowerCase();
  if (m.includes("user already registered")) return "Este correo xa está rexistrado.";
  if (m.includes("password")) return "Revisa os requisitos do contrasinal.";
  return err.message;
}

// Divide "Nome Apelidos" en { nombre, apellidos }
function splitFullName(full) {
  const safe = (full || "").trim().replace(/\s+/g, " ");
  if (!safe) return { nombre: "", apellidos: "" };
  const parts = safe.split(" ");
  if (parts.length === 1) return { nombre: parts[0], apellidos: "" };
  return { nombre: parts[0], apellidos: parts.slice(1).join(" ") };
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

    // Validación básica
    if (form.password.length < 8) {
      setError("O contrasinal debe ter como mínimo 8 caracteres.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Os contrasinais non coinciden.");
      return;
    }

    const { nombre, apellidos } = splitFullName(form.nomeCompleto);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        // gardamos os 3 campos para poboar 'profiles'
        data: {
          nombre,
          apellidos,
          full_name: form.nomeCompleto,
        },
        // Tras confirmar correo → volver ao login co marcador 'verified'
        emailRedirectTo: `${window.location.origin}/login?verified=true`,
      },
    });

    setLoading(false);

    if (error) {
      setError(mapAuthError(error));
      return;
    }

    // Se require confirmación por email, non haberá sesión aínda
    if (data?.user && !data.session) {
      setMsg("Revisa o teu correo e confirma a conta para continuar.");
      return;
    }

    // Se NON require confirmación e xa hai sesión
    if (onSuccess) onSuccess(data?.session || null);
    route("/partidos");
  };

  return (
    <form class="register-form" onSubmit={handleSubmit} noValidate>
      <label>Nome e apelidos</label>
      <input
        type="text"
        name="nomeCompleto"
        placeholder="Nome e apelidos"
        value={form.nomeCompleto}
        onInput={handleChange}
        required
        autoComplete="name"
      />

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

      <label>
        Contrasinal{" "}
        <span style={{ fontWeight: 400, fontSize: "0.9em" }}>
          [Mínimo 8 caracteres]
        </span>
      </label>
      <input
        type="password"
        name="password"
        placeholder="Contrasinal"
        value={form.password}
        onInput={handleChange}
        required
        autoComplete="new-password"
        minLength={8}
        title="Mínimo 8 caracteres"
      />

      <label>Confirma o contrasinal</label>
      <input
        type="password"
        name="confirmPassword"
        placeholder="Confirma o contrasinal"
        value={form.confirmPassword}
