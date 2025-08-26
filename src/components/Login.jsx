// src/components/Login.jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { supabase } from '../lib/supabaseClient.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) {
        setErr(error.message || 'Erro iniciando sesión.');
        return;
      }
      route('/dashboard', true);
    } catch (e2) {
      console.error(e2);
      setErr('Erro inesperado iniciando sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style="
        display:flex;
        justify-content:center;
        padding:24px;
        font-family:'Montserrat', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      "
    >
      <style>
        {`
          .cta {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #90c2ff;
            border-radius: 12px;
            background: #ffffff;
            color: #3892ff;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 6px 18px rgba(56,146,255,0.12);
            transition: background .18s ease, color .18s ease, box-shadow .18s ease, transform .06s ease;
          }
          .cta:hover {
            background: #3892ff;
            color: #ffffff;
            box-shadow: 0 8px 22px rgba(56,146,255,0.22);
          }
          .cta:active { transform: translateY(1px); }
          .card {
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius:16px;
            padding:16px;
            box-shadow:0 8px 24px rgba(0,0,0,.06);
          }
          .label { display:block; margin: 6px 0 6px; font-weight:600; }
          .input {
            width:100%;
            padding:10px;
            border:1px solid #d1d5db;
            border-radius:10px;
          }
          .muted { margin:8px 0 12px; color:#b91c1c; font-size:.95rem; }
          .wrap { width:100%; max-width:420px; }
        `}
      </style>

      <div class="wrap">
        <div class="card">
          <form onSubmit={handleSubmit} noValidate>
            <label for="email" class="label">Correo electrónico</label>
            <input
              id="email"
              type="email"
              class="input"
              value={email}
              onInput={(e) => setEmail(e.currentTarget.value)}
              required
              autoComplete="username"
            />

            <label for="password" class="label" style="margin-top:12px;">Contrasinal</label>
            <input
              id="password"
              type="password"
              class="input"
              value={password}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required
              autoComplete="current-password"
            />

            {err && <p class="muted">{err}</p>}

            <button type="submit" class="cta" disabled={loading}>
              {loading ? 'Accedendo…' : 'Imos!!'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

