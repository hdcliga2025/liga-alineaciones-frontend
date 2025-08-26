// src/pages/Notificacions.jsx
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { supabase } from '../lib/supabaseClient.js';

export default function Notificacions() {
  const [loading, setLoading] = useState(true);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);

  // Feedback
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState(null); // {ok, msg}

  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { route('/login', true); return; }
      setSessionUser(session.user);
      await fetchNotifs(session.user.id);
      setLoading(false);
    })();
  }, []);

  async function fetchNotifs(userId) {
    setNotifLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, body, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) {
      setNotifs(data || []);
      setUnread((data || []).filter(n => !n.is_read).length);
    }
    setNotifLoading(false);
  }

  async function markAllRead() {
    if (!sessionUser) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', sessionUser.id)
      .eq('is_read', false);
    if (!error) {
      const updated = notifs.map(n => ({ ...n, is_read: true }));
      setNotifs(updated);
      setUnread(0);
    }
  }

  async function sendFeedback(e) {
    e.preventDefault();
    setFeedbackResult(null);

    if (!subject.trim() || !message.trim()) {
      setFeedbackResult({ ok: false, msg: 'Asunto e mensaxe son obrigatorios.' });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: sessionUser.id,
        subject: subject.trim(),
        message: message.trim(),
      });
      if (error) throw error;
      setFeedbackResult({ ok: true, msg: 'Mensaxe enviada ao equipo. Grazas!' });
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error(err);
      setFeedbackResult({ ok: false, msg: 'Erro ao enviar a mensaxe.' });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div style="padding:16px">Cargando…</div>;
  }

  return (
    <main style="max-width:840px;margin:0 auto;padding:16px;">
      <h1 style="font-family: Montserrat, sans-serif;">Notificacións</h1>

      {/* Accións rápidas */}
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0 20px;">
        <button
          onClick={markAllRead}
          disabled={notifLoading || unread === 0}
          title="Marca todas as túas notificacións como lidas"
          style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:9999px;background:#f8fafc;cursor:pointer;"
        >
          As mensaxes foron visualizadas
        </button>

        {/* Ligazón único de contacto coas dúas contas */}
        <a
          href={`mailto:HDCLiga@gmail.com,HDCLiga2@gmail.com?subject=${encodeURIComponent('Contacto desde HDC Liga')}`}
          style="text-decoration:none;padding:8px 12px;border:1px solid #cbd5e1;border-radius:9999px;"
        >
          Mensaxe ao admin
        </a>
      </div>

      {/* Listaxe de notificacións */}
      <section style="margin-bottom:24px;">
        {notifLoading ? (
          <p>Cargando notificacións…</p>
        ) : notifs.length === 0 ? (
          <p>Non tes notificacións.</p>
        ) : (
          <ul style="list-style:none;padding:0;margin:0;display:grid;gap:10px;">
            {notifs.map(n => (
              <li key={n.id} style={`border:1px solid #e5e7eb;border-radius:12px;padding:12px;${n.is_read ? 'opacity:.8;' : ''}`}>
                <div style="display:flex;justify-content:space-between;gap:12px;">
                  <strong>{n.title || 'Aviso'}</strong>
                  <span style="font-size:.85rem;opacity:.6">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                {n.body && <p style="margin:6px 0 0;">{n.body}</p>}
                {!n.is_read && (
                  <span style="display:inline-block;margin-top:6px;font-size:.8rem;padding:2px 8px;border-radius:9999px;border:1px solid #f59e0b;">
                    Novo
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Formulario de feedback ao equipo */}
      <section style="border:1px solid #e5e7eb;border-radius:16px;padding:16px;">
        <h2 style="margin-top:0;">Enviar mensaxe ao equipo</h2>
        <form onSubmit={sendFeedback}>
          <div style="margin-bottom:12px;">
            <label htmlFor="subject" style="display:block;margin-bottom:6px;">Asunto</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onInput={(e) => setSubject(e.currentTarget.value)}
              placeholder="Ex.: Dúbida sobre o calendario"
              required
              style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;"
            />
          </div>

          <div style="margin-bottom:12px;">
            <label htmlFor="message" style="display:block;margin-bottom:6px;">Mensaxe</label>
            <textarea
              id="message"
              rows={6}
              value={message}
              onInput={(e) => setMessage(e.currentTarget.value)}
              placeholder="Escribe aquí calquera comentario que queiras facer…"
              required
              style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:10px;resize:vertical;"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            style="padding:10px 16px;border:none;border-radius:9999px;background-image:linear-gradient(180deg,#67b1ff,#5a8df5);color:#fff;font-weight:700;cursor:pointer;"
          >
            {sending ? 'Enviando…' : 'Enviar'}
          </button>

          {feedbackResult && (
            <p style={`margin-top:10px;${feedbackResult.ok ? 'color:green' : 'color:#b91c1c'}`}>
              {feedbackResult.msg}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
