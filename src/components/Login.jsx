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
        display:flex;justify-content:center;padding:24px;
        background:#ffffff; /* fondo totalmente branco */
        font-family:'Montserrat',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      "
    >
      <style>{`
        .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.06);max-width:420px;width:100%}
        .group{margin:10px 0}
        .field{display:flex;align-items:center;gap:8px;border:1px solid #d1d5db;border-radius:12px;padding:10px 12px;background:#fff}
        .field input{border:none;outline:none;flex:1;font-family:inherit;font-size:1rem}
        .icon{width:18px;height:18px;opacity:.75}
        .eye{cursor:pointer;opacity:.7}
        .eye:hover{opacity:1}
        .cta{
          width:100%;padding:12px 16px;border:1px solid #90c2ff;border-radius:12px;
          background:#ffffff;color:#3892ff;font-weight:700;cursor:pointer;
          box-shadow:0 6px 18px rgba(56,146,255,0.12);
          transition:background .18s,color .18s,box-shadow .18s,transform .06s;
          margin-top:8px;
        }
        .cta:hover{background:#3892ff;color:#fff;box-shadow:0 8px 22px rgba(56,146,255,0.22)}
        .cta:active{transform:translateY(1px)}
        .err{margin:8px 0 0;color:#b91c1c}
      `}</style>

      <div class="card">
        <form onSubmit={handleSubmit} noValidate>
          {/* Email: icono y placeholder (sin label) */}
          <div class="group">
            <div class="field" aria-label="Email">
              <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.5"/>
                <path d="M3 6l9 7 9-7" stroke="#6b7280" stroke-width="1.5"/>
              </svg>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onInput={(e)=>setEmail(e.currentTarget.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Contrasinal: candado + ojo + placeholder (sin label) */}
          <div class="group">
            <div class="field" aria-label="Contrasinal">
              <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="#6b7280" stroke-width="1.5"/>
                <path d="M8 10V7a4 4 0 118 0v3" stroke="#6b7280" stroke-width="1.5"/>
              </svg>
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Contrasinal"
                value={password}
                onInput={(e)=>setPassword(e.currentTarget.value)}
                autoComplete="current-password"
                required
              />
              <svg
                class="icon eye"
                onClick={()=>setShowPwd(s=>!s)}
                viewBox="0 0 24 24" fill="none" aria-label="Mostrar/ocultar contrasinal" role="button"
              >
                {showPwd
                  ? <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 100-6 3 3 0 000 6z" stroke="#6b7280" stroke-width="1.5"/>
                  : <>
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" stroke="#6b7280" stroke-width="1.5"/>
                      <path d="M15 9l-6 6" stroke="#6b7280" stroke-width="1.5"/>
                    </>
                }
              </svg>
            </div>
          </div>

          {err && <p class="err">{err}</p>}

          <button type="submit" class="cta" disabled={loading}>
            {loading ? 'Accedendo…' : 'Imos!!'}
          </button>
        </form>
      </div>
    </main>
  );
}

