// src/components/Login.jsx
import { h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { supabase } from '../lib/supabaseClient.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [stuck, setStuck] = useState(false);      // <- detecta “enganchado”
  const LOGIN_TIMEOUT_MS = 10000;                 // 10s: muestra botón de reset

  // Evita mayúsculas involuntarias en móviles
  const emailNorm = useMemo(() => (email || '').trim().toLowerCase(), [email]);

  useEffect(() => {
    let t;
    if (loading) {
      setStuck(false);
      t = setTimeout(() => setStuck(true), LOGIN_TIMEOUT_MS);
    }
    return () => t && clearTimeout(t);
  }, [loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setStuck(false);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailNorm,
        password,
      });
      if (error) {
        setErr(error.message || 'Erro iniciando sesión.');
      } else {
        route('/dashboard', true);
      }
    } catch (e2) {
      console.error(e2);
      setErr('Erro inesperado iniciando sesión.');
    } finally {
      setLoading(false);
    }
  }

  // Reseteo “duro” de sesión local + signOut + recarga limpia
  async function hardResetAuth() {
    try { await supabase.auth.signOut(); } catch {}
    try {
      // Limpia claves locales de Supabase (sb-<ref>-auth-token, etc.)
      Object.keys(localStorage || {}).forEach((k) => {
        if (k.startsWith('sb-')) localStorage.removeItem(k);
      });
    } catch {}
    try { sessionStorage?.clear?.(); } catch {}
    // Si hay algún SW de por medio (en el futuro), intenta limpiar caches
    try {
      if (window.caches?.keys) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}
    // Vía rápida: usa tu ruta de logout forzado si la tienes
    try {
      location.href = '/logout?to=/login';
    } catch {
      route('/login', true);
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
          inputmode="email"
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

      {/* Botón principal */}
      <div class="cta-wrap">
        <button type="submit" disabled={loading}>
          {loading ? 'Accedendo…' : 'Fillos dunha paixón, imos!!'}
        </button>
      </div>

      {/* Suxestión/solución cando queda “Accedendo…” máis de 10s */}
      {stuck && !err && (
        <div style={{ marginTop: 10 }}>
          <p style={{ margin: '6px 0 10px', color: '#334155', fontSize: 13, lineHeight: 1.35 }}>
            Parece que a sesión quedou pendente. Podes
            <button
              type="button"
              onClick={hardResetAuth}
              style={{
                marginLeft: 6, padding: '6px 10px',
                borderRadius: 10, border: '1px solid #94a3b8',
                background: 'linear-gradient(135deg,#cbd5e1,#94a3b8)',
                color: '#0f172a', fontWeight: 700, cursor: 'pointer'
              }}
              aria-label="Restablecer sesión"
              title="Restablecer sesión"
            >
              Restablecer sesión
            </button>
            e volver tentalo.
          </p>
        </div>
      )}
    </form>
  );
}
