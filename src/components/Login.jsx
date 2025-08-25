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

  const handleChange = (e) => {
    setForm((s) => ({ ...s, [e.currentTarget.name]: e.currentTarget.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
    if (data?.session) route("/dashboard");
  };

  const goRegister = (e) => {
    e.preventDefault();
    route("/register");
  };

  const styles = {
    wrap: {
      maxWidth: 440, margin: "84px auto 40px", padding: "0 16px",
      fontFamily: "Montserrat, system-ui, sans-serif",
    },
    title: { margin: "0 0 4px", fontWeight: 700, fontSize: 22, color: "#111", display: "none" }, // oculto “Entrar”
    form: { display: "grid", gap: 10, marginTop: 8 }, // menos gap para achegar campos aos botóns
    label: { fontSize: 14, fontWeight: 600, color: "#0f172a" },
    input: {
      width: "100%", padding: "10px 12px", borderRadius: 12,
      border: "1px solid #e5e7eb", outline: "none",
      fontSize: 15, background: "#fff",
    },
    actions: { display: "grid", gap: 8, marginTop: 6 },
    primary: {
      padding: "10px 14px", borderRadius: 14, border: "1px solid #0ea5e9",
      background: "linear-gradient(135deg,#93c5fd,#60a5fa)", color: "#fff",
      fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 14px rgba(0,0,0,.12)",
    },
    secondary: {
      padding: "10px 14px", borderRadius: 14, border: "1px solid #e5e7eb",
      background: "#fff", color: "#0f172a", fontWeight: 600, cursor: "pointer",
    },
    err: { color: "#b91c1c", fontSize: 13, marginTop: 6 }
  };

  return (
    <main style={styles.wrap}>
      {/* <h1 style={styles.title}>Entrar</h1> */}
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        <label style={styles.label} for="email">Correo electrónico</label>
        <input
          id="email" name="email" type="email" required
          placeholder="correo electrónico"
          value={form.email} onInput={handleChange} style={styles.input} autoComplete="email"
        />

        <label style={styles.label} for="password">Contrasinal</label>
        <input
          id="password" name="password" type="password" required
          placeholder="contrasinal"
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
    </main>
  );
}

