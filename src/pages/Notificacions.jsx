// src/pages/Notificacions.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

export default function Notificacions() {
  const [items, setItems] = useState([]);
  const [compose, setCompose] = useState({ subject: "", message: "" });
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) return;
      await load(uid);
    })();
  }, []);

  const load = async (uid) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setItems(data || []);
  };

  const markRead = async (id, uid) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", uid);
    await load(uid);
  };

  const markAll = async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", uid).eq("is_read", false);
    await load(uid);
  };

  const sendToAdmins = async (e) => {
    e.preventDefault();
    setInfo(""); setErr("");
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return;
    if (!compose.subject.trim() || !compose.message.trim()) {
      setErr("As mensaxes deben ter asunto e corpo.");
      return;
    }
    const { error } = await supabase
      .from("feedback")
      .insert({ user_id: uid, subject: compose.subject.trim(), message: compose.message.trim() });
    if (error) setErr(error.message);
    else {
      setInfo("Mensaxe enviada ao equipo.");
      setCompose({ subject: "", message: "" });
    }
  };

  const box = { maxWidth: 720, margin: "28px auto", padding: "0 16px" };
  const card = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, marginBottom: 10, background:"#fff" };
  const btn = { padding: "8px 12px", borderRadius: 12, border: "1px solid #0ea5e9", background:"#fff", cursor:"pointer", marginRight:8 };
  const primary = { ...btn, background: "linear-gradient(135deg,#93c5fd,#60a5fa)", color: "#fff", borderColor:"#0ea5e9" };

  return (
    <main style={box}>
      <h2 style={{ marginBottom: 10 }}>Notificacións</h2>
      <div style={{ marginBottom: 10 }}>
        <button style={btn} onClick={markAll}>Marcar todo como lido</button>
        <a href="mailto:HDCLiga@gmail.com" style={{ marginRight:8 }}>Escribir a HDCLiga@gmail.com</a>
        <a href="mailto:HDCLiga2@gmail.com">Escribir a HDCLiga2@gmail.com</a>
      </div>

      {items.map(n => (
        <div key={n.id} style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <strong>{n.title || "Aviso"}</strong>
            {!n.is_read && <span style={{ fontSize:12, color:"#ef4444" }}>novo</span>}
          </div>
          <p style={{ margin:"6px 0 10px" }}>{n.body}</p>
          {!n.is_read && (
            <button
              style={primary}
              onClick={async ()=>{
                const { data: u } = await supabase.auth.getUser();
                markRead(n.id, u?.user?.id);
              }}
            >
              Marcar como lido
            </button>
          )}
        </div>
      ))}

      <h3 style={{ marginTop: 22 }}>Enviar mensaxe ao equipo</h3>
      <form onSubmit={sendToAdmins} style={{ display:"grid", gap:8 }}>
        <input
          type="text" value={compose.subject}
          onInput={(e)=>setCompose(c=>({...c, subject:e.currentTarget.value}))}
          style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:"10px 12px" }}
        />
        <textarea
          rows={5} value={compose.message}
          onInput={(e)=>setCompose(c=>({...c, message:e.currentTarget.value}))}
          style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:"10px 12px" }}
        />
        <button type="submit" style={primary}>Enviar</button>
      </form>

      {info && <p style={{ color:"#065f46", marginTop:10 }}>{info}</p>}
      {err && <p style={{ color:"#b91c1c", marginTop:10 }}>{err}</p>}
    </main>
  );
}
