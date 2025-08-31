// src/pages/Notificacions.jsx
import { h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { supabase } from '../lib/supabaseClient.js';

export default function Notificacions() {
  const [loading, setLoading] = useState(true);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [sessionUser, setSessionUser] = useState(null);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState(null);

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
      const arr = data || [];
      setNotifs(arr);
      setUnread(arr.filter(n => !n.is_read).length);
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
      setNotifs(notifs.map(n => ({ ...n, is_read: true })));
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

  const titleBox = {
    maxWidth: 720, margin: "8px auto 12px", padding: "0 16px",
    fontFamily: "Montserrat,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
    position: "relative",
  };
  const h1 = { margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" };
  const sub = { margin: "6px 0 0", fontSize: 13, color: "#64748b" };

  const actionsRow = {
    maxWidth: 720, margin: "10px auto 18px", padding: "0 16px",
    display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
  };

  const pillBtn = {
    padding: "10px 14px",
    borderRadius: 9999,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    cursor: "pointer",
    fontWeight: 700,
    fontFamily: "Montserrat,system-ui,sans-serif",
  };
  const pillBtnPrimary = {
    ...pillBtn,
    border: "1px solid #7dd3fc",
    background: "linear-gradient(135deg,#7dd3fc,#0ea5e9)",
    color: "#fff",
    boxShadow: "0 14px 30px rgba(14,165,233,.35)",
  };
  const ghostLink = {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 9999,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontWeight: 700,
    color: "#0f172a",
  };

  const section = { maxWidth: 720, margin: "0 auto 22px", padding: "0 16px" };
  const list = { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 };

  const card = (isRead) => ({
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 12,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
    opacity: isRead ? 0.88 : 1,
  });

  const iconBox = (isRead) => ({
    alignSelf: "flex-start",
    width: 40, height: 40,
    borderRadius: 12,
    background: isRead
      ? "linear-gradient(135deg,#c7d2fe,#93c5fd)"
      : "linear-gradient(135deg,#93c5fd,#0ea5e9)",
    boxShadow: "0 12px 24px rgba(14,165,233,.35)",
    display: "grid", placeItems: "center",
  });

  const titleRow = {
    display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline",
  };

  const badgeNew = {
    display: "inline-block",
    marginTop: 6,
    fontSize: ".8rem",
    padding: "2px 8px",
    borderRadius: 9999,
    border: "1px solid #f59e0b",
    color: "#92400e",
    background: "#fffbeb",
    fontWeight: 700,
  };

  const panel = {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
  };

  const label = { display: "block", margin: "0 0 6px", fontWeight: 700, color: "#0f172a" };
  const input = {
    width: "100%", padding: "10px 12px", borderRadius: 12,
    border: "1px solid #d1d5db", outline: "none",
    fontFamily: "Montserrat,system-ui,sans-serif",
  };
  const textarea = { ...input, resize: "vertical" };

  const bellIcon = (stroke = "#fff") => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3a5 5 0 00-5 5v2.5c0 .7-.27 1.37-.75 1.87L5 14h14l-1.25-1.63A2.5 2.5 0 0117 10.5V8a5 5 0 00-5-5z" stroke={stroke} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9.5 18a2.5 2.5 0 005 0" stroke={stroke} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  );

  const dateFmt = useMemo(() => ({ dateStyle: "short", timeStyle: "short" }), []);

  if (loading) return <div style="padding:16px">Cargando…</div>;

  return (
    <main style={{ paddingBottom: 28, background:"#fff" }}>
      <header style={titleBox}>
        <h1 style={h1}>Notificacións</h1>
        <p style={sub}>Centro de avisos da peña. {unread > 0 ? `Tes ${unread} sen ler.` : 'Todo ao día.'}</p>

        {/* Logo máis grande, á dereita e un pouco máis abaixo */}
        <img
          src="/logoHDC.jpg"
          alt="HDC"
          decoding="async"
          loading="eager"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 128,
            height: "auto",
            userSelect: "none",
            pointerEvents: "none",
            background:"#fff",
            borderRadius: 8,
            filter: "drop-shadow(0 6px 22px rgba(0,0,0,.08))"
          }}
        />
      </header>

      {/* Accións rápidas */}
      <div style={actionsRow}>
        <button
          onClick={markAllRead}
          disabled={notifLoading || unread === 0}
          title="Marcar todas como lidas"
          style={notifLoading || unread === 0 ? { ...pillBtnPrimary, opacity: .6, cursor: "not-allowed" } : pillBtnPrimary}
        >
          As mensaxes foron visualizadas
        </button>

        <a
          href={`mailto:HDCLiga@gmail.com,HDCLiga2@gmail.com?subject=${encodeURIComponent('Contacto desde HDC Liga')}`}
          style={ghostLink}
        >
          Mensaxe ao admin
        </a>
      </div>

      {/* Listaxe de notificacións */}
      <section style={section} aria-live="polite">
        {notifLoading ? (
          <div style={panel}>Cargando notificacións…</div>
        ) : notifs.length === 0 ? (
          <div style={panel}>Non tes notificacións.</div>
        ) : (
          <ul style={list}>
            {notifs.map((n) => (
              <li key={n.id} style={card(n.is_read)}>
                <div style={iconBox(n.is_read)} aria-hidden="true">{bellIcon()}</div>
                <div>
                  <div style={titleRow}>
                    <strong style={{ fontFamily: "Montserrat,system-ui,sans-serif", fontSize: 16 }}>
                      {n.title || 'Aviso'}
                    </strong>
                    <span style={{ fontSize: ".85rem", opacity: .65 }}>
                      {new Date(n.created_at).toLocaleString('gl-ES', dateFmt)}
                    </span>
                  </div>
                  {n.body && <p style={{ margin: "6px 0 0", color: "#0f172a" }}>{n.body}</p>}
                  {!n.is_read && (
                    <span style={{
                      display:"inline-block",marginTop:6,fontSize:".8rem",
                      padding:"2px 8px",borderRadius:9999,border:"1px solid #f59e0b",
                      color:"#92400e",background:"#fffbeb",fontWeight:700
                    }}>
                      Novo
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Formulario de feedback */}
      <section style={section}>
        <div style={panel}>
          <h2 style={{ marginTop: 0, fontFamily: "Montserrat,system-ui,sans-serif", fontSize: 18 }}>
            Enviar mensaxe ao equipo
          </h2>
          <form onSubmit={sendFeedback}>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="subject" style={label}>Asunto</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onInput={(e) => setSubject(e.currentTarget.value)}
                placeholder="Ex.: Dúbida sobre o calendario"
                required
                style={input}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label htmlFor="message" style={label}>Mensaxe</label>
              <textarea
                id="message"
                rows={6}
                value={message}
                onInput={(e) => setMessage(e.currentTarget.value)}
                placeholder="Escribe aquí calquera comentario que queiras facer…"
                required
                style={textarea}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              style={{
                padding: "12px 18px",
                border: "1px solid #7dd3fc",
                borderRadius: 12,
                background: "linear-gradient(135deg,#7dd3fc,#0ea5e9)",
                color: "#fff",
                fontWeight: 800,
                fontFamily: "Montserrat,system-ui,sans-serif",
                cursor: sending ? "not-allowed" : "pointer",
                boxShadow: "0 18px 42px rgba(14,165,233,.35)",
              }}
            >
              {sending ? 'Enviando…' : 'Enviar'}
            </button>

            {feedbackResult && (
              <p style={{
                marginTop: 10,
                color: feedbackResult.ok ? '#065f46' : '#b91c1c',
                fontFamily: "Montserrat,system-ui,sans-serif",
              }}>
                {feedbackResult.msg}
              </p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
