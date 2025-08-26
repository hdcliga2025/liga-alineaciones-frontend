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
        background:#ffffff; /* fondo branco nesta vista */
        font-family:'Montserrat',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      "
    >
      {/* forza fondo branco global cando se carga rexistro */}
      <style>{`html, body, #app { background:#ffffff !important; }`}</style>

      {/* --- aquí mantemos o teu formulario existente --- */}
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.06);max-width:560px;width:100%;">
        <form onSubmit={handleSubmit} noValidate>
          <label for="fullName" style="display:block;margin:6px 0 6px;font-weight:600;">Nome e apelidos</label>
          <input id="fullName" type="text" value={fullName}
                 onInput={(e)=>setFullName(e.currentTarget.value)} required
                 style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;" />

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
            <div>
              <label for="phone" style="display:block;margin:6px 0 6px;font-weight:600;">Número de teléfono móbil</label>
              <input id="phone" inputMode="numeric" value={phone}
                     onInput={(e)=>setPhone(e.currentTarget.value.replace(/[^0-9]/g,''))}
                     required pattern="\\d{9,15}"
                     style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;" />
              <p style="margin:6px 0 0;font-size:.85rem;opacity:.7;">Só díxitos (9–15).</p>
            </div>
            <div>
              <label for="email" style="display:block;margin:6px 0 6px;font-weight:600;">Correo electrónico</label>
              <input id="email" type="email" value={email}
                     onInput={(e)=>setEmail(e.currentTarget.value)} required autoComplete="email"
                     style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;" />
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
            <div>
              <label for="password" style="display:block;margin:6px 0 6px;font-weight:600;">Contrasinal</label>
              <div style="display:flex;align-items:center;gap:10px;border:1px solid #d1d5db;border-radius:12px;padding:8px 14px;background:#fff;">
                <input id="password" type={showPwd ? 'text':'password'} value={password}
                       onInput={(e)=>setPassword(e.currentTarget.value)} required autoComplete="new-password"
                       style="border:none;outline:none;flex:1;font-family:inherit;font-size:1rem" />
                <button type="button" onClick={()=>setShowPwd(s=>!s)} aria-label="Mostrar/ocultar contrasinal"
                        style="background:transparent;border:0;cursor:pointer;opacity:.75;">
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              <p style="margin:6px 0 0;font-size:.85rem;opacity:.7;">Mínimo 8 caracteres.</p>
            </div>
            <div>
              <label for="password2" style="display:block;margin:6px 0 6px;font-weight:600;">Confirma o contrasinal</label>
              <input id="password2" type="password" value={password2}
                     onInput={(e)=>setPassword2(e.currentTarget.value)} required autoComplete="new-password"
                     style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;" />
            </div>
          </div>

          {err && <p style="margin:10px 0 0;color:#b91c1c;">{err}</p>}
          {msg && <p style="margin:10px 0 0;color:green;">{msg}</p>}

          <button type="submit"
                  style="width:100%;padding:12px 18px;border:1px solid #90c2ff;border-radius:9999px;
                         background:#ffffff;color:#3892ff;font-weight:700;cursor:pointer;
                         box-shadow:0 6px 18px rgba(56,146,255,0.12);
                         transition:background .18s,color .18s,box-shadow .18s,transform .06s;margin-top:12px;"
                  onMouseOver={(e)=>{e.currentTarget.style.background='#3892ff';e.currentTarget.style.color='#fff'}}
                  onMouseOut={(e)=>{e.currentTarget.style.background='#fff';e.currentTarget.style.color='#3892ff'}}>
            Crear conta
          </button>
        </form>
      </div>
    </main>
  );
}


