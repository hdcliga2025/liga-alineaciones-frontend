// src/pages/HazTu11.jsx
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* Utils */
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
const IMG_H = 320;

/* === Autofit 2 liñas (móbil) como en Alineación Oficial === */
function useFitText2Lines(
  ref,
  { min = 11, max = 14, lineHeight = 1.2, maxLines = 2, initial = 13.5, deps = [] } = {}
) {
  const [fontSize, setFontSize] = useState(initial);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.whiteSpace = "normal";
    el.style.overflow = "hidden";
    el.style.display = "block";
    el.style.textOverflow = "clip";
    el.style.lineHeight = String(lineHeight);
    el.style.wordBreak = "break-word";
    let low = min, high = max;
    let best = Math.max(min, Math.min(max, initial));
    const fits = (px) => {
      el.style.fontSize = px + "px";
      const one = px * lineHeight;
      const maxH = one * maxLines + 0.5;
      return el.scrollHeight <= maxH && el.clientHeight <= maxH;
    };
    if (fits(best)) low = best; else high = best;
    while (high - low > 0.25) {
      const mid = (low + high) / 2;
      if (fits(mid)) low = mid; else high = mid;
    }
    best = Math.floor(low * 10) / 10;
    el.style.fontSize = best + "px";
    setFontSize(best);
    if (!fits(min)) {
      el.style.display = "-webkit-box";
      el.style.webkitBoxOrient = "vertical";
      el.style.webkitLineClamp = String(maxLines);
      el.style.textOverflow = "ellipsis";
    }
    let raf = 0;
    const onR = () => { cancelAnimationFrame(raf); raf=requestAnimationFrame(()=>setFontSize((s)=>s)); };
    window.addEventListener("resize", onR);
    document.addEventListener("visibilitychange", onR);
    return () => { window.removeEventListener("resize", onR); document.removeEventListener("visibilitychange", onR); cancelAnimationFrame(raf); };
  }, deps);
  return { fontSize };
}

/* ===== Estilos ===== */
const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 12px", color: "#475569", fontSize: 16, fontWeight: 400 },

  // 8) Cuadro de texto con VERDE degradado (sin borde)
  resumen: {
    margin:"0 0 12px", padding:"12px 14px", borderRadius:12,
    border:"none",
    background:"linear-gradient(180deg,#ecfdf5,#d1fae5)", // verde suave → máis verde
    color:"#064e3b",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.9), 0 8px 20px rgba(16,185,129,.16), 0 1px 0 rgba(16,185,129,.12)"
  },
  resumeLine: { margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: ".35px", lineHeight: 1.5 },
  resumeNoteTitle: { margin:"8px 0 0", color:"#065f46", fontSize:15, fontWeight:700, letterSpacing:.3 },

  // 3) Parpadeo celeste ↔ negro
  resumeNoteTime: {
    margin:"2px 0 0", fontSize:16, fontWeight:800, letterSpacing:.4,
    animation: "blinkCelNeg 2.2s infinite"
  },

  // 1,2,5,6,7) Botonera alineada (no desborda). Grid 20/60/20; info azul degradado; confirmar verde degradado; trash borde simple.
  topRow: (m)=>({
    display:"grid",
    gridTemplateColumns: "20% 60% 20%",
    gap:8,
    alignItems:"stretch",
    margin:"8px 0 12px"
  }),

  btnInfo:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#e0f2fe,#bfdbfe)", // azul degradado
    color:"#0b4f8a", fontWeight:800, textAlign:"center",
    border:"1px solid #38bdf8", cursor:"pointer",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.95), 0 4px 12px rgba(2,132,199,.2)",
    display:"grid", placeItems:"center"
  },
  btnConfirm:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#bbf7d0,#86efac)", // verde degradado
    color:"#065f46", fontWeight:900,
    border:"1px solid #22c55e", cursor:"pointer",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.95), 0 6px 14px rgba(34,197,94,.22)"
  },
  btnTrash:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#ffffff,#fee2e2)",
    color:"#7f1d1d", fontWeight:800,
    border:"1px solid #ef4444", cursor:"pointer",
    display:"grid", placeItems:"center",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.95), 0 3px 10px rgba(239,68,68,.18)"
  },

  btnBottom:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#bbf7d0,#86efac)", // igual a confirmar
    color:"#065f46", fontWeight:900,
    border:"1px solid #22c55e", cursor:"pointer", marginTop:14,
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.95), 0 6px 14px rgba(34,197,94,.22)"
  },

  posHeader: { margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },
  grid: (isMobile)=>({
    display:"grid",
    gridTemplateColumns: isMobile ? "repeat(3, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))",
    gap:12
  }),

  // 4) Tarjeta seleccionada: borde verde grueso
  card: (picked)=>({
    position:"relative",
    borderRadius:16, padding:10,
    background: picked ? "#ecfdf5" : "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    border: picked ? "2px solid #22c55e" : "1px solid #dbeafe",
    boxShadow: picked ? "0 0 0 3px rgba(34,197,94,.18), 0 8px 22px rgba(34,197,94,.12)" : "0 2px 8px rgba(0,0,0,.06)"
  }),

  // Frame como en Alineación Oficial
  frame: (isMobile)=>({
    width:"100%", height: isMobile ? 172 : IMG_H,
    borderRadius:12, overflow:"hidden",
    background:"#ffffff", display:"grid", placeItems:"center",
    border:"1px solid #e5e7eb", position:"relative"
  }),
  img: (isMobile) => ({ width:"100%", height:"100%", objectFit: isMobile ? "cover" : "contain", background:"#ffffff", display:"block" }),

  // Nombre
  nameDesktop: {
    margin:"8px 0 0",
    font:"700 15px/1.2 Montserrat, system-ui, sans-serif",
    color:"#0f172a",
    textAlign:"center",
    display:"-webkit-box",
    WebkitLineClamp:"2",
    WebkitBoxOrient:"vertical",
    overflow:"hidden",
    wordBreak:"break-word"
  },
  nameMobileBase: {
    margin:"8px 0 0",
    fontWeight:700,
    fontFamily:"Montserrat, system-ui, sans-serif",
    lineHeight:1.2,
    color:"#0f172a",
    textAlign:"center"
  },

  meta: { margin:"2px 0 0", color:"#475569", fontSize:13, textAlign:"center" },

  // Contador
  counter: {
    position:"absolute", left:"50%", top:"78%", transform:"translate(-50%,-50%)",
    fontFamily:"Montserrat, system-ui, sans-serif",
    fontWeight:900, fontSize:30, color:"#0c4a6e",
    background:"rgba(56,189,248,.55)", padding:"6px 12px", borderRadius:999,
    letterSpacing:1.1, userSelect:"none", pointerEvents:"none"
  },

  // 2) Pulgar bonito arriba-izquierda (móvil un poco mayor), pegado á esquina
  okThumb: (m)=>({
    position:"absolute", top: m ? 4 : 6, left: m ? 4 : 6,
    background:"rgba(34,197,94,.92)", color:"#fff",
    borderRadius:999, padding: m ? "3px 5px" : "4px 6px",
    boxShadow:"0 2px 8px rgba(34,197,94,.28)",
    display:"grid", placeItems:"center", userSelect:"none", pointerEvents:"none"
  }),

  // Modal
  modalBg: { position:"fixed", inset:0, background:"rgba(2,6,23,.45)", display:"grid", placeItems:"center", zIndex:9999 },
  modal: {
    width:"min(92vw,520px)",
    background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:14,
    boxShadow:"0 18px 48px rgba(0,0,0,.28)", padding:"16px 14px", position:"relative"
  },
  modalClose: {
    position:"absolute", right:8, top:8, width:32, height:32, borderRadius:8,
    border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", display:"grid", placeItems:"center"
  }
};

const extraStyles = `
@keyframes blinkCelNeg{0%{color:#0ea5e9}50%{color:#000}100%{color:#0ea5e9}}
`;

function Img({ src, alt, isMobile }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={S.img(isMobile)}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
    />
  );
}

/* Componente de nome móbil con autofit a 2 liñas */
function NameMobileTwoLines({ text }) {
  const ref = useRef(null);
  const { fontSize } = useFitText2Lines(ref, { deps: [text] });
  return (
    <p
      ref={ref}
      style={{
        ...S.nameMobileBase,
        fontSize,
        maxHeight: fontSize ? `${fontSize * 1.2 * 2 + 0.5}px` : undefined,
      }}
    >
      {text}
    </p>
  );
}

/* ====== Audio (WebAudio) ====== */
function useAudio() {
  const ctxRef = useRef(null);
  const getCtx = () => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    ctxRef.current = ctx;
    return ctx;
  };
  function envGain(ctx, t0, a=0.01, d=0.15, s=0.6, r=0.25, peak=0.9) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.linearRampToValueAtTime(peak*s, t0 + a + d);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d + r);
    return g;
  }
  function playYeah() {
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [440, 554.37, 659.25];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(f, now + i*0.06);
      const g = envGain(ctx, now + i*0.06, 0.005, 0.12, 0.5, 0.18, 0.7);
      o.connect(g).connect(ctx.destination);
      o.start(now + i*0.06);
      o.stop(now + i*0.35);
    });
  }
  function playTrumpets() {
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime; const dur = 2.0;
    const makeBrass = (f, detuneCents) => {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = detuneCents || 0;
      const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.setValueAtTime(800, now); filt.frequency.linearRampToValueAtTime(2200, now + 0.4);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.9, now + 0.05); g.gain.linearRampToValueAtTime(0.6, now + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(filt).connect(g).connect(ctx.destination); o.start(now); o.stop(now + dur + 0.05);
    };
    makeBrass(523.25, 0); makeBrass(659.25, +3); makeBrass(783.99, -4);
  }
  return { playYeah, playTrumpets };
}

export default function HazTu11() {
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);

  const [sel, setSel] = useState(new Set());
  const [lastCounterId, setLastCounterId] = useState(null);
  const [showOK, setShowOK] = useState(false);
  const [toast, setToast] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const max11 = 11;

  const { playYeah, playTrumpets } = useAudio();

  useEffect(() => {
    let raf=0;
    const onR=()=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(()=> setIsMobile(window.innerWidth<=560)); };
    window.addEventListener("resize", onR);
    return ()=>{ window.removeEventListener("resize", onR); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    (async () => {
      const { data: pub } = await supabase.from("convocatoria_publica").select("jugador_id");
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
            const last = prev.reduce((a,r)=> {
              const t = r.updated_at ? new Date(r.updated_at).getTime() : 0;
              return t>a?t:a;
            }, 0);
            if (last) setLastSavedAt(new Date(last).toISOString());
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

  const { fecha: sFecha, hora: sHora } = (() => {
    if (!header?.match_iso) return { fecha:"-", hora:"-" };
    try {
      const d = new Date(header.match_iso);
      return {
        fecha: d.toLocaleDateString("gl-ES", { day: "2-digit", month: "2-digit", year: "numeric" }),
        hora:  d.toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" })
      };
    } catch { return { fecha:"-", hora:"-" }; }
  })();

  function togglePick(id) {
    setSel(prev => {
      const wasSelected = prev.has(id);
      const n = new Set(prev);
      if (wasSelected) {
        n.delete(id);
      } else {
        if (n.size >= max11) return prev;
        n.add(id);
        try { playYeah(); } catch {}
      }
      return n;
    });
    setLastCounterId(id);
  }

  async function saveMy11() {
    if (sel.size !== 11) { setToast("Escolle 11 xogadores."); setTimeout(()=>setToast(""), 1500); return; }
    if (!header?.match_iso) { setToast("Falta o partido de referencia."); setTimeout(()=>setToast(""), 1500); return; }

    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id || null;
      if (!uid) { setToast("Precisas iniciar sesión."); setTimeout(()=>setToast(""), 1500); return; }

      const iso = header.match_iso;
      await supabase.from("alineaciones_usuarios").delete().eq("user_id", uid).eq("match_iso", iso);

      const now = new Date().toISOString();
      const rows = [...sel].map(jid => ({ user_id: uid, jugador_id: jid, match_iso: iso, updated_at: now }));
      const { error } = await supabase.from("alineaciones_usuarios").insert(rows);
      if (error) throw error;

      setLastSavedAt(now);
      setShowOK(true);
      setToast("Aliñación gardada!");
      try { playTrumpets(); } catch {}
      setTimeout(()=>setToast(""), 1600);
    } catch (e) {
      console.error(e);
      setToast("Erro gardando a aliñación.");
      setTimeout(()=>setToast(""), 2000);
    }
  }
  function clearMy11(){ setSel(new Set()); setLastCounterId(null); }

  if (loading) return <main style={S.wrap}>Cargando…</main>;

  const confirmLabel = isMobile
    ? `CONFIRMAR | ${sel.size}/11`
    : `CONFIRMAR ALIÑACIÓN | ${sel.size}/11`;

  const fmtLast = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return {
        f: d.toLocaleDateString("gl-ES",{day:"2-digit",month:"2-digit",year:"numeric"}),
        h: d.toLocaleTimeString("gl-ES",{hour:"2-digit",minute:"2-digit"})
      };
    } catch { return null; }
  };
  const last = fmtLast(lastSavedAt);

  return (
    <main style={S.wrap}>
      <style>{extraStyles}</style>

      <h1 style={S.h1}>Fai aquí a túa aliñación</h1>
      <p style={S.sub}>Aquí é onde demostras o Giráldez que levas dentro.</p>

      {header && (
        <div style={S.resumen}>
          <p style={S.resumeLine}><strong>{cap(header.equipo1)}</strong> vs <strong>{cap(header.equipo2)}</strong></p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>
          <p style={S.resumeNoteTitle}>Rexistro da túa última aliñación:</p>
          <p style={S.resumeNoteTime}>{last ? `${last.f} ás ${last.h}` : "-"}</p>
        </div>
      )}

      {/* Botonera 20/60/20, dentro de los márgenes del cuadro */}
      <div style={S.topRow(isMobile)}>
        <button style={S.btnInfo} title="Información" aria-label="Información">
          {/* Icono “i” más bonito */}
          <svg width={isMobile ? 24 : 28} height={isMobile ? 24 : 28} viewBox="0 0 24 24" aria-hidden="true" style={{display:"block"}}>
            <defs>
              <linearGradient id="infoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#0ea5e9"/>
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="9" fill="url(#infoGrad)" stroke="#1e3a8a" strokeWidth="1"/>
            <path d="M12 10v6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 7.2h.01" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <button style={S.btnConfirm} onClick={saveMy11} disabled={sel.size!==11}>
          {confirmLabel}
        </button>

        <button style={S.btnTrash} onClick={clearMy11} title="Borrar" aria-label="Borrar">
          {/* Papelera sin bold, icono un pelín mayor en móvil/desktop */}
          <svg width={isMobile ? 22 : 26} height={isMobile ? 22 : 26} viewBox="0 0 24 24" fill="none" aria-hidden="true"
               style={{display:"block",stroke:"#7f1d1d",strokeWidth:1.6,strokeLinecap:"round",strokeLinejoin:"round"}}>
            <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>

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
                const nameLine = (dorsal != null ? `${String(dorsal).padStart(2,"0")} · ` : "") + nombre;
                return (
                  <article key={p.id} style={S.card(picked)} onClick={()=>togglePick(p.id)}>
                    <div style={S.frame(isMobile)}>
                      <Img src={p.foto_url} alt={`Foto de ${nombre}`} isMobile={isMobile} />
                      {/* Pulgar bonito arriba-izquierda cuando está seleccionado */}
                      {picked && (
                        <span style={S.okThumb(isMobile)} aria-hidden="true">
                          <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 24 24" fill="none"
                               style={{display:"block",stroke:"#ffffff",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}}>
                            <path d="M7 11h4l2-6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v8.5a3.5 3.5 0 0 1-3.5 3.5H10a3 3 0 0 1-3-3v-3z"/>
                            <path d="M7 11v6H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h3z"/>
                          </svg>
                        </span>
                      )}
                      {/* contador */}
                      {lastCounterId === p.id && <span style={S.counter}>{`${sel.size}/11`}</span>}
                    </div>
                    {isMobile ? (
                      <NameMobileTwoLines text={nameLine} />
                    ) : (
                      <p style={S.nameDesktop}>{nameLine}</p>
                    )}
                    <p style={S.meta}>{pos}</p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <button style={S.btnBottom} onClick={saveMy11} disabled={sel.size!==11}>{confirmLabel}</button>

      {/* Popup éxito */}
      {showOK && (
        <div style={S.modalBg} role="dialog" aria-modal="true" aria-label="Aliñación enviada">
          <div style={S.modal}>
            <button style={S.modalClose} onClick={()=>setShowOK(false)} aria-label="Pechar">
              ✕
            </button>
            <h3 style={{ margin:"0 0 6px", font:"800 18px/1.2 Montserrat,system-ui,sans-serif", color:"#065f46" }}>
              Aliñación feita e enviada
            </h3>
            <p style={{ margin:0, color:"#475569" }}>
              Grazas! Podes modificar a túa aliñación ata 2h antes do inicio do partido.
            </p>
          </div>
        </div>
      )}

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
