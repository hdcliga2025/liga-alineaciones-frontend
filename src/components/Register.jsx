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
    phone: "",
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
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: form.nomeCompleto.trim(),
          phone: form.phone.trim(),
        },
        emailRedirectTo: `${location.origin}/login?verified=true`,
      },
    });

    setLoading(false);

    if (error) {
      setError(mapAuthError(error));
      return;
    }

    if (data?.user && !data.session) {
      setMsg("Revisa o teu correo e confirma a conta para continuar.");
      return;
    }

    if (onSuccess) onSuccess(data?.session || null);
    route("/dashboard");
  };

  const styles = {
    wrap: { maxWidth: 520, margin: "72px auto 40px", padding: "0 16px", fontFamily: "Montserrat, system-ui, sans-serif" },
    form: { display: "grid", gap: 12 },
    label: { fontSize: 14, fontWeight: 600, color: "#0f172a" },
    input: {
      width: "100%", padding: "10px 12px", borderRadius: 12,
      border: "1px solid #e5e7eb", outline: "none", fontSize: 15, background: "#fff",
    },
    helpInline: { fontSize: 12, color: "#6b7280", marginLeft: 8 },
    err: { color: "#b91c1c", fontSize: 13 },
    info: { color: "#065f46", fontSize: 13 },
    actions: { display: "grid", gap: 10, marginTop: 6 },
    primary: {
      padding: "10px 14px", borderRadius: 14, border: "1px solid #0ea5e9",
      background: "linear-gradient(135deg,#93c5fd,#60a5fa)", color: "#fff",
      fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 14px rgba(0,0,0,.12)",
    },
  };

  return (
    <main style={styles.wrap}>
      <form class="register-form" onSubmit={handleSubmit} noValidate style={styles.form}>
        <label style={styles.label} for="nomeCompleto">
          Nome e apelidos
        </label>
        <input
          id="nomeCompleto" type="text" name="nomeCompleto"
          placeholder="Nome e apelidos"
          value={form.nomeCompleto} onInput={handleChange} required autoComplete="name"
          style={styles.input}
        />

        <label style={styles.label} for="phone">
          Número de teléfono móbil
        </label>
        <input
          id="phone" type="tel" name="phone"
          placeholder="Número de teléfono móbil"
          value={form.phone} onInput={handleChange} autoComplete="tel"
          style={styles.input}
        />

        <label style={styles.label} for="email">
          Correo electrónico
        </label>
        <input
          id="email" type="email" name="email"
          placeholder="Correo electrónico"
          value={form.email} onInput={handleChange} required autoComplete="email"
          style={styles.input}
        />

        <label style={styles.label} for="password">
          Contrasinal <span style={styles.helpInline}>[mínimo 8 caracteres]</span>
        </label>
        <input
          id="password" type="password" name="password"
          placeholder="Contrasinal"
          value={form.password} onInput={handleChange} required autoComplete="new-password"
          minlength={8}
          style={styles.input}
        />

        <label style={styles.label} for="confirmPassword">Confirma o contrasinal</label>
        <input
          id="confirmPassword" type="password" name="confirmPassword"
          placeholder="Confirma o contrasinal"
          value={form.confirmPassword} onInput={handleChange} required autoComplete="new-password"
          minlength={8}
          style={styles.input}
        />

        {error && <p style={styles.err}>{error}</p>}
        {msg && <p style={styles.info}>{msg}</p>}

        <div style={styles.actions}>
          <button type="submit" disabled={loading} style={styles.primary}>
            {loading ? "Rexistrando..." : "Crear conta"}
          </button>
        </div>
      </form>
    </main>
  );
}


