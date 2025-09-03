// src/components/Login.jsx
import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { supabase } from '../lib/supabaseClient.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showStuckHint, setShowStuckHint] = useState(false); // ← solo mostramos el aviso cuando procede
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  async function waitForSession(maxMs = 5000) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      const { data } = await supabase.auth.getSession();
      if (data?.session) return data.session;
      await new Promise(r => setTimeout(r, 200));
    }
    // Un intento extra: algunos móviles necesitan un refresh explícito
    try {
      const { data } = await supabase.auth.refreshSession();
      if (data?.session) return data.session;
    } catch {}
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setShowStuckHint(false);
    setLoading(true);

    // salvaguarda: si algo raro pasa, soltamos el spinner a los 8s
    timeoutRef.current = setTimeout(() => setLoading(false), 8000);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErr(error.message || 'Erro iniciando sesión.');
        setShowStuckHint(true);
        return;
      }

      // Si ya nos devolvió sesión, perfecto; si no, esperamos a que aparezca
      const sess = data?.session || (await waitForSession(6000));
      if (sess) {
        clearTimeout(timeoutRef.current);
        route('/dashboard', true);
        return;
      }

      setErr('Non se puido completar o inicio de sesión.');
      setShowStuckHint(true);
    } catch (e2) {
      console.error(e2);
      setErr('Erro inesperado iniciando sesión.');
      setShowStuckHint(true);
    } finally {
      clearTimeout(timeoutRef.current);
      setLoading(false);
    }
  }

  async function resetStuckSession() {
    try { await supabase.auth.signOut(); } catch {}
    // limpia posibles claves antigas de supabase en localStorage/sessionStorage
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
    try { sessionStorage.clear(); } catch {}
    setErr('');
    setShowStuckHint(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Email */}
      <div class="input-row" aria-label="Email" style={{ marginBottom: '10px' }}>
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6b7280" strokeWidth="1.5" />
          <path d="M3 6l9 7 9-7" stroke="#6b7280" strokeWidth="1.5" />
        </svg>
        <input
          id="email"
          name="email"
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
          <rect x="5" y="10" width="14" height="10" rx="2" stroke="#6b7280" strokeWidth="1.5" />
          <path d="M8 10V7a4 4 0 118 0v3" stroke="#6b7280" strokeWidth="1.5" />
        </svg>
        <input
          id="password"
          name="password"
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
              // Ollo aberto
              <g stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3.2" />
              </g>
            ) : (
              // Ollo riscado
              <g stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7S2 12 2 12Z" />
                <path d="M6 6l12 12" />
              </g>
            )}
          </svg>
        </button>
      </div>

      {err && <p style={{ margin: '8px 0 0', color: '#b91c1c' }}>{err}</p>}

      {/* Botón principal */}
      <div class="cta-wrap">
        <button type="submit" disabled={loading || !email || !password}>
          {loading ? 'Accedendo…' : 'Fillos dunha paixón, imos!!'}
        </button>
      </div>

      {/* Enlace de rescate: só cando falle algo */}
      {(showStuckHint || err) && (
        <p style={{ marginTop: '10px', fontSize: '.9rem', color: '#334155' }}>
          Parece que a sesión quedou pendente. Podes{' '}
          <button
            type="button"
            onClick={resetStuckSession}
            style={{ border: 'none', background: 'transparent', color: '#0284c7', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Restablecer sesión
          </button>{' '}
          e volver tentalo.
        </p>
      )}
    </form>
  );
}
