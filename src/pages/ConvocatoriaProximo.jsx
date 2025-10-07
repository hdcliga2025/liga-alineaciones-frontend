// src/pages/ConvocatoriaProximo.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Utils ===== */
const cap = (s="") => (s || "").toUpperCase();
function fmtDT(iso){
  if(!iso) return {fecha:"-",hora:"-"};
  try{
    const d = new Date(iso);
    return {
      fecha: d.toLocaleDateString("gl-ES",{day:"2-digit",month:"2-digit",year:"numeric"}),
      hora:  d.toLocaleTimeString("gl-ES",{hour:"2-digit",minute:"2-digit"})
    };
  }catch{ return {fecha:"-",hora:"-"}; }
}
function safeDecode(s=""){ try{ return decodeURIComponent(s); }catch{ return s.replace(/%20/g," "); } }
function parseFromFilename(url=""){
  const last=(url.split("?")[0].split("#")[0].split("/").pop()||"").trim();
  const m=last.match(/^(\d+)-(.+)-(POR|DEF|CEN|DEL)\.(jpg|jpeg|png|webp)$/i);
  if(!m) return { dorsalFile:null, nameFile:null, posFile:null };
  return { dorsalFile:parseInt(m[1],10), nameFile:safeDecode(m[2].replace(/_/g," ")), posFile:m[3].toUpperCase() };
}
function finalFromAll(p={}){
  const { dorsalFile,nameFile,posFile } = parseFromFilename(p.foto_url||"");
  return {
    dorsal: dorsalFile ?? (p.dorsal ?? null),
    pos: posFile || "",
    nombre: (nameFile || p.nombre || "").trim()
  };
}

/* ===== Estilos ===== */
const S = {
  wrap: { maxWidth:1080, margin:"0 auto", padding:16 },
  h1: { fontFamily:"Montserrat,system-ui", fontSize:24, margin:"6px 0 2px", color:"#0f172a" },
  sub: { margin:"0 0 10px", color:"#475569", fontSize:16 },

  resumen: {
    margin:"0 0 10px", padding:"10px 12px", borderRadius:12,
    border:"1px solid #dbeafe",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)", color:"#0f172a",
    boxShadow:"0 6px 18px rgba(14,165,233,.16)"
  },
  resumeLine: { margin:0, fontSize:18, fontWeight:500, letterSpacing:".35px", lineHeight:1.45 },
  resumeNoteTitle: { margin:"8px 0 0", color:"#475569", fontSize:15, fontWeight:700, letterSpacing:.3 },
  resumeNoteTime: { margin:"2px 0 0", color:"#0b1220", fontSize:16, fontWeight:800, letterSpacing:1, animation:"blinkSave 2s infinite" },

  posHeader:{ margin:"14px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },

  grid:(m)=>({ display:"grid", gridTemplateColumns: m ? "repeat(3,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))", gap:m?8:12 }),

  cardWrap:(sel)=>({
    position:"relative",
    border: sel ? "2px solid #38bdf8" : "1px solid #dbeafe",
    borderRadius:16, padding:10,
    boxShadow:"0 2px 8px rgba(0,0,0,.06)",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    cursor:"pointer", userSelect:"none"
  }),

  frame:(m)=>({
    width:"100%", height: m?168:320, borderRadius:12, overflow:"hidden",
    background:"#fff", display:"grid", placeItems:"center", border:"1px solid #e5e7eb", position:"relative"
  }),
  img:{ width:"100%", height:"100%", objectFit:"contain", background:"#fff", display:"block" },

  name:(m)=>({
    margin:"8px 0 0",
    font: m ? "700 12px/1.1 Montserrat,system-ui,sans-serif" : "700 15px/1.2 Montserrat,system-ui,sans-serif",
    color:"#0f172a", textAlign:"center",
    ...(m
      ? { whiteSpace:"normal", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }
      : { whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" })
  }),
  meta:{ margin:"2px 0 0", color:"#475569", fontSize:13, textAlign:"center" },

  btnRow:{ display:"grid", gridTemplateColumns:"85% 15%", gap:8, alignItems:"stretch", marginTop:10 },
  btnPrimary:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#e7f6ff,#cfeeff)", color:"#075985", fontWeight:800,
    border:"1.5px solid #38bdf8", cursor:"pointer", boxShadow:"0 6px 16px rgba(56,189,248,.25)"
  },
  btnDanger:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"#fff", color:"#7f1d1d", fontWeight:700,
    border:"1.5px solid #ef4444", cursor:"pointer", display:"grid", placeItems:"center",
    boxShadow:"0 6px 16px rgba(239,68,68,.18)"
  },
  btnBottom:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#e7f6ff,#cfeeff)", color:"#075985", fontWeight:800,
    border:"1.5px solid #38bdf8", cursor:"pointer", marginTop:14,
    boxShadow:"0 6px 16px rgba(56,189,248,.25)"
  },

  // etiqueta CONVO adaptativa
  convoTag:(m)=>({
    position:"absolute", left:"50%", bottom:"12%", transform:"translateX(-50%)",
    fontFamily:"Montserrat,system-ui", fontWeight:900, fontSize: m?11:18,
    color:"#0c4a6e", background:"rgba(56,189,248,.58)", padding: m?"2px 6px":"4px 10px",
    borderRadius:999, letterSpacing:1.05, textShadow:"0 1px 2px rgba(0,0,0,.12)",
    userSelect:"none", pointerEvents:"none", maxWidth:"90%", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"
  })
};

const blinkStyle = `
@keyframes blinkSave{0%{color:#0ea5e9}50%{color:#000}100%{color:#0ea5e9}}
`;

export default function ConvocatoriaProximo(){
  const [isAdmin,setIsAdmin]=useState(false);
  const [players,setPlayers]=useState([]);
  const [selected,setSelected]=useState(new Set());
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState("");
  const [header,setHeader]=useState(null);
  const [lastSaved,setLastSaved]=useState(null);
  const [isMobile,setIsMobile]=useState(typeof window!=="undefined" ? window.innerWidth<=560 : false);

  useEffect(()=>{
    let raf=0;
    const onR=()=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(()=>setIsMobile(window.innerWidth<=560)); };
    window.addEventListener("resize",onR);
    return ()=>{ window.removeEventListener("resize",onR); cancelAnimationFrame(raf); };
  },[]);

  useEffect(()=>{ (async ()=>{
    // admin
    const { data:sess } = await supabase.auth.getSession();
    const uid = sess?.session?.user?.id || null;
    let admin=false;
    if(uid){
      const { data:prof } = await supabase.from("profiles").select("role,email").eq("id",uid).maybeSingle();
      admin = (prof?.role||"").toLowerCase()==="admin";
    }
    setIsAdmin(admin);

    // plantilla
    const { data:js } = await supabase.from("jugadores").select("id,nombre,dorsal,foto_url").order("dorsal",{ascending:true});
    setPlayers(js||[]);

    // header
    const { data:top } = await supabase.from("matches_vindeiros").select("equipo1,equipo2,match_iso").order("match_iso",{ascending:true}).limit(1).maybeSingle();
    if(top?.match_iso){
      setHeader({ equipo1:cap(top.equipo1||""), equipo2:cap(top.equipo2||""), match_iso:top.match_iso });
    }else{
      const { data:nm } = await supabase.from("next_match").select("equipo1,equipo2,match_iso").eq("id",1).maybeSingle();
      if(nm?.match_iso) setHeader({ equipo1:cap(nm.equipo1||""), equipo2:cap(nm.equipo2||""), match_iso:nm.match_iso });
    }

    // precarga
    const { data:pub } = await supabase.from("convocatoria_publica").select("jugador_id,updated_at");
    const prev = new Set((pub||[]).map(r=>r.jugador_id));
    if(prev.size){
      setSelected(prev);
      const last=(pub||[]).reduce((a,r)=>{ const t=r.updated_at?new Date(r.updated_at).getTime():0; return t>a?t:a; },0);
      if(last) setLastSaved(new Date(last).toISOString());
    }
  })().catch(e=>console.error("[Convocatoria] init",e)); },[]);

  const grouped = useMemo(()=>{
    const g={ POR:[], DEF:[], CEN:[], DEL:[] };
    for(const p of players||[]){
      const info = finalFromAll(p);
      if(info.pos && g[info.pos]) g[info.pos].push({ ...p, ...info });
    }
    return g;
  },[players]);

  const toggle=(id)=>{
    setSelected(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  };

  const { fecha:sFecha, hora:sHora } = fmtDT(header?.match_iso);

  async function saveAndPublish(){
    if(!isAdmin) return;
    if(!header){ setToast("Engade o seguinte encontro en Vindeiros."); setTimeout(()=>setToast(""),2000); return; }
    setSaving(true);
    try{
      const convocados=[...selected];
      await supabase.from("convocatoria_publica").delete().neq("jugador_id","00000000-0000-0000-0000-000000000000");
      if(convocados.length){
        const rows=convocados.map(jid=>({ jugador_id:jid, updated_at:new Date().toISOString() }));
        const { error } = await supabase.from("convocatoria_publica").insert(rows);
        if(error) throw error;
      }
      setLastSaved(new Date().toISOString());
      setToast(`✅ Convo gardada · ${selected.size} xogadores marcados`);
      setTimeout(()=>setToast(""),2200);
    }catch(e){
      console.error(e); setToast("Erro ao gardar"); setTimeout(()=>setToast(""),2500);
    }finally{ setSaving(false); }
  }

  function resetAll(){ setSelected(new Set()); }

  return (
    <main style={S.wrap}>
      <style>{blinkStyle}</style>
      <h1 style={S.h1}>Convocatoria oficial</h1>
      <p style={S.sub}>Lista de xogadores pre-seleccionados para xogar o partido.</p>

      {header ? (
        <div style={S.resumen}>
          <p style={S.resumeLine}>{cap(header.equipo1)} vs {cap(header.equipo2)}</p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>

          {lastSaved && (
            <>
              <p style={S.resumeNoteTitle}>Convocatoria rexistrada:</p>
              <p style={S.resumeNoteTime}>
                {new Intl.DateTimeFormat("gl-ES",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(lastSaved))}{" ás "}
                {new Intl.DateTimeFormat("gl-ES",{hour:"2-digit",minute:"2-digit"}).format(new Date(lastSaved))}
              </p>
            </>
          )}

          <div style={S.btnRow}>
            <button style={S.btnPrimary} onClick={saveAndPublish} disabled={saving}>
              {saving ? "Gardando…" : "GARDAR CONVO"}
            </button>
            <button style={S.btnDanger} onClick={resetAll} aria-label="Restaurar" title="Restaurar">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
                   style={{display:"block",fill:"none",stroke:"#ef4444",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"}}>
                <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <p style={{margin:0}}>Engade o seguinte encontro en Vindeiros para amosar a cabeceira.</p>
      )}

      {["POR","DEF","CEN","DEL"].map(k=>{
        const arr = grouped[k]||[];
        if(!arr.length) return null;
        const label = k==="POR"?"Porteiros":k==="DEF"?"Defensas":k==="CEN"?"Medios":"Dianteiros";
        return (
          <section key={k}>
            <div style={S.posHeader}>{label}</div>
            <div style={S.grid(isMobile)}>
              {arr.map(p=>{
                const sel = selected.has(p.id);
                const { dorsal, nombre, pos } = p;
                return (
                  <article key={p.id} style={S.cardWrap(sel)} onClick={()=>toggle(p.id)} title={sel?"Convocado":"Clic para convocar"}>
                    <div style={S.frame(isMobile)}>
                      {p.foto_url ? (
                        <>
                          <img src={p.foto_url} alt={`Foto de ${nombre}`} style={S.img} loading="lazy" decoding="async" />
                          {sel && <span style={S.convoTag(isMobile)}>CONVO</span>}
                        </>
                      ) : <div style={{color:"#cbd5e1"}}>Sen foto</div>}
                    </div>
                    <p style={S.name(isMobile)} title={nombre}>
                      {dorsal!=null ? `${String(dorsal).padStart(2,"0")} · ` : ""}{nombre}
                    </p>
                    <p style={S.meta}>{pos}</p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <button style={S.btnBottom} onClick={saveAndPublish} disabled={saving}>
        {saving ? "Gardando…" : "GARDAR CONVO"}
      </button>

      {toast && (
        <div role="status" aria-live="polite" style={{
          position:"fixed", bottom:18, left:"50%", transform:"translateX(-50%)",
          background:"#0ea5e9", color:"#fff", padding:"10px 16px",
          borderRadius:12, boxShadow:"0 10px 22px rgba(2,132,199,.35)", fontWeight:700
        }}>
          {toast}
        </div>
      )}
    </main>
  );
}
