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
      if (error) return setErr(error.message || 'Erro iniciando sesión.');
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
      id="login-root"
      style="
        display:flex;justify-content:center;padding:24px;
        background:#ffffff;
        font-family:'Montserrat',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      "
    >
      <style>{`
        /* Fondo branco garantido */
        html, body, #app { background:#ffffff !important; }

        #login-root { --primary:#3892ff; --primary-600:#2f7fe6; }

        /* Card máis ancha para alongar campos */
        #login-root .card{
          background:#fff;border:1px solid #e5e7eb;border-radius:16px;
          padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.06);
          max-width:720px;width:100%;
        }

        #login-root .group{ margin:12px 0; }

        /* Campos: menos altos e máis longos */
        #login-root .field{
          display:flex;align-items:center;gap:12px;
          border:1px solid #d1d5db;border-radius:14px;
          padding:6px 16px; background:#fff; min-height:40px;
          transition:border-color .15s ease, box-shadow .15s ease;
        }
        #login-root .field:focus-within{
          border-color:var(--primary);
          box-shadow:0 0 0 3px rgba(56,146,255,.15);
        }
        #login-root .field input{
          border:none;outline:none;flex:1;background:transparent;
          font-family:inherit;font-size:1rem;line-height:1.2;
        }
        #login-root .icon{ width:24px;height:24px;opacity:.85 }

        /* Botón-ollo (SVG, non emoji) */
        #login-root .eye-btn{
          background:transparent;border:0;cursor:pointer;padding:0;margin:0;
          width:28px;height:28px;display:grid;place-items:center;opacity:.85;
        }
        #login-root .eye-btn:hover{ opacity:1 }

        /* Botón “Imos!!” como o tab “Entra”, con inversión no hover, menos redondeo */
        #login-root .cta{
          width:100%; padding:12px 20px;
          border:1px solid var(--primary) !important;
          border-radius:12px;                          /* menos pill */
          background:#ffffff; color:var(--primary);
          font-weight:700; cursor:pointer;
          box-shadow:0 10px 30px rgba(56,146,255,0.12); /* sombrita elegante */
          transition:background .18s,color .18s,box-shadow .18s,transform .06s;
          margin-top:12px;
        }
        #login-root .cta:hover{
          background:var(--primary); color:#ffffff;
          box-shadow:0 12px 34px rgba(56,146,255,0.22);
        }
        #login-root .cta:active{ transform:translateY(1px) }

        #login-root .err{ margin:8px 0 0; color:#b91c1c }
      `}</style>

      <div class="card">
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
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

          {/* Contrasinal */}
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
              <button
                type="button"
                class="eye-btn"
                aria-label={showPwd ? 'Ocultar contrasinal' : 'Amosar contrasinal'}
                title={showPwd ? 'Ocultar' : 'Amosar'}
                onClick={()=>setShowPwd(s=>!s)}
              >
                {/* Ollo en SVG (claro e nítido) */}
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
                  {showPwd ? (
                    <g stroke="#6b7280" stroke-width="1.6">
                      <path d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7S2 12 2 12Z"/>
                      <circle cx="12" cy="12" r="3.2" />
                    </g>
                  ) : (
                    <g stroke="#6b7280" stroke-width="1.6">
                      <path d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7S2 12 2 12Z"/>
                      <path d="M16 8l-8 8" />
                    </g>
                  )}
                </svg>
              </button>
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

