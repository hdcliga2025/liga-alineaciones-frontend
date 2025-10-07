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
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16, boxSizing:"border-box" },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 12px", color: "#475569", fontSize: 16, fontWeight: 400 },

  // 2) Cuadro de texto: verde un poco más OSCURO + sombra
  resumen: {
    margin:"0 0 12px", padding:"12px 14px", borderRadius:12,
    border:"none",
    background:"linear-gradient(180deg,#e6f7ef,#cdeee0)", // más oscuro que antes
    color:"#064e3b",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.9), 0 10px 26px rgba(16,185,129,.20), 0 1px 0 rgba(16,185,129,.12)"
  },
  resumeLine: { margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: ".35px", lineHeight: 1.5 },
  resumeNoteTitle: { margin:"8px 0 0", color:"#065f46", fontSize:15, fontWeight:700, letterSpacing:.3 },
  resumeNoteTime: { margin:"2px 0 0", fontSize:16, fontWeight:800, letterSpacing:.4, animation: "blinkCelNeg 2.2s infinite" },

  // Botonera DENTRO del cuadro (no desborda nunca) + más aire lateral
  rowBtns: {
    display:"grid",
    gridTemplateColumns:"17% 66% 17%", // INFO / CONFIRMAR / PAPELERA
    gap:8,
    alignItems:"stretch",
    marginTop:10,
    padding:"0 8px" // más margen para separar la papelera del borde
  },

  // 1) INFO: azul degradado casi blanco + icono más grande
  btnInfo:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#fbfdff,#f3f8ff,#e9f1ff,#dfeaff)", // muy claro
    color:"#0b4f8a", fontWeight:800, textAlign:"center",
    border:"1px solid #38bdf8", cursor:"pointer",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.96), 0 8px 18px rgba(2,132,199,.22)",
    display:"grid", placeItems:"center", minWidth:0,
    userSelect:"none", touchAction:"manipulation"
  },
  // 3) CONFIRMAR: verde más degradado + respuesta táctil
  btnConfirm:{
    width:"100%", padding:"12px 14px", borderRadius:12,
    background:"linear-gradient(180deg,#eefdf4,#dcfce7,#c8f6d8,#b7f3ce,#a7f3d0,#86efac)", // más degradado
    color:"#065f46", fontWeight:900,
    border:"1px solid #22c55e", cursor:"pointer",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.96), 0 10px 20px rgba(34,197,94,.22)",
    minWidth:0,
    userSelect:"none", touchAction:"manipulation",
    transition:"transform .06s ease, box-shadow .15s ease",
  },
  btnConfirmActive:{ transform:"translateY(1px)", boxShadow:"inset 0 1px 0 rgba(255,255,255,.9), 0 6px 14px rgba(34,197,94,.22)" },

  // 2 & 4) PAPELERA: rojo casi blanco + más separación lateral
  btnTrash:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#ffffff,#fff7f7,#ffecec,#ffe4e4)", // casi blanco
    color:"#7f1d1d", fontWeight:800,
    border:"1px solid #ef4444", cursor:"pointer",
    display:"grid", placeItems:"center",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.96), 0 8px 18px rgba(239,68,68,.20)",
    minWidth:0,
    userSelect:"none", touchAction:"manipulation"
  },

  // Botón inferior (mismo ancho del contenedor principal)
  btnBottom:{
    width:"100%", padding:"12px 14px", borderRadius:12,
    background:"linear-gradient(180deg,#eefdf4,#dcfce7,#c8f6d8,#b7f3ce,#a7f3d0,#86efac)",
    color:"#065f46", fontWeight:900,
    border:"1px solid #22c55e", cursor:"pointer", marginTop:14,
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.96), 0 10px 20px rgba(34,197,94,.22)",
    userSelect:"none", touchAction:"manipulation"
  },

  posHeader: { margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },
  grid: (isMobile)=>({
    display:"grid",
    gridTemplateColumns: isMobile ? "repeat(3, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))",
    gap:12
  }),

  // Tarjeta seleccionada: fondo VERDE degradado + borde verde grueso
  card: (picked)=>({
    position:"relative",
    borderRadius:16, padding:10,
    background: picked ? "linear-gradient(180deg,#f1fdf6,#dcfce7)" : "linear-gradient(180deg,#f7fbff,#eef7ff)",
    border: picked ? "2.5px solid #22c55e" : "1px solid #dbeafe",
    boxShadow: picked ? "0 0 0 3px rgba(34,197,94,.18), 0 10px 24px rgba(34,197,94,.14)" : "0 2px 8px rgba(0,0,0,.06)"
  }),

  frame: (isMobile)=>({
    width:"100%", height: isMobile ? 172 : IMG_H,
    borderRadius:12, overflow:"hidden",
    background:"#ffffff", display:"grid", placeItems:"center",
    border:"1px solid #e5e7eb", position:"relative"
  }),
  img: (isMobile) => ({ width:"100%", height:"100%", objectFit: isMobile ? "cover" : "contain", background:"#ffffff", display:"block" }),

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

  counter: {
    position:"absolute", left:"50%", top:"78%", transform:"translate(-50%,-50%)",
    fontFamily:"Montserrat, system-ui, sans-serif",
    fontWeight:900, fontSize:30, color:"#0c4a6e",
    background:"rgba(56,189,248,.55)", padding:"6px 12px", borderRadius:999,
    letterSpacing:1.1, userSelect:"none", pointerEvents:"none"
  },

  // Check (✔) arriba-dereita
  okCheck: (m)=>({
    position:"absolute", top: m ? 4 : 6, right: m ? 4 : 6,
    background:"rgba(34,197,94,.94)", color:"#fff",
    borderRadius:999, padding: m ? "3px 6px" : "4px 7px",
    boxShadow:"0 2px 8px rgba(34,197,94,.28)",
    display:"grid", placeItems:"center", userSelect:"none", pointerEvents:"none"
  }),

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

/* ====== Audio ======
   - playBip(): beep cortito (selección)
   - playBell(): campana breve al confirmar */
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

  function playBip() {
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(1046.5, now); // C6
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.10); // ~100ms
    o.connect(g).connect(ctx.destination);
    o.start(now);
    o.stop(now + 0.12);
  }

  // campana: varias parciales + decaimiento
  function playBell() {
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.9;

    const partials = [
      { f: 784.0, gain: 1.0 },   // G5
      { f: 1176.0, gain: 0.5 },  // + quinta
      { f: 1568.0, gain: 0.35 }, // + octava
      { f: 2349.0, gain: 0.22 }, // brillo
    ];
    partials.forEach(p => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(p.f, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.9 * p.gain, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g).connect(ctx.destination);
      o.start(now);
      o.stop(now + dur + 0.05);
    });
  }

  return { playBip, playBell };
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

  const { playBip, playBell } = useAudio();

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
        try { playBip(); } catch {}
      }
      return n;
    });
    setLastCounterId(id);
  }

  async function saveMy11(e) {
    e?.preventDefault?.();
    if (sel.size !== 11) {
      setToast("Tes que seleccionar 11 xogadores para poder confirmar a túa aliñación");
      setTimeout(()=>setToast(""), 3000);
      return;
    }
    if (!header?.match_iso) {
      setToast("Falta o partido de referencia.");
      setTimeout(()=>setToast(""), 2000);
      return;
    }

    try {
      // campana al pulsar confirmar
      try { playBell(); } catch {}

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id || null;
      if (!uid) {
        setToast("Precisas iniciar sesión.");
        setTimeout(()=>setToast(""), 2000);
        return;
      }

      const iso = header.match_iso;
      await supabase.from("alineaciones_usuarios").delete().eq("user_id", uid).eq("match_iso", iso);

      const now = new Date().toISOString();
      const rows = [...sel].map(jid => ({ user_id: uid, jugador_id: jid, match_iso: iso, updated_at: now }));
      const { error } = await supabase.from("alineaciones_usuarios").insert(rows);
      if (error) throw error;

      setLastSavedAt(now);
      setShowOK(true);
      setToast("Aliñación gardada!");
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

          {/* Botonera dentro del cuadro, anchos exactos y sin desbordes */}
          <div style={S.rowBtns}>
            <button type="button" style={S.btnInfo} title="Información" aria-label="Información">
              {/* Icono distinto, más grande, azul */}
              <svg width={26} height={26} viewBox="0 0 24 24" aria-hidden="true" style={{display:"block"}}>
                <defs>
                  <radialGradient id="infoGlow" cx="50%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#ffffff"/><stop offset="70%" stopColor="#cfe0ff"/><stop offset="100%" stopColor="#a9c8ff"/>
                  </radialGradient>
                </defs>
                <circle cx="12" cy="12" r="9.5" fill="url(#infoGlow)" stroke="#2563eb" strokeWidth="1"/>
                <path d="M12 10v6" stroke="#1e40af" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="7.3" r="1.1" fill="#1e40af"/>
              </svg>
            </button>

            <button
              type="button"
              style={S.btnConfirm}
              onClick={(e)=>{ e.currentTarget.blur(); e.currentTarget.style.transform='translateY(1px)'; setTimeout(()=>{ e.currentTarget.style.transform=''; }, 90); return saveMy11(e); }}
              disabled={sel.size!==11}
              aria-disabled={sel.size!==11}
            >
              {confirmLabel}
            </button>

            <button type="button" style={S.btnTrash} onClick={clearMy11} title="Borrar" aria-label="Borrar">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true"
                   style={{display:"block",stroke:"#7f1d1d",strokeWidth:1.6,strokeLinecap:"round",strokeLinejoin:"round"}}>
                <path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
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
                const nameLine = (dorsal != null ? `${String(dorsal).padStart(2,"0")} · ` : "") + nombre;
                return (
                  <article key={p.id} style={S.card(picked)} onClick={()=>togglePick(p.id)}>
                    <div style={S.frame(isMobile)}>
                      <Img src={p.foto_url} alt={`Foto de ${nombre}`} isMobile={isMobile} />
                      {/* Check “visto” arriba-dereita */}
                      {picked && (
                        <span style={S.okCheck(isMobile)} aria-hidden="true">
                          <svg width={isMobile ? 16 : 20} height={isMobile ? 16 : 20} viewBox="0 0 24 24" fill="none"
                               style={{display:"block",stroke:"#ffffff",strokeWidth:2.6,strokeLinecap:"round",strokeLinejoin:"round"}}>
                            <path d="M20 6L9 17l-5-5" />
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

      <button type="button" style={S.btnBottom} onClick={saveMy11} disabled={sel.size!==11} aria-disabled={sel.size!==11}>
        {confirmLabel}
      </button>

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
          borderRadius:12, boxShadow:"0 10px 22px rgba(2,132,199,.35)", fontWeight:700,
          maxWidth:"92vw", textAlign:"center", zIndex:9999
        }}>
          {toast}
        </div>
      )}
    </main>
  );
}
