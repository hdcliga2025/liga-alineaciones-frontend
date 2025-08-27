// src/pages/Mensaxes.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

export default function Mensaxes() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);

  const ADMIN_MAILS = ["HDCLiga@gmail.com", "HDCLiga2@gmail.com"];
  const mailto = `mailto:${ADMIN_MAILS.join(",")}?subject=${encodeURIComponent(
    "[HDC Liga] Mensaxe dende a web"
  )}`;

  async function submit(e) {
    e.preventDefault();
    setStatus("loading");
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) { setStatus("err"); return; }

    const { error } = await supabase.from("feedback").insert({
      user_id: uid,
      subject: subject?.trim() || "(Sen asunto)",
      message: message?.trim() || "",
      created_at: new Date().toISOString()
    });

    if (error) setStatus("err");
    else { setStatus("ok"); setSubject(""); setMessage(""); }
  }

  return (
    <main style={{maxWidth: 760, margin:"0 auto", padding:"14px 16px"}}>
      <h1 style={{fontWeight:800, fontSize:24, margin:"8px 0 10px"}}>Mensaxes</h1>

      <div style={{
        display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom:14
      }}>
        <a href={mailto}
           style={{
             padding:"10px 14px", borderRadius:12, border:"1px solid #e5e7eb",
             background:"#fff", color:"#0ea5e9", fontWeight:700, textDecoration:"none",
             boxShadow:"0 2px 8px rgba(0,0,0,.06)"
           }}>
          Mensaxe a Admin
        </a>
        <span style={{fontSize:13, color:"#64748b"}}>
          (Abrirá o teu cliente de correo a <strong>{ADMIN_MAILS.join(", ")}</strong>)
        </span>
      </div>

      <form onSubmit={submit}
            style={{
              border:"1px solid #e5e7eb", borderRadius:14, padding:14,
              background:"#fff", boxShadow:"0 2px 10px rgba(0,0,0,.06)"
            }}>
        <label style={{display:"block", fontWeight:600, marginBottom:6}}>Asunto</label>
        <input
          type="text" value={subject} onInput={e=>setSubject(e.currentTarget.value)}
          placeholder="Escribe o asunto…" required
          style={{
            width:"100%", padding:"12px 14px", border:"1px solid #e5e7eb",
            borderRadius:10, marginBottom:10, fontFamily:"inherit"
          }}
        />
        <label style={{display:"block", fontWeight:600, marginBottom:6}}>Mensaxe</label>
        <textarea
          value={message} onInput={e=>setMessage(e.currentTarget.value)}
          placeholder="Escribe aquí o que queiras comentar…" rows={6} required
          style={{
            width:"100%", padding:"12px 14px", border:"1px solid #e5e7eb",
            borderRadius:10, marginBottom:12, fontFamily:"inherit", resize:"vertical"
          }}
        />
        <button type="submit"
          style={{
            width:"100%", padding:"12px", border:"1px solid #e5e7eb",
            borderRadius:12, background:"#fff", color:"#0ea5e9",
            fontWeight:800, boxShadow:"0 2px 10px rgba(0,0,0,.08)", cursor:"pointer"
          }}>
          Enviar
        </button>
        {status==="ok" && (
          <p style={{color:"#16a34a", marginTop:10}}>
            ✅ Mensaxe gardada. Recibiredes resposta canto antes.
          </p>
        )}
        {status==="err" && (
          <p style={{color:"#ef4444", marginTop:10}}>
            ❌ Produciuse un erro ao gardar a mensaxe.
          </p>
        )}
      </form>
    </main>
  );
}
