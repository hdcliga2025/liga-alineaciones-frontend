// src/components/Login.jsx
import { h } from "preact";
import { useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) {
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          setMsg("Debe confirmar o seu correo antes de acceder.");
        } else {
          setMsg("Credenciais incorrectas ou conta non confirmada.");
        }
        return;
      }
      if (data?.user) {
        route("/dashboard");
      } else {
        setMsg("Non se puido iniciar sesión. Téntao de novo.");
      }
    } catch (err) {
      setMsg("Erro de conexión. Comproba a túa rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#0ea5e9" }}>
          {/* sobre */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="M3 7l9 6 9-6"/>
          </svg>
        </div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onInput={(e)=>setEmail(e.currentTarget.value)}
          required
          style={{ width: "100%", padding: "12px 14px 12px 42px", border: "1px solid #e5e7eb", borderRadius: 10 }}
        />
      </div>

      <div style={{ position: "relative", marginBottom: 6 }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#0ea5e9" }}>
          {/* candado */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <input
          type="password"
          placeholder="Contrasinal"
          value={pass}
          onInput={(e)=>setPass(e.currentTarget.value)}
          required
          style={{ width: "100%", padding: "12px 14px 12px 42px", border: "1px solid #e5e7eb", borderRadius: 10 }}
        />
      </div>

      {msg && <p style={{ color: "#ef4444", margin: "6px 0 8px", fontWeight: 600 }}>{msg}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%", padding: "12px", borderRadius: 12, background: "#fff",
          border: "1px solid #e5e7eb", boxShadow: "0 2px 10px rgba(0,0,0,.08)",
          fontWeight: 800, color: "#0ea5e9", cursor: "pointer"
        }}
      >
        {loading ? "Accedendo..." : "Veña, dálle!!"}
      </button>
    </form>
  );
}



