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
    // Acepta 9–15 díxitos (lógica), aínda que non se mostra na UI
    if (!/^\d{9,15}$/.test(phone)) return 'O móbil debe ter entre 9 e 15 díxitos.';
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
      <div class="input-row" style={{ marginBottom: '10px' }}>
        {/* Icono estilo Login: usuario */}
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
          aria-label="Nome"
        />
      </div>

      {/* Apelidos (dous monicreques) */}
      <div class="input-row" style={{ marginBottom: '10px' }}>
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {/* cabeza/ombreiros esquerda */}
          <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="#6b7280" stroke-width="1.5"/>
          <path d="M3 20a6 6 0 0 1 12 0" stroke="#6b7280" stroke-width="1.5"/>
          {/* cabeza/ombreiros dereita */}
          <path d="M16 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="#6b7280" stroke-width="1.5"/>
          <path d="M13 20a5 5 0 0 1 8 0" stroke="#6b7280" stroke-width="1.5"/>
        </svg>
        <input
          id="last"
          type="text"
          placeholder="Apelidos"
          value={last}
          onInput={(e)=>setLast(e.currentTarget.value)}
          required
          aria-label="Apelidos"
        />
      </div>

      {/* Móbil (icono smartphone moderno, sen texto 9–15) */}
      <div class="input-row" style={{ marginBottom: '10px' }}>
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="#6b7280" stroke-width="1.5"/>
          <path d="M11 5.2h2" stroke="#6b7280" stroke-width="1.5" />
          <circle cx="12" cy="18.5" r="1" fill="#6b7280"/>
        </svg>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          pattern="\d{9,15}"
          placeholder="Móbil"
          value={phone}
          onInput={(e)=>setPhone(onlyDigits(e.currentTarget.value))}
          required
          aria-label="Móbil"
        />
      </div>

      {/* Email */}
      <div class="input-row" style={{ marginBottom: '10px' }}>
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
          aria-label="Email"
        />
      </div>

      {/* Contrasinal (sen palabra, só “(8 caracteres mínimo)”) */}
      <div class="input-row" style={{ marginBottom: '10px' }}>
        <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" stroke="#6b7280" stroke-width="1.5"/>
          <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#6b7280" stroke-width="1.5"/>
        </svg>
        <input
          id="pwd"
          type="password"
          placeholder="(8 caracteres mínimo)"
          value={pwd}
          onInput={(e)=>setPwd(e.currentTarget.value)}
          required
          aria-label="Contrasinal"
        />
      </div>

      {/* Confirmación */}
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
          aria-label="Confirma o contrasinal"
        />
      </div>

      {/* Mensaxes (só aparecen se hai algo que dicir) */}
      {err && <p style={{ margin: '10px 0 0', color: '#b91c1c' }}>{err}</p>}
      {msg && <p style={{ margin: '10px 0 0', color: '#065f46' }}>{msg}</p>}

      {/* Botón igual a Login, dentro da caixa con sombra */}
      <div class="cta-wrap">
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando…' : 'Adiante!!, rexístrame xa!!'}
        </button>
      </div>
    </form>
  );
}


