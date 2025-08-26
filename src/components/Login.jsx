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
        display:flex;justify-content:center;padding:24px;background:#ffffff;
        font-family:'Montserrat',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      "
    >
      <style>{`
        html, body, #app { background:#ffffff !important; }

        #login-root { --blue:#3892ff; --h:44px; } /* mesma altura inputs e botón */

        /* Panel principal (unha soa caixa) */
        #login-root .panel{
          background:#fff;border:1px solid #e5e7eb;border-radius:16px;
          padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.06);
          max-width:760px;width:100%;
        }

        /* Márxenes laterais máis amplos para campos e botón */
        #login-root .form-wrap{ margin: 0 40px; }
        @media (max-width: 480px){ #login-root .form-wrap{ margin: 0 20px; } }

        #login-root .group{ margin:12px 0; }

        /* Campo fino e longo (alto = 44px) */
        #login-root .field{
          display:flex;align-items:center;gap:12px;
          border:1px solid #d1d5db !important; border-radius:12px !important;
          background:#fff !important; padding:6px 16px !important;
          min-height:var(--h) !important;
          transition:border-color .15s, box-shadow .15s;
        }
        #login-root .field:focus-within{
          border-color:var(--blue) !important;
          box-shadow:0 0 0 3px rgba(56,146,255,.16) !important;
        }
        #login-root .input{
          border:none !important; outline:none !important; flex:1;
          background:transparent !important; font-size:1rem; line-height:1.2;
        }
        #login-root .icon{ width:24px;height:24px;opacity:.85 }

        /* Ollo SVG co mesmo trazo */
        #login-root .eye-btn{
          width:28px;height:28px;display:grid;place-items:center;
          background:transparent;border:0;cursor:pointer;opacity:.9;
        }
        #login-root .eye-btn:hover{ opacity:1 }

        /* Botón “Imos!!” = estilo “Entra”: branco, texto azul, borde gris suave, sombra; hover invertido */
        #login-root .cta{
          width:100%; min-height:var(--h); padding:0 20px;
          border:1px solid #e6e9f0 !important;               /* SIN borde celeste */
          border-radius:12px !important;
          background:#ffffff !important; color:var(--blue) !important;
          font-weight:700; cursor:pointer;
          box-shadow:0 8px 26px rgba(0,0,0,.06);              /* sombra suave tipo tab */
          transition:background .18s,color .18s,box-shadow .18s,transform .06s;
          display:flex;align-items:center;justify-content:center;
          margin-top:12px;                                    /* centrado por width:100% */
        }
        #login-root .cta:hover{
          background:var(--blue) !important; color:#ffffff !important;
          box-shadow:0 12px 34px rgba(56,146,255,.22) !important;
        }
        #login-root .cta:active{ transform:translateY(1px) }

        #login-root .err{ margin:8px 0 0; color:#b91c1c }
      `}</style>

      <div class="panel">
        <form onSubmit={handleSubmit} noValidate class="form-wrap">
          {/* Email */}
          <div class="group">
            <div class="field" aria-label="Email">
              <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.5"/>
                <path d="M3 6l9 7 9-7" stroke="#6b7280" stroke-width="1.5"/>
              </svg>
              <input
                id="email" type="email" placeholder="Email"
                value={email} onInput={(e)=>setEmail(e.currentTarget.value)}
                autoComplete="username" required class="input"
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
                id="password" type={showPwd ? 'text' : 'password'} placeholder="Contrasinal"
                value={password} onInput={(e)=>setPassword(e.currentTarget.value)}
                autoComplete="current-password" required class="input"
              />
              <button
                type="button" class="eye-btn"
                aria-label={showPwd ? 'Ocultar contrasinal' : 'Amosar contrasinal'}
                onClick={()=>setShowPwd(s=>!s)} title={showPwd ? 'Ocultar' : 'Amosar'}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
                  {showPwd ? (
                    <g stroke="#6b7280" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7S2 12 2 12Z"/>
                      <circle cx="12" cy="12" r="3.2"/>
                    </g>
                  ) : (
                    <g stroke="#6b7280" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7S2 12 2 12Z"/>
                      <path d="M6 6l12 12"/>
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


