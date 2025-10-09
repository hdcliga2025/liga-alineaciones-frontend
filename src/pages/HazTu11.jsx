// src/pages/HazTu11.jsx
import { h } from "preact";
import { useEffect, useMemo, useState, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* Utils (tuyos, intactos + helpers de nombre) */
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

/* Separa nome/apelidos para render a dúas liñas */
function splitName(full=""){
  const parts=(full||"").trim().split(/\s+/).filter(Boolean);
  if(parts.length<=1) return { first: full, last: "" };
  const last = parts.slice(-1).join(" ");
  const first = parts.slice(0,-1).join(" ");
  return { first, last };
}
/* Ajuste simple de tamaños segundo lonxitude total (móbil/desktop) */
function sizePair(first,last,isMobile){
  const len=(first+last).length;
  let top = isMobile ? 14 : 16;
  let bot = isMobile ? 13 : 15;
  if(len>22){ top-=1; bot-=1; }
  if(len>28){ top-=1; bot-=1; }
  if(len>34){ top-=1; bot-=1; }
  if(len>40){ top-=1; bot-=1; }
  if(top<11) top=11;
  if(bot<10) bot=10;
  return { top, bot };
}
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

const IMG_H = 320;

/* Estilos (mantenemos lo existente) */
const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 12px", color: "#475569", fontSize: 16, fontWeight: 400 },

  resumen: {
    margin:"0 0 12px", padding:"12px 14px", borderRadius:12,
    background:"linear-gradient(180deg,#eafaf2,#d8f3e4)",
    color:"#0f172a",
    boxShadow:"0 10px 26px rgba(16,185,129,.18)"
  },
  resumeLine: { margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: ".35px", lineHeight: 1.5 },
  resumeNoteTitle: { margin:"10px 0 0", color:"#065f46", fontSize:14, fontWeight:700 },
  resumeNoteTime: { margin:"2px 0 0", color:"#0b1220", fontSize:16, fontWeight:800, letterSpacing:1, animation:"blinkReg 2s infinite" },

  /* Botonera contenida (desktop 80/10/10, móvil 70/15/15) */
  topRow: (isMobile) => ({
    display:"grid",
    gridTemplateColumns: isMobile ? "7fr 1.5fr 1.5fr" : "8fr 1fr 1fr",
    columnGap:8, alignItems:"stretch", margin:"12px 0 2px", padding:"0 6px"
  }),

  /* Botones menos altos + redondeados */
  pressable: {
    width:"100%", padding:"8px 10px", borderRadius:12, cursor:"pointer",
    display:"grid", placeItems:"center",
    border:"1px solid rgba(0,0,0,.08)",
    boxShadow:"0 10px 22px rgba(0,0,0,.14), inset 0 1px 0 rgba(255,255,255,.75)",
    transition:"transform .06s ease, box-shadow .2s ease, filter .2s ease, background .2s ease, border-color .2s ease"
  },

  btnInfo: { background:"#ffffff", color:"#1e40af", border:"1px solid #3b82f6", fontWeight:800 },
  btnConfirm: { background:"linear-gradient(180deg,#eefef5,#c7f5dc)", color:"#065f46", border:"1px solid #10b981", fontWeight:900, letterSpacing:.35 },
  btnTrash: { background:"linear-gradient(180deg,#fff5f5,#ffe9e9)", color:"#7f1d1d", border:"1px solid #ef4444", fontWeight:800 },

  posHeader: { margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },
  grid: (isMobile)=>({ display:"grid", gridTemplateColumns: isMobile ? "repeat(3, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))", gap:12 }),

  card: (picked)=>({
    display:"block",
    background: picked ? "linear-gradient(180deg,#e9fdf2,#d4f9e7)" : "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    border: picked ? "2px solid #16a34a" : "1px solid #dbeafe",
    borderRadius:16, padding:10,
    boxShadow: picked ? "0 0 0 2px rgba(16,185,129,.2), 0 8px 26px rgba(16,185,129,.18)" : "0 2px 8px rgba(0,0,0,.06)",
    position:"relative"
  }),
  frame: (isMobile)=>({
    position:"relative", width:"100%", height: isMobile ? 172 : IMG_H,
    borderRadius:12, display:"grid", placeItems:"center",
    background:"#ffffff", border:"1px solid #e5e7eb", overflow:"hidden"
  }),
  img: (isMobile)=>({ width:"100%", height:"100%", objectFit: isMobile ? "cover" : "contain", background:"#ffffff" }),

  nameTop: (fs)=>({ margin:"8px 0 0", font:`700 ${fs}px/1.15 Montserrat, system-ui, sans-serif`, color:"#0f172a", textAlign:"center", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }),
  nameBottom: (fs)=>({ margin:"2px 0 0", font:`700 ${fs}px/1.1 Montserrat, system-ui, sans-serif`, color:"#0f172a", textAlign:"center", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }),
  meta: { margin:"2px 0 0", color:"#475569", fontSize:13, textAlign:"center" },

  counter: { position:"absolute", left:"50%", top:"78%", transform:"translate(-50%,-50%)", fontFamily:"Montserrat, system-ui, sans-serif", fontWeight:900, fontSize:30, color:"#0c4a6e", background:"rgba(56,189,248,.55)", padding:"6px 12px", borderRadius:999, letterSpacing:1.1, userSelect:"none", pointerEvents:"none" },

  /* ✔ “Visto” mucho máis grande en desktop */
  markBadge: (isMobile)=>({
    position:"absolute", top:isMobile?6:8, right:isMobile?6:8,
    background:"rgba(16,185,129,.95)", color:"#fff", borderRadius:999,
    padding: isMobile ? "2px 6px" : "8px 14px",
    font: isMobile ? "800 12px/1 Montserrat" : "800 24px/1 Montserrat",
    boxShadow:"0 2px 8px rgba(16,185,129,.35)", userSelect:"none", pointerEvents:"none"
  }),

  /* Botón corrido inferior */
  fullConfirmWrap: { marginTop:14 },
  fullConfirmBtn: {
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#eefef5,#c7f5dc)",
    color:"#065f46", fontWeight:900, letterSpacing:.35,
    border:"1px solid #10b981", cursor:"pointer",
    boxShadow:"0 10px 22px rgba(0,0,0,.14), inset 0 1px 0 rgba(255,255,255,.75)",
    transition:"transform .06s ease, box-shadow .2s ease"
  },

  /* Modales */
  modalBg: { position:"fixed", inset:0, background:"rgba(2,6,23,.45)", display:"grid", placeItems:"center", zIndex:9999 },
  modal: { width:"min(92vw,760px)", maxHeight:"85vh", background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:14, boxShadow:"0 18px 48px rgba(0,0,0,.28)", padding:"16px 14px", position:"relative", display:"grid", gridTemplateRows:"auto 1fr" },
  modalScroll: { overflowY:"auto", maxHeight:"min(70vh,560px)", paddingRight:6 },
  modalClose: { position:"absolute", right:8, top:8, width:32, height:32, borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", display:"grid", placeItems:"center" },

  /* Mini botones dentro de modales */
  modalBtns: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:14 },
  modalBtnOutline: { padding:"8px 10px", borderRadius:10, border:"1px solid #cbd5e1", background:"#fff", cursor:"pointer" },
  modalBtnDanger: { padding:"8px 10px", borderRadius:10, border:"1px solid #ef4444", background:"linear-gradient(180deg,#fff5f5,#ffe9e9)", color:"#7f1d1d", cursor:"pointer" },

  toast: { position:"fixed", bottom:18, left:"50%", transform:"translateX(-50%)", background:"#0ea5e9", color:"#fff", padding:"10px 16px", borderRadius:12, boxShadow:"0 10px 22px rgba(2,132,199,.35)", fontWeight:700 }
};

const blinkCss = `
@keyframes blinkReg{0%{color:#0ea5e9}50%{color:#0f172a}100%{color:#0ea5e9}}
`;

/* Img helper */
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
  const [showOK, setShowOK] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false); // ← NUEVO modal propio
  const [toast, setToast] = useState("");
  const [lastSavedAt,setLastSavedAt]=useState(null);
  const max11 = 11;

  /* Sonidos */
  const audioRef=useRef(null);
  function ensureCtx(){ if(!audioRef.current){ audioRef.current=new (window.AudioContext||window.webkitAudioContext)(); } return audioRef.current; }
  function beepShort(freq=880,dur=0.11){ try{ const ctx=ensureCtx(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type="sine"; o.frequency.setValueAtTime(freq,ctx.currentTime); g.gain.setValueAtTime(0.0001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.28,ctx.currentTime+0.01); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+dur); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+dur+0.02); }catch{} }
  async function bellConfirm(){ try{ const ctx=ensureCtx(); const seq=[{f:880,d:0.12,t:0},{f:980,d:0.12,t:0.18},{f:740,d:0.35,t:0.42}]; for(const s of seq){ const o=ctx.createOscillator(); const g=ctx.createGain(); o.type="sine"; o.frequency.setValueAtTime(s.f,ctx.currentTime+s.t); g.gain.setValueAtTime(0.0001,ctx.currentTime+s.t); g.gain.exponentialRampToValueAtTime(0.35,ctx.currentTime+s.t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+s.t+s.d); o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime+s.t); o.stop(ctx.currentTime+s.t+s.d+0.02);} }catch{} }

  /* Efecto “botón pulsado” confiable (no se queda atascado tras modales) */
  function pressDown(e){ try{ e.currentTarget.style.transform="translateY(1.5px)"; e.currentTarget.style.boxShadow="0 6px 14px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.7)"; }catch{} }
  function pressReset(e){ try{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 10px 22px rgba(0,0,0,.14), inset 0 1px 0 rgba(255,255,255,.75)"; }catch{} }

  useEffect(() => {
    let raf=0;
    const onR=()=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(()=> setIsMobile(window.innerWidth<=560)); };
    window.addEventListener("resize", onR);
    return ()=>{ window.removeEventListener("resize", onR); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    (async () => {
      const { data: pub } = await supabase.from("convocatoria_publica").select("jugador_id,updated_at");
      const ids = (pub || []).map(r => r.jugador_id);

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

      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id || null;
        const keyIso = (top?.match_iso || (await supabase.from("next_match").select("match_iso").eq("id",1).maybeSingle())?.data?.match_iso);
        if (uid && keyIso) {
          const { data: prev } = await supabase
            .from("alineaciones_usuarios")
            .select("jugador_id,updated_at")
            .eq("user_id", uid)
            .eq("match_iso", keyIso);
          if (prev && prev.length) {
            setSel(new Set(prev.map(r=>r.jugador_id)));
            const last = prev.reduce((a,r)=>Math.max(a, new Date(r.updated_at||0).getTime()), 0);
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

  const { fecha: sFecha, hora: sHora } = fmtDT(header?.match_iso);

  function togglePick(id) {
    setSel(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else {
        if (n.size >= max11) return prev;
        n.add(id);
      }
      return n;
    });
    setLastCounterId(id);
    beepShort();
  }

  function showToast(m, ms = 3000) {
    setToast(m);
    setTimeout(() => setToast(""), ms);
  }

  async function saveMy11() {
    if (sel.size !== 11) { showToast("Tes que seleccionar 11 xogadores para poder confirmar a túa aliñación", 3000); return; }
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

      setShowOK(true);
      setLastSavedAt(now);
      bellConfirm();
      showToast("Aliñación gardada!");
    } catch (e) {
      console.error(e);
      showToast("Erro gardando a aliñación.", 2200);
    }
  }

  function openClear(){ setShowClearConfirm(true); }
  function doClear(){
    setSel(new Set());
    setLastCounterId(null);
    setShowClearConfirm(false);
    showToast("Aliñación borrada. Crea unha nova.");
  }

  if (loading) return <main style={S.wrap}>Cargando…</main>;

  const confirmLabel = isMobile ? (sel.size===11 ? "CONFIRMAR" : `CONFIRMAR (${sel.size}/11)`) : (sel.size===11 ? "CONFIRMAR ALIÑACIÓN" : `CONFIRMAR ALIÑACIÓN (${sel.size}/11)`);
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

          <p style={S.resumeNoteTitle}>Rexistro da túa última aliñación:</p>
          <p style={S.resumeNoteTime}>{reg ? `${reg.fecha} ás ${reg.hora}` : "-"}</p>

          <div style={S.topRow(isMobile)}>
            <button
              style={{...S.pressable, ...S.btnConfirm}}
              onPointerDown={pressDown}
              onPointerUp={pressReset}
              onPointerLeave={pressReset}
              onClick={saveMy11}
              disabled={sel.size!==11}
            >
              {confirmLabel}
            </button>

            {/* PAPELERA al medio */}
            <button
              style={{...S.pressable, ...S.btnTrash}}
              onPointerDown={pressDown}
              onPointerUp={pressReset}
              onPointerLeave={pressReset}
              onClick={openClear}
              title="Borrar" aria-label="Borrar"
            >
              <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{display:"block"}}>
                <path d="M3 6h18" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M8 6V4h8v2" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M19 6l-1 14H6L5 6" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M10 11v6M14 11v6" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>

            {/* INFO á dereita */}
            <button
              style={{...S.pressable, ...S.btnInfo, borderRadius:12}}
              title="Información" aria-label="Información"
              onPointerDown={pressDown}
              onPointerUp={pressReset}
              onPointerLeave={pressReset}
              onClick={()=>setShowInfo(true)}
            >
              <svg width={28} height={28} viewBox="0 0 24 24" aria-hidden="true" style={{display:"block"}}>
                <circle cx="12" cy="12" r="10" fill="#1e40af" opacity="0.12"/>
                <circle cx="12" cy="7" r="1.8" fill="#1e40af"/>
                <rect x="10.9" y="10" width="2.2" height="8" rx="1.1" fill="#1e40af"/>
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
                const { first, last } = splitName(nombre);
                const sizes = sizePair(first,last,isMobile);
                return (
                  <article key={p.id} style={S.card(picked)} onClick={()=>togglePick(p.id)}>
                    <div style={S.frame(isMobile)}>
                      <Img src={p.foto_url} alt={`Foto de ${nombre}`} isMobile={isMobile}/>
                      {lastCounterId === p.id && <span style={S.counter}>{`${sel.size}/11`}</span>}
                      {picked && <span style={S.markBadge(isMobile)}>✔</span>}
                    </div>
                    <p style={S.nameTop(sizes.top)}>{dorsal != null ? `${pad2(dorsal)} · ` : ""}{first}</p>
                    <p style={S.nameBottom(sizes.bot)}>{last}</p>
                    <p style={S.meta}>{pos}</p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Botón corrido de confirmación */}
      <div style={S.fullConfirmWrap}>
        <button
          style={S.fullConfirmBtn}
          onPointerDown={pressDown}
          onPointerUp={pressReset}
          onPointerLeave={pressReset}
          onClick={saveMy11}
          disabled={sel.size!==11}
        >
          {confirmLabel}
        </button>
      </div>

      {/* Modal éxito */}
      {showOK && (
        <div style={S.modalBg} role="dialog" aria-modal="true" aria-label="Aliñación enviada">
          <div style={{...S.modal, maxWidth:520}}>
            <button style={S.modalClose} onClick={()=>setShowOK(false)} aria-label="Pechar">✕</button>
            <h3 style={{ margin:"0 0 6px", font:"800 18px/1.2 Montserrat,system-ui,sans-serif", color:"#065f46" }}>
              Aliñación feita e enviada
            </h3>
            <p style={{ margin:0, color:"#475569" }}>
              Grazas! Podes modificar a túa aliñación ata 2h antes do inicio do partido.
            </p>
          </div>
        </div>
      )}

      {/* Modal INFO (se mantiene) */}
      {showInfo && (
        <div style={S.modalBg} role="dialog" aria-modal="true" aria-label="Información de uso">
          <div style={S.modal}>
            <button style={S.modalClose} onClick={()=>setShowInfo(false)} aria-label="Pechar">✕</button>
            <div style={{height:12}}/>
            <div style={S.modalScroll}>
              <h3 style={{
                margin:0,
                font: isMobile ? "800 15.3px/1.1 Montserrat,system-ui" : "800 17.85px/1.1 Montserrat,system-ui",
                color:"#0f172a"
              }}>
                FUNCIONAMENTO E NORMAS DO XOGO
              </h3>
              <div style={{height:12}}/>
              <div style={{ color:"#0f172a", font: isMobile ? "500 16.5px/1.6 Montserrat,system-ui" : "500 15px/1.55 Montserrat,system-ui" }}>
                <ol style={{ paddingLeft:18, margin:0 }}>
                  <li>A App automatiza case todo, evitando erros que invaliden a túa aliñación.</li>
                  <li>Como ves, hai un reloxo de conta atrás: indica o tempo que queda para facer a túa aliñación (ata 2 horas antes do inicio do partido).</li>
                  <li>A aliñación só poderá facerse cando a convocatoria sexa subida á App, así que todos os xogadores que vexas en <em>Fai aquí a túa aliñación</em> son seleccionables para saír no once inicial.</li>
                  <li>Terás que elixir 11 xogadores; non te preocupes por contar, se non chegan a 11 non poderás confirmar a aliñación.</li>
                  <li>Poderás facer cantos cambios queiras ata 2 horas antes do inicio. Para iso, borra a aliñación (icona papeleira) e fai outra. Verás un rexistro coa data e hora da túa última aliñación gardada.</li>
                  <li>No momento en que se publique a Aliñación inicial oficial presentada polo Club, cruzaranse coas predicións e presentarase o resultado en <em>Resultados da última aliñación</em>.</li>
                  <li>Premio: camiseta oficial do Celta desta tempada ou da próxima. Vas á tenda e ti decides talla e cor.</li>
                  <li>Recomendamos navegar un pouco pola App para situarte. Se tes algún problema, podes escribir a <strong>HDCLiga@gmail.com</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal CONFIRMAR BORRADO (reemplaza window.confirm) */}
      {showClearConfirm && (
        <div style={S.modalBg} role="dialog" aria-modal="true" aria-label="Confirmar borrado">
          <div style={{...S.modal, maxWidth:480}}>
            <button style={S.modalClose} onClick={()=>setShowClearConfirm(false)} aria-label="Pechar">✕</button>
            <div style={{ padding:"6px 2px" }}>
              <p style={{ margin:"0 0 8px", color:"#0f172a", font:"700 16px/1.35 Montserrat,system-ui" }}>
                ¿Confirmas o borrado da túa última aliñación para facer unha nova?
              </p>
              <div style={S.modalBtns}>
                <button style={S.modalBtnOutline} onClick={()=>setShowClearConfirm(false)}>Cancelar</button>
                <button style={S.modalBtnDanger} onClick={doClear}>Borrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" aria-live="polite" style={S.toast}>
          {toast}
        </div>
      )}
    </main>
  );
}
