// src/components/Register.jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { supabase } from '../lib/supabaseClient.js';

export default function Register() {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const onlyDigits = (v) => v.replace(/\D/g, '');

  function validate() {
    if (!first.trim() || !last.trim()) return 'Completa nome e apelidos.';
    if (!/^\d{9,15}$/.test(phone)) return 'O teléfono debe ter entre 9 e 15 díxitos.';
    if (pwd.length < 8) return 'O contrasinal debe ter polo menos 8 caracteres.';
    if (pwd !== pwd2) return 'Os contrasinais non coinciden.';
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    const v = validate();
    if (v) { setErr(v); return; }
    setLoading(true);
    try {
      const full_name = `${first.trim()} ${last.trim()}`.trim();
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pwd,
        options: {
          data: { full_name, phone },
          emailRedirectTo: `${window.location.origin}/login?verified=true`,
        },
      });
      if (error) throw error;
      setMsg('Rexistro creado. Revisa o teu correo para confirmar a conta.');
      setFirst(''); setLast(''); setPhone(''); setEmail(''); setPwd(''); setPwd2('');
    } catch (e2) {
      console.error(e2);
      setErr(e2?.message || 'Erro ao crear a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {/* Nome */}
      <label class="sr-only" for="first">Nome</label>
      <div class="input-row" style={{ marginBottom: '10px' }}>
        {/* Icono tipo Login: “usuario” (cabeza+ombros), trazo 1.5 */}
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#6b7280" stroke-width="1.5"/>
          <path d="M4 20a8 8 0 1 1 16 0" stroke="#6b7280" stroke-width="1.5"/>
        </svg>
        <input
          id="first"
          type="text"
          placeholder="Nome"
          value={first}
          onInput={(e)=>setFirst(e.currentTarget.value)}
          required
        />
      </div>

      {/* Apelidos */}
      <label class="sr-only" for="last">Apelidos</label>
      <div class="input-row" style={{ marginBottom: '10px' }}>
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#6b7280" stroke-width="1.5"/>
          <path d="M4 20a8 8 0 1 1 16 0" stroke="#6b7280" stroke-width="1.5"/>
        </svg>
        <input
          id="last"
          type="text"
          placeholder="Apelidos"
          value={last}
          onInput={(e)=>setLast(e.currentTarget.value)}
          required
        />
      </div>

      {/* Teléfono (9–15 díxitos) */}
      <label class="sr-only" for="phone">Teléfono</label>
      <div class="input-row" style={{ marginBottom: '10px' }}>
        {/* Icono tipo Login: teléfono con trazo fino */}
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6.8 2.8l2.2 2.2a2 2 0 0 1 0 2.8l-1 1a2 2 0 0 0 0 2.8l4.4 4.4a2 2 0 0 0 2.8 0l1-1a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8l-1.2 1.2a4 4 0 0 1-4.7.6c-2.5-1.4-5.5-3.9-8.9-7.3-3.4-3.4-5.9-6.4-7.3-8.9a4 4 0 0 1 .6-4.7L4 2.2a2 2 0 0 1 2.8 0Z"
                stroke="#6b7280" stroke-width="1.3"/>
        </svg>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          pattern="\d{9,15}"
          placeholder="Teléfono (9–15)"
          value={phone}
          onInput={(e)=>setPhone(onlyDigits(e.currentTarget.value))}
          required
        />
      </div>

      {/* Email */}
      <label class="sr-only" for="email">Email</label>
      <div class="input-row" style={{ marginBottom: '10px' }}>
        {/* Icono tipo Login: carta (rectángulo + flap) */}
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.5"/>
          <path d="M3 6l9 7 9-7" stroke="#6b7280" stroke-width="1.5"/>
        </svg>
        <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onInput={(e)=>setEmail(e.currentTarget.value)}
          required
        />
      </div>

      {/* Contrasinal (sen ollo) */}
      <label class="sr-only" for="pwd">Contrasinal</label>
      <div class="input-row" style={{ marginBottom: '10px' }}>
        {/* Icono tipo Login: cadeado */}
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" stroke="#6b7280" stroke-width="1.5"/>
          <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#6b7280" stroke-width="1.5"/>
        </svg>
        <input
          id="pwd"
          type="password"
          placeholder="Contrasinal (8 caracteres mínimo)"
          value={pwd}
          onInput={(e)=>setPwd(e.currentTarget.value)}
          required
        />
      </div>

      {/* Confirmación (cadeado, sen ollo) */}
      <label class="sr-only" for="pwd2">Confirma o contrasinal</label>
      <div class="input-row">
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" stroke="#6b7280" stroke-width="1.5"/>
          <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#6b7280" stroke-width="1.5"/>
        </svg>
        <input
          id="pwd2"
          type="password"
          placeholder="Confirma o contrasinal"
          value={pwd2}
          onInput={(e)=>setPwd2(e.currentTarget.value)}
          required
        />
      </div>

      {err && <p style={{ margin: '10px 0 0', color: '#b91c1c' }}>{err}</p>}
      {msg && <p style={{ margin: '10px 0 0', color: '#065f46' }}>{msg}</p>}

      {/* Botón igual que en Login (en caxita con sombra) */}
      <div class="cta-wrap">
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando…' : 'Adiante!!, rexístrame xa!!'}
        </button>
      </div>
    </form>
  );
}


