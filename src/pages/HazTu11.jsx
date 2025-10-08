// src/pages/HazTu11.jsx
import { h } from "preact";
import { useEffect, useMemo, useState, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* Utils compartidos */
function safeDecode(s = "") { try { return decodeURIComponent(s); } catch { return s.replace(/%20/g, " "); } }
function parseFromFilename(url = "") {
  const last = (url.split("?")[0].split("#")[0].split("/").pop() || "").trim();
  const m = last.match(/^(\d+)-(.+)-(POR|DEF|CEN|DEL)\.(jpg|jpeg|png|webp)$/i);
  if (!m) return { dorsalFile: null, nameFile: null, posFile: null };
  return { dorsalFile: parseInt(m[1],10), nameFile: safeDecode(m[2].replace(/_/g," ")), posFile: m[3].toUpperCase() };
}
function finalFromAll(p = {}) {
  const { dorsalFile, nameFile, posFile } = parseFromFilename(p.foto_url || "");
  return {
    dorsal: dorsalFile ?? (p.dorsal ?? null),
    pos:    (posFile || "").toUpperCase(),
    nombre: (nameFile || p.nombre || "").trim()
  };
}
const cap = (s="") => (s || "").toUpperCase();
const pad2 = (n)=>String(n).padStart(2,"0");

/* Estilos */
const S = {
  wrap: { maxWidth:1080, margin:"0 auto", padding:16 },
  h1: { fontFamily:"Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize:24, margin:"6px 0 2px", color:"#0f172a" },
  sub: { margin:"0 0 12px", color:"#475569", fontSize:16, fontWeight:400 },

  // Cadro de texto (verde degradado con sombra)
  resumen: {
    margin:"0 0 12px", padding:"12px 14px", borderRadius:12,
    background:"linear-gradient(180deg,#eafaf2,#d8f3e4)",
    color:"#0f172a", boxShadow:"0 10px 26px rgba(16,185,129,.18)"
  },
  resumeLine: { margin:0, fontSize:18, fontWeight:600, letterSpacing:".35px", lineHeight:1.45 },
  resumeNoteTitle: { margin:"10px 0 0", color:"#065f46", fontSize:14, fontWeight:700, letterSpacing:.2 },
  resumeNoteTime: { margin:"2px 0 0", fontWeight:800, animation:"blinkReg 2s infinite" },

  // Botoneira dentro do cadro — Confirmar (70%) | Info (15%) | Papeleira (15%)
  topRow: (m)=>({
    display:"grid",
    gridTemplateColumns:"7fr 1.5fr 1.5fr",
    columnGap:8, alignItems:"stretch",
    margin:"12px 0 2px",
    padding:"0 6px", // asegura aire lateral -> a papeleira non rebasa
    boxSizing:"border-box",
  }),
  // Base visual común: profundidade + “pulsable”
  pressable: (pad)=>({
    width:"100%", padding: pad,
    borderRadius:10, cursor:"pointer",
    display:"grid", placeItems:"center",
    boxShadow:"0 10px 22px rgba(0,0,0,.14), inset 0 1px 0 rgba(255,255,255,.75)",
    transition:"transform .06s ease, box-shadow .2s ease, filter .2s ease",
    boxSizing:"border-box", minWidth:0
  }),
  pressableActive: { transform:"translateY(1.5px)", boxShadow:"0 4px 12px rgba(0,0,0,.14), inset 0 1px 0 rgba(255,255,255,.75)", filter:"saturate(1.02)" },

  // Confirmar
  btnConfirm:(m)=>({
    ...S.pressable(m ? "11px 12px" : "13px 16px"),
    background:"linear-gradient(180deg,#ecfff5,#c8f8de)",
    border:"1px solid #10b981", color:"#065f46",
    fontWeight:900, letterSpacing:.35, fontSize: m ? 14 : 18
  }),
  // Info (azul degradado suave, redondeado e icono grande sen bold)
  btnInfo:(m)=>({
    ...S.pressable(m ? "10px 8px" : "12px 10px"),
    background:"linear-gradient(180deg,#f6fbff,#e4f0ff)",
    border:"1px solid #3b82f6", color:"#1e40af", fontWeight:800, textAlign:"center"
  }),
  // Papeleira (lixeiramente máis contido)
  btnTrash:(m)=>({
    ...S.pressable(m ? "8px 8px" : "11px 10px"),
    background:"linear-gradient(180deg,#fff5f5,#ffe9e9)",
    border:"1px solid #ef4444", color:"#7f1d1d", fontWeight:800
  }),

  // Encabezados de bloque
  posHeader:{ margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },

  // Grades e tarxetas
  grid:(m)=>({ display:"grid", gridTemplateColumns: m ? "repeat(3, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))", gap:12 }),
  card:(picked)=>({
    position:"relative",
    border: picked ? "2px solid #16a34a" : "1px solid #d1fae5",
    borderRadius:16, padding:10,
    background: picked ? "linear-gradient(180deg,#e9fdf2,#d4f9e7)" : "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    boxShadow: picked
      ? "0 0 0 2px rgba(16,185,129,.2), 0 8px 26px rgba(16,185,129,.18)"
      : "0 2px 8px rgba(0,0,0,.06)"
  }),
  frame:(m)=>({
    width:"100%", height: m?172:320, borderRadius:12, overflow:"hidden",
    background:"#ffffff", display:"grid", placeItems:"center", border:"1px solid #e5e7eb", position:"relative"
  }),
  img:(m)=>({ width:"100%", height:"100%", objectFit: m?"cover":"contain", background:"#ffffff", display:"block" }),
  name:{
    margin:"8px 0 0",
    font:"700 15px/1.2 Montserrat, system-ui, sans-serif",
    color:"#0f172a", textAlign:"center",
    display:"-webkit-box", WebkitLineClamp:"2", WebkitBoxOrient:"vertical", overflow:"hidden", wordBreak:"break-word"
  },
  meta:{ margin:"2px 0 0", color:"#475569", fontSize:13, textAlign:"center" },

  counter:{
    position:"absolute", left:"50%", top:"78%", transform:"translate(-50%,-50%)",
    fontFamily:"Montserrat, system-ui, sans-serif", fontWeight:900, fontSize:30, color:"#0c4a6e",
    background:"rgba(56,189,248,.55)", padding:"6px 12px", borderRadius:999, letterSpacing:1.1,
    userSelect:"none", pointerEvents:"none"
  },

  // Marca “visto” canto superior dereito
  markBadge:(m)=>({
    position:"absolute", top:m?6:8, right:m?6:8,
    background:"rgba(16,185,129,.95)", color:"#fff",
    borderRadius:999, padding: m?"2px 6px":"3px 8px",
    font: m ? "800 11px/1 Montserrat,system-ui" : "800 13px/1 Montserrat,system-ui",
    boxShadow:"0 2px 8px rgba(16,185,129,.35)", userSelect:"none", pointerEvents:"none"
  }),

  // Modal
  modalBg:{ position:"fixed", inset:0, background:"rgba(2,6,23,.45)", display:"grid", placeItems:"center", zIndex:9999 },
  modal:{ width:"min(92vw,680px)", maxHeight:"85vh", background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:14, boxShadow:"0 18px 48px rgba(0,0,0,.28)", padding:"16px 14px", position:"relative", display:"grid", gridTemplateRows:"auto 1fr" },
  modalScroll:{ overflowY:"auto", maxHeight:"min(70vh,560px)", paddingRight:6 },
  modalClose:{ position:"absolute", right:8, top:8, width:32, height:32, borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", display:"grid", placeItems:"center" },

  toast:{ position:"fixed", bottom:18, left:"50%", transform:"translateX(-50%)", background:"#0ea5e9", color:"#fff", padding:"10px 16px", borderRadius:12, boxShadow:"0 10px 22px rgba(2,132,199,.35)", fontWeight:700, zIndex:9999 }
};

// Animación parpadeo rexistro
const blinkCss = `
@keyframes blinkReg { 0%{color:#0ea5e9} 50%{color:#0f172a} 100%{color:#0ea5e9} }
`;

function Img({ src, alt, isMobile }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" style={S.img(isMobile)} crossOrigin="anonymous" referrerPolicy="no-referrer" />;
}

export default function HazTu11() {
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);

  const [sel, setSel] = useState(new Set());
  const [lastCounterId, setLastCounterId] = useState(null);
  const [toast, setToast] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const max11 = 11;

  // Sonidos
  const audioRef = useRef(null);
  function ensureCtx(){ if(!audioRef.current){ audioRef.current = new (window.AudioContext||window.webkitAudioContext)(); } return audioRef.current; }
  function beepShort(freq=880, dur=0.12){
    try{ const ctx=ensureCtx(); const o=ctx.createOscillator(); const g=ctx.createGain();
      o.type="sine"; o.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+dur);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+dur+0.02);
    }catch{}
  }
  async function bellConfirm(){
    try{
      const ctx=ensureCtx();
      const seq=[
        {f:880, d:0.12, t:0},
        {f:990, d:0.12, t:0.18},
        {f:740, d:0.35, t:0.42}
      ];
      for(const s of seq){
        const o=ctx.createOscillator(); const g=ctx.createGain();
        o.type="sine"; o.frequency.setValueAtTime(s.f, ctx.currentTime+s.t);
        g.gain.setValueAtTime(0.0001, ctx.currentTime+s.t);
        g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime+s.t+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+s.t+s.d);
        o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime+s.t); o.stop(ctx.currentTime+s.t+s.d+0.02);
      }
    }catch{}
  }

  useEffect(()=>{
    let raf=0;
    const onR=()=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(()=> setIsMobile(window.innerWidth<=560)); };
    window.addEventListener("resize", onR);
    return ()=>{ window.removeEventListener("resize", onR); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    (async () => {
      // Convocatoria publicada
      const { data: pub } = await supabase.from("convocatoria_publica").select("jugador_id");
      const ids = (pub || []).map(r => r.jugador_id);

      // Match referencia
      const { data: top } = await supabase
        .from("matches_vindeiros")
        .select("equipo1,equipo2,match_iso")
        .order("match_iso", { ascending: true }).limit(1).maybeSingle();

      if (top?.match_iso) setHeader({ equipo1: cap(top.equipo1||""), equipo2: cap(top.equipo2||""), match_iso: top.match_iso });
      else {
        const { data: nm } = await supabase.from("next_match").select("equipo1,equipo2,match_iso").eq("id",1).maybeSingle();
        if (nm?.match_iso) setHeader({ equipo1: cap(nm.equipo1||""), equipo2: cap(nm.equipo2||""), match_iso: nm.match_iso });
      }

      if (!ids.length) { setJugadores([]); setLoading(false); return; }

      const { data: js } = await supabase
        .from("jugadores").select("id, nombre, dorsal, foto_url")
        .in("id", ids).order("dorsal", { ascending: true });

      const byId = new Map((js||[]).map(j => [j.id, j]));
      const ordered = ids.map(id => byId.get(id)).filter(Boolean);
      setJugadores(ordered);

      // Precarga do 11 previo do usuario
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id || null;
        const keyIso = top?.match_iso ?? (await supabase.from("next_match").select("match_iso").eq("id",1).maybeSingle())?.data?.match_iso;
        if (uid && keyIso) {
          const { data: prev } = await supabase
            .from("alineaciones_usuarios")
            .select("jugador_id, updated_at")
            .eq("user_id", uid)
            .eq("match_iso", keyIso);
          if (prev && prev.length){
            setSel(new Set(prev.map(r=>r.jugador_id)));
            const last = prev.reduce((a,r)=> Math.max(a, new Date(r.updated_at||0).getTime()), 0);
            if(last) setLastSavedAt(new Date(last).toISOString());
          }
        }
      } catch {}

      setLoading(false);
    })().catch(e => { console.error(e); setLoading(false); });
  }, []);

  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of jugadores || []) {
      const { pos } = finalFromAll(p);
      if (pos && g[pos]) g[pos].push(p);
    }
    return g;
  }, [jugadores]);

  function fmtDT(iso){
    if(!iso) return {fecha:"-",hora:"-"};
    try{
      const d=new Date(iso);
      return {
        fecha:d.toLocaleDateString("gl-ES",{day:"2-digit",month:"2-digit",year:"numeric"}),
        hora:d.toLocaleTimeString("gl-ES",{hour:"2-digit",minute:"2-digit"})
      };
    }catch{return {fecha:"-",hora:"-"}}
  }
  const { fecha:sFecha, hora:sHora } = fmtDT(header?.match_iso);

  function togglePick(id) {
    setSel(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else {
        if (n.size >= 11) return prev;
        n.add(id);
      }
      return n;
    });
    setLastCounterId(id);
    beepShort();
  }

  function showToast(m, ms=3000){ setToast(m); setTimeout(()=>setToast(""), ms); }

  async function saveMy11() {
    if (sel.size !== 11) {
      showToast("Tes que seleccionar 11 xogadores para poder confirmar a túa aliñación", 3000);
      return;
    }
    if (!header?.match_iso) { showToast("Falta o partido de referencia."); return; }

    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id || null;
      if (!uid) { showToast("Precisas iniciar sesión."); return; }

      const iso = header.match_iso;
      await supabase.from("alineaciones_usuarios").delete().eq("user_id", uid).eq("match_iso", iso);

      const now = new Date().toISOString();
      const rows = [...sel].map(jid => ({ user_id: uid, jugador_id: jid, match_iso: iso, updated_at: now }));
      const { error } = await supabase.from("alineaciones_usuarios").insert(rows);
      if (error) throw error;

      setLastSavedAt(now);
      bellConfirm();
      showToast("Aliñación gardada!");
    } catch (e) {
      console.error(e);
      showToast("Erro gardando a aliñación.", 2200);
    }
  }

  function clearMy11Ask(){
    const ok = window.confirm("Seguro que queres borrar a túa aliñación e empezar de novo?");
    if(ok){ setSel(new Set()); setLastCounterId(null); }
  }

  if (loading) return <main style={S.wrap}>Cargando…</main>;

  const confirmLabel = isMobile
    ? (sel.size===11 ? "CONFIRMAR" : `CONFIRMAR (${sel.size}/11)`)
    : (sel.size===11 ? "CONFIRMAR ALIÑACIÓN" : `CONFIRMAR ALIÑACIÓN (${sel.size}/11)`);

  const reg = lastSavedAt ? fmtDT(lastSavedAt) : null;

  return (
    <main style={S.wrap}>
      <style>{blinkCss}</style>
      <h1 style={S.h1}>Fai aquí a túa aliñación</h1>
      <p style={S.sub}>Aquí é onde demostras o Giráldez que levas dentro.</p>

      {header && (
        <div style={S.resumen}>
          <p style={S.resumeLine}>{cap(header.equipo1)} vs {cap(header.equipo2)}</p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>

          {/* Rexistro última aliñación do usuario */}
          <p style={S.resumeNoteTitle}>Rexistro da túa última aliñación:</p>
          <p style={S.resumeNoteTime}>
            {reg ? `${reg.fecha} ás ${reg.hora}` : "-"}
          </p>

          {/* Botoneira — Confirmar (70%) | Info (15%) | Papeleira (15%) */}
          <div style={S.topRow(isMobile)}>
            <button
              style={S.btnConfirm(isMobile)}
              onMouseDown={(e)=>Object.assign(e.currentTarget.style, S.pressableActive)}
              onMouseUp={(e)=>e.currentTarget.removeAttribute("style")}
              onClick={saveMy11}
              disabled={sel.size!==11}
            >
              {confirmLabel}
            </button>

            <button
              style={S.btnInfo(isMobile)}
              onMouseDown={(e)=>Object.assign(e.currentTarget.style, S.pressableActive)}
              onMouseUp={(e)=>e.currentTarget.removeAttribute("style")}
              title="Información" aria-label="Información"
              onClick={()=>setShowInfo(true)}
            >
              {/* Icono info alternativo (sen bold) */}
              <svg width={isMobile?28:30} height={isMobile?28:30} viewBox="0 0 24 24" aria-hidden="true"
                   style={{display:"block",stroke:"#1e40af",fill:"none",strokeWidth:1.7,strokeLinecap:"round",strokeLinejoin:"round"}}>
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 7.6h.01"/>
                <path d="M10.8 10.9h2.4v5.1h-2.4z"/>
              </svg>
            </button>

            <button
              style={S.btnTrash(isMobile)}
              onMouseDown={(e)=>Object.assign(e.currentTarget.style, S.pressableActive)}
              onMouseUp={(e)=>e.currentTarget.removeAttribute("style")}
              onClick={clearMy11Ask}
              title="Borrar" aria-label="Borrar"
            >
              <svg width={isMobile?18:20} height={isMobile?18:20} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{display:"block"}}>
                <path d="M3 6h18" stroke="#7f1d1d" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M8 6V4h8v2" stroke="#7f1d1d" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M19 6l-1 14H6L5 6" stroke="#7f1d1d" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M10 11v6M14 11v6" stroke="#7f1d1d" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {["POR","DEF","CEN","DEL"].map(k => {
        const arr = grouped[k] || [];
        if (!arr.length) return null;
        const label = k === "POR" ? "Porteiros" : k === "DEF" ? "Defensas" : k === "CEN" ? "Medios" : "Dianteiros";
        return (
          <section key={k}>
            <div style={S.posHeader}>{label}</div>
            <div style={S.grid(isMobile)}>
              {arr.map(p => {
                const { dorsal, nombre, pos } = finalFromAll(p);
                const picked = sel.has(p.id);
                return (
                  <article key={p.id} style={S.card(picked)} onClick={()=>togglePick(p.id)}>
                    <div style={S.frame(isMobile)}>
                      <img src={p.foto_url} alt={`Foto de ${nombre}`} style={S.img(isMobile)} loading="lazy" decoding="async" />
                      {lastCounterId === p.id && <span style={S.counter}>{`${sel.size}/11`}</span>}
                      {picked && <span style={S.markBadge(isMobile)}>✔</span>}
                    </div>
                    <p style={S.name}>{dorsal != null ? `${pad2(dorsal)} · ` : ""}{nombre}</p>
                    <p style={S.meta}>{pos}</p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Modal INFO con scroll, título máis grande e separación dunha liña antes do texto */}
      {showInfo && (
        <div style={S.modalBg} role="dialog" aria-modal="true" aria-label="Información de uso">
          <div style={S.modal}>
            <button style={S.modalClose} onClick={()=>setShowInfo(false)} aria-label="Pechar">✕</button>
            <div style={S.modalScroll}>
              <h3
                style={{
                  margin:"0 0 10px",
                  font: isMobile ? "800 28px/1.05 Montserrat,system-ui,sans-serif" : "800 36px/1.05 Montserrat,system-ui,sans-serif",
                  color:"#0f172a"
                }}
              >
                FUNCIONAMENTO E NORMAS DO XOGO
              </h3>
              <div style={{ height:12 }} /> {/* unha liña en branco */}
              <div
                style={{
                  color:"#0f172a",
                  font: isMobile ? "500 16.5px/1.6 Montserrat,system-ui,sans-serif" : "500 15px/1.55 Montserrat,system-ui,sans-serif",
                  paddingBottom:8
                }}
              >
                <ol style={{ paddingLeft:18, margin:"0" }}>
                  <li>A App automatiza case todo, evitando erros que invaliden a túa aliñación.</li>
                  <li>Hai un reloxo de conta atrás; indica o tempo para facer a túa aliñación (ata 2 horas antes do inicio).</li>
                  <li>A aliñación só se fará cando a convocatoria estea subida; os xogadores en <strong>#Fai aquí a túa aliñación#</strong> son seleccionables.</li>
                  <li>Debes elixir 11 xogadores; se non son 11, non poderás confirmar.</li>
                  <li>Podes cambiar ata 2 horas antes: borra (papeleira) e volve facer. Verás o rexistro (data/hora) da última gardada.</li>
                  <li>Ao publicarse a Aliñación oficial do Club, crúzanse as predicións e verás os resultados en <strong>#Resultados da última aliñación#</strong>.</li>
                  <li><strong>Premio:</strong> Camiseta oficial do Celta (esta tempada ou a próxima). Ti escolles talla e cor na tenda.</li>
                  <li>Se tes problemas, escribe a <strong>HDCLiga@gmail.com</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" aria-live="polite" style={S.toast}>{toast}</div>
      )}
    </main>
  );
}
