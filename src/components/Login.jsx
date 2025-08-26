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
        /* Forzamos fondo branco nesta vista */
        html, body, #app { background:#ffffff !important; }

        #login-root { --primary:#3892ff; --primary-700:#2a78d6; }

        /* Tarxeta algo máis ancha para que os campos se vexan longos */
        #login-root .card{
          background:#fff;border:1px solid #e5e7eb;border-radius:16px;
          padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.06);
          max-width:680px;width:100%;
        }

        #login-root .group{ margin:10px 0; }

        /* Campos: menos altos (padding vertical 6), máis longos (depende do ancho da card) */
        #login-root .field{
          display:flex;align-items:center;gap:10px;
          border:1px solid #d1d5db;border-radius:14px;
          padding:6px 14px; background:#fff; min-height:44px;
        }
        #login-root .field:focus-within{
          border-color:var(--primary);
          box-shadow:0 0 0 3px rgba(56,146,255,.15);
        }
        #login-root .field input{
          border:none;outline:none;flex:1;
          font-family:inherit;font-size:1rem; background:transparent;
        }

        /* Iconas un chisco máis grandes */
        #login-root .icon{ width:24px;height:24px;opacity:.82 }
        #login-root .eye{ cursor:pointer; opacity:.8 }
        #login-root .eye:hover{ opacity:1 }

        /* Botón estilo tab “Entra”: pill branco + celeste; invértese no hover */
        #login-root .cta{
          width:100%; padding:12px 20px; border:1px solid var(--primary);
          border-radius:9999px; background:#ffffff; color:var(--primary);
          font-weight:700; cursor:pointer;
          box-shadow:0 6px 18px rgba(56,146,255,0.14);
          transition:background .18s,color .18s,box-shadow .18s,transform .06s;
          margin-top:12px;
        }
        #login-root .cta:hover{
          background:var(--primary); color:#ffffff;
          box-shadow:0 8px 22px rgba(56,146,255,0.24);
        }
        #login-root .cta:active{ transform:translateY(1px) }

        #login-root .err{ margin:8px 0 0; color:#b91c1c }
      `}</style>

      <div class="card">
        <form onSubmit={handleSubmit} noValidate>
          {/* Email: icona + placeholder (sen label) */}
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

          {/* Contrasinal: candado + ollo + placeholder (sen label) */}
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

