// src/components/Login.jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { supabase } from '../lib/supabaseClient.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [btnHover, setBtnHover] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
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

  const cardStyle = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,.06)',
    maxWidth: '720px',             // MÁS LARGO
    width: '100%',
  };

  const fieldStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '14px',
    padding: '6px 16px',           // MENOS ALTO
    minHeight: '40px',             // MENOS ALTO
    background: '#fff',
  };

  const inputStyle = {
    border: 'none',
    outline: 'none',
    flex: 1,
    fontFamily: 'Montserrat, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    fontSize: '1rem',
    background: 'transparent',
    lineHeight: 1.2,
  };

  const iconSize = { width: 24, height: 24, opacity: 0.85 }; // ICONOS 24px

  const btnStyle = {
    width: '100%',
    padding: '12px 20px',
    border: '1px solid #3892ff',
    borderRadius: '12px',          // MENOS REDONDEADO (como tab)
    background: btnHover ? '#3892ff' : '#ffffff',
    color: btnHover ? '#ffffff' : '#3892ff',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: btnHover
      ? '0 12px 34px rgba(56,146,255,0.22)'
      : '0 10px 30px rgba(56,146,255,0.12)',  // SOMBRA ELEGANTE como “Entra”
    transition: 'all .18s ease',
    marginTop: '12px',
  };

  return (
    <main
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '24px',
        background: '#ffffff',
        fontFamily:
          'Montserrat, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }}
    >
      <div style={cardStyle}>
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ margin: '12px 0' }}>
            <div style={fieldStyle} aria-label="Email">
              {/* Sobre 24px */}
              <svg viewBox="0 0 24 24" style={iconSize} fill="none" aria-hidden="true">
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
                style={inputStyle}
              />
            </div>
          </div>

          {/* Contrasinal */}
          <div style={{ margin: '12px 0' }}>
            <div style={fieldStyle} aria-label="Contrasinal">
              {/* Candado 24px */}
              <svg viewBox="0 0 24 24" style={iconSize} fill="none" aria-hidden="true">
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
                style={inputStyle}
              />
              {/* Ojo igual que en Rexistro (emoji), claro y funcional */}
              <button
                type="button"
                aria-label={showPwd ? 'Ocultar contrasinal' : 'Amosar contrasinal'}
                title={showPwd ? 'Ocultar' : 'Amosar'}
                onClick={() => setShowPwd((s) => !s)}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                  opacity: 0.9,
                }}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {err && (
            <p style={{ margin: '8px 0 0', color: '#b91c1c' }}>
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={btnStyle}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            {loading ? 'Accedendo…' : 'Imos!!'}
          </button>
        </form>
      </div>
    </main>
  );
}

