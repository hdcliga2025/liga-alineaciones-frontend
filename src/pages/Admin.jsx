// src/pages/Admin.jsx
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { supabase } from '../lib/supabaseClient.js';

export default function Admin() {
  const [me, setMe] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // formulario
  const [emailTarget, setEmailTarget] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { route('/login', true); return; }
      setMe(session.user);

      // comprobar rol admin
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error || !data || data.role !== 'admin') {
        route('/dashboard', true);
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    })();
  }, []);

  async function sendOne(e) {
    e.preventDefault();
    setMsg('');
    if (!emailTarget.trim() || !title.trim() || !body.trim()) {
      setMsg('Completa correo, título e corpo.');
      return;
    }
    setSending(true);
    try {
      // buscar id do destinatario
      const { data: u, error: e1 } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', emailTarget.trim())
        .maybeSingle();
      if (e1 || !u?.id) throw new Error('Usuaria/o non atopada');

      const payload = { user_id: u.id, title: title.trim(), body: body.trim() };
      const { error: e2 } = await supabase.from('notifications').insert(payload);
      if (e2) throw e2;

      setMsg('Enviada.');
      setTitle(''); setBody(''); setEmailTarget('');
    } catch (err) {
      console.error(err);
      setMsg('Erro enviando a notificación.');
    } finally {
      setSending(false);
    }
  }

  async function sendAll(e) {
    e.preventDefault();
    setMsg('');
    if (!title.trim() || !body.trim()) {
      setMsg('Completa título e corpo.');
      return;
    }
    setSending(true);
    try {
      // obter todas/os destinatarias/os
      const { data: recips, error: e0 } = await supabase
        .from('profiles')
        .select('id');
      if (e0) throw e0;

      const rows = (recips || []).map(r => ({
        user_id: r.id,
        title: title.trim(),
        body: body.trim()
      }));
      if (rows.length === 0) throw new Error('Sen destinatarias/os');

      const { error: e2 } = await supabase.from('notifications').insert(rows);
      if (e2) throw e2;

      setMsg(`Enviadas ${rows.length} notificacións.`);
      setTitle(''); setBody('');
    } catch (err) {
      console.error(err);
      setMsg('Erro enviando a todos/as.');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <main style="padding:16px">Cargando…</main>;
  if (!isAdmin) return null;

  return (
    <main style="max-width:840px;margin:0 auto;padding:16px;font-family:'Montserrat',sans-serif;">
      <h1>Panel de administración</h1>

      <section style="border:1px solid #e5e7eb;border-radius:16px;padding:16px;margin-bottom:16px;">
        <h2 style="margin-top:0;">Enviar notificación a unha persoa</h2>
        <form onSubmit={sendOne}>
          <div style="margin-bottom:10px;">
            <label htmlFor="emailTarget" style="display:block;margin-bottom:6px;">Correo</label>
            <input id="emailTarget" type="email" value={emailTarget}
              onInput={(e)=>setEmailTarget(e.currentTarget.value)}
              style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;" />
          </div>
          <div style="margin-bottom:10px;">
            <label htmlFor="title1" style="display:block;margin-bottom:6px;">Título</label>
            <input id="title1" value={title} onInput={(e)=>setTitle(e.currentTarget.value)}
              style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;" />
          </div>
          <div style="margin-bottom:10px;">
            <label htmlFor="body1" style="display:block;margin-bottom:6px;">Corpo</label>
            <textarea id="body1" rows={5} value={body} onInput={(e)=>setBody(e.currentTarget.value)}
              style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;resize:vertical;" />
          </div>
          <button type="submit" disabled={sending}
            style="padding:10px 16px;border:none;border-radius:9999px;background-image:linear-gradient(180deg,#67b1ff,#5a8df5);color:#fff;font-weight:700;cursor:pointer;">
            {sending ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      </section>

      <section style="border:1px solid #e5e7eb;border-radius:16px;padding:16px;">
        <h2 style="margin-top:0;">Enviar notificación a todas as persoas</h2>
        <form onSubmit={sendAll}>
          <div style="margin-bottom:10px;">
            <label htmlFor="title2" style="display:block;margin-bottom:6px;">Título</label>
            <input id="title2" value={title} onInput={(e)=>setTitle(e.currentTarget.value)}
              style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;" />
          </div>
          <div style="margin-bottom:10px;">
            <label htmlFor="body2" style="display:block;margin-bottom:6px;">Corpo</label>
            <textarea id="body2" rows={5} value={body} onInput={(e)=>setBody(e.currentTarget.value)}
              style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;resize:vertical;" />
          </div>
          <button type="submit" disabled={sending}
            style="padding:10px 16px;border:none;border-radius:9999px;background-image:linear-gradient(180deg,#67b1ff,#5a8df5);color:#fff;font-weight:700;cursor:pointer;">
            {sending ? 'Enviando…' : 'Enviar a todas'}
          </button>
        </form>
      </section>

      {msg && <p style="margin-top:12px;">{msg}</p>}
    </main>
  );
}
