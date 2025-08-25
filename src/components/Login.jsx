// src/components/Login.jsx
import { h } from "preact";
import { useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

function mapAuthError(err) {
  if (!err) return "";
  const m = (err.message || "").toLowerCase();
  if (m.includes("invalid login")) return "Credenciais incorrectas.";
  if (m.includes("email")) return "Revisa o correo electrónico.";
  if (m.includes("password")) return "Revisa o contrasinal.";
  return err.message;
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.currentTarget.name]: e.currentTarget.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    setLoading(false);
    if (error) return setError(mapAuthError(error));
    if (data?.session) route("/dashboard");
  };

  const goRegister = (e) => {
    e.preventDefault();
    route("/register");
  };

  const styles = {
    wrap: {
      maxWidth: 440,
      margin: "40px auto 36px",          // menos altura
      padding: "0 16px",
      fontFamily: "Montserrat, system-ui, sans-serif",
    },
    // truco: anulamos el padding del contenedor de pestañas
    shim: { marginTop: "-22px" },        // sube el bloque bajo las tabs
    form: { display: "grid", gap: 6, marginTop: 0 },
    label: { fontSize: 14, fontWeight: 600, color: "#0f172a" },
    input: {
      width: "100%", padding: "10px 12px", borderRadius: 12,
      border: "1px solid #e5e7eb", outline: "none", fontSize: 15, background: "#fff",
    },
    actions: { display: "grid", gap: 6, marginTop: 6 },
    primary: {
      padding: "10px 14px", borderRadius: 14, border: "1px solid #0ea5e9",
      background: "linear-gradient(135deg,#93c5fd,#60a5fa)", color: "#fff",
      fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 14px rgba(0,0,0,.12)",
    },
    secondary: {
      padding: "10px 14px", borderRadius: 14, border: "1px solid #e5e7eb",
      background: "#fff", color: "#0f172a", fontWeight: 600, cursor: "pointer",
    },
    err: { color: "#b91c1c", fontSize: 13, marginTop: 6 },
  };

  return (
    <main style={styles.wrap}>
      <div style={styles.shim}>
        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <label style={styles.label} for="email">Correo electrónico</label>
          <input
            id="email" name="email" type="email" required
            value={form.email} onInput={handleChange} style={styles.input} autoComplete="email"
          />

          <label style={styles.label} for="password">Contrasinal</label>
          <input
            id="password" name="password" type="password" required
            value={form.password} onInput={handleChange} style={styles.input} autoComplete="current-password"
          />

          {error && <p style={styles.err}>{error}</p>}

          <div style={styles.actions}>
            <button type="submit" style={styles.primary} disabled={loading}>
              {loading ? "Accedendo..." : "Entra"}
            </button>
            <button style={styles.secondary} onClick={goRegister}>
              Rexístrate
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

