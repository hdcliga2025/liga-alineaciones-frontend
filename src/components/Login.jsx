// src/components/Login.jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { supabase } from '../lib/supabaseClient.js';

function withTimeout(promise, ms = 10000) {
  let id;
  const timeout = new Promise((_, reject) => {
    id = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(id));
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setErr('');
    setLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        10000
      );
      if (error) {
        setErr(error.message || 'Erro iniciando sesión.');
        return;
      }
      route('/dashboard', true);
    } catch (e2) {
      if (e2?.message === 'timeout') {
        setErr('A conexión tardou demasiado. Téntao de novo.');
      } else {
        setErr('Erro inesperado iniciando sesión.');
        console.error(e2);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Email */}
      <div class="input-row" aria-label="Email" style={{ marginBottom: '10px' }}>
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.5" />
          <path d="M3 6l9 7 9-7" stroke="#6b7280" stroke-width="1.5" />
        </svg>
        <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onInput={(e) => setEmail(e.currentTarget.value)}
          autoComplete="username"
          required
        />
      </div>

      {/* Contrasinal */}
      <div class="input-row" aria-label="Contrasinal">
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" stroke="#6b7280" stroke-width="1.5" />
          <path d="M8 10V7a4 4 0 118 0v3" stroke="#6b7280" stroke-width="1.5" />
        </svg>
        <input
          id="password"
          type={showPwd ? 'text' : 'password'}
          placeholder="Contrasinal"
          value={password}
          onInput={(e) => setPassword(e.currentTarget.value)}
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          class="eye-btn"
          aria-label={showPwd ? 'Ocultar contrasinal' : 'Amosar contrasinal'}
          onClick={() => setShowPwd((s) => !s)}
          title={showPwd ? 'Ocultar' : 'Amosar'}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
            {showPwd ? (
              <g stroke="#6b7280" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3.2" />
              </g>
            ) : (
              <g stroke="#6b7280" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7S2 12 2 12Z" />
                <path d="M6 6l12 12" />
              </g>
            )}
          </svg>
        </button>
      </div>

      {err && <p style={{ margin: '8px 0 0', color: '#b91c1c' }}>{err}</p>}

      <div class="cta-wrap">
        <button type="submit" disabled={loading}>
          {loading ? 'Accedendo…' : 'Fillos dunha paixón, imos!!'}
        </button>
      </div>
    </form>
  );
}
