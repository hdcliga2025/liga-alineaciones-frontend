// src/components/Register.jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { supabase } from '../lib/supabaseClient.js';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPwd, setShowPwd]   = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState('');
  const [err, setErr]         = useState('');

  const phoneOk = (v) => /^\d{9,15}$/.test(String(v || '').trim());

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(''); setErr('');

    if (!phoneOk(phone))   return setErr('O teléfono debe ter entre 9 e 15 díxitos.');
    if (password.length<8) return setErr('O contrasinal debe ter 8 caracteres como mínimo.');
    if (password!==password2) return setErr('Os contrasinais non coinciden.');

    setLoading(true);
    try {
      const redirect = `${window.location.origin}/login?verified=true`;
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirect,
          data: { full_name: fullName.trim(), phone: phone.trim() }
        }
      });
      if (error) return setErr(error.message || 'Produciuse un erro ao crear a conta.');
      setMsg('Enviamos un correo de verificación. Revisa a túa bandexa e segue as instrucións.');
      setFullName(''); setPhone(''); setEmail(''); setPassword(''); setPassword2('');
    } catch (e2) {
      console.error(e2);
      setErr('Erro inesperado ao crear a conta.');
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
        .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.06);max-width:560px;width:100%}
        .grid2{display:grid;grid-template-columns:1fr;gap:12px}
        @media(min-width:640px){.grid2{grid-template-columns:1fr 1fr}}
        .label{display:block;margin:6px 0 6px;font-weight:600}
        .input{width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px}
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
        .hint{margin:6px 0 0;font-size:.85rem;opacity:.7}
        .ok{margin:10px 0 0;color:green}
        .err{margin:10px 0 0;color:#b91c1c}
      `}</style>

      <div class="card">
        <form onSubmit={handleSubmit} noValidate>
          {/* Nome e teléfono seguen co seu label (sen cambios) */}
          <label for="fullName" class="label">Nome e apelidos</label>
          <input id="fullName" type="text" class="input" value={fullName}
            onInput={(e)=>setFullName(e.currentTarget.value)} required autoComplete="name" />

          <div class="grid2" style="margin-top:12px;">
            <div>
              <label for="phone" class="label">Número de teléfono móbil</label>
              <input id="phone" inputMode="numeric" class="input" value={phone}
                onInput={(e)=>setPhone(e.currentTarget.value.replace(/[^0-9]/g,''))}
                required pattern="\\d{9,15}" />
              <p class="hint">Só díxitos (9–15).</p>
            </div>

            {/* Email: con icono y placeholder (sin label) */}
            <div>
              <div class="field" aria-label="Email" style="margin-top:30px">
                <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.5"/>
                  <path d="M3 6l9 7 9-7" stroke="#6b7280" stroke-width="1.5"/>
                </svg>
                <input id="email" type="email" placeholder="Email" value={email}
                  onInput={(e)=>setEmail(e.currentTarget.value)} required autoComplete="email" />
              </div>
            </div>
          </div>

          <div class="grid2" style="margin-top:12px;">
            {/* Contrasinal: candado + ojo + placeholder (sin label) */}
            <div>
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
                  autoComplete="new-password"
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
              <p class="hint">Mínimo 8 caracteres.</p>
            </div>

            {/* Confirmación (deixamos co seu label para claridade) */}
            <div>
              <label for="password2" class="label">Confirma o contrasinal</label>
              <input
                id="password2"
                type="password"
                class="input"
                value={password2}
                onInput={(e)=>setPassword2(e.currentTarget.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {err && <p class="err">{err}</p>}
          {msg && <p class="ok">{msg}</p>}

          <button type="submit" class="cta" disabled={loading} style="margin-top:12px;">
            {loading ? 'Creando…' : 'Crear conta'}
          </button>
        </form>
      </div>
    </main>
  );
}


