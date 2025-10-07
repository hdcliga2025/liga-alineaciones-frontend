// src/pages/HazTu11.jsx
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* Utils (comparten patrón con outras páxinas) */
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
    return () => {
      window.removeEventListener("resize", onR);
      document.removeEventListener("visibilitychange", onR);
      cancelAnimationFrame(raf);
    };
  }, deps);
  return { fontSize };
}

const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 12px", color: "#475569", fontSize: 16, fontWeight: 400 },

  // Cuadro de texto SIN línea de contorno
  resumen: {
    margin:"0 0 12px", padding:"12px 14px", borderRadius:12,
    border:"none",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    color:"#0f172a",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.9), 0 8px 20px rgba(14,165,233,.18), 0 1px 0 rgba(14,165,233,.14)"
  },
  resumeLine: { margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: ".35px", lineHeight: 1.5 },
  resumeNoteTitle: { margin:"8px 0 0", color:"#475569", fontSize:15, fontWeight:700, letterSpacing:.3 },
  resumeNoteTime: { margin:"2px 0 0", color:"#0b1220", fontSize:16, fontWeight:800, letterSpacing:.4 },

  // Botonera: en móvil bajo el cuadro y dentro de sus márgenes
  topRow: (m)=>({
    display:"grid",
    gridTemplateColumns: m ? "1fr 1fr 1fr" : "15% 70% 15%",
    gap:8, alignItems:"stretch", margin:"8px 0 12px"
  }),

  // Todos los botones con contorno simple (1px)
  btnInfo:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"#fff", color:"#0b4f8a", fontWeight:800, textAlign:"center",
    border:"1px solid #38bdf8", cursor:"pointer",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.95), 0 3px 8px rgba(2,132,199,.18)",
    display:"grid", placeItems:"center", gap:6
  },
  btnConfirm:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#e7f6ff,#cfeeff)", color:"#075985", fontWeight:800,
    border:"1px solid #38bdf8", cursor:"pointer",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.9), 0 4px 12px rgba(56,189,248,.22)"
  },
  btnTrash:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#ffffff,#fee2e2)", color:"#7f1d1d", fontWeight:800,
    border:"1px solid #ef4444", cursor:"pointer",
    display:"grid", placeItems:"center",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.95), 0 3px 10px rgba(239,68,68,.20)"
  },

  btnBottom:{
    width:"100%", padding:"10px 12px", borderRadius:12,
    background:"linear-gradient(180deg,#e7f6ff,#cfeeff)", color:"#075985", fontWeight:800,
    border:"1px solid #38bdf8", cursor:"pointer", marginTop:14,
    boxShadow:"inset 0 1px 0 rgba(255,255,255,.9), 0 4px 12px rgba(56,189,248,.22)"
  },

  posHeader: { margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },
  grid: (isMobile)=>({
    display:"grid",
    gridTemplateColumns: isMobile ? "repeat(3, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))",
    gap:12
  }),

  // Tarjeta: seleccionada = celeste plano SIN degradado
  card: (picked)=>({
    position:"relative",
    borderRadius:16, padding:10,
    background: picked ? "#e0f2fe" : "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    border: picked ? "1px solid #38bdf8" : "1px solid #dbeafe",
    boxShadow: picked ? "0 0 0 2px rgba(56,189,248,.25), 0 8px 20px rgba(56,189,248,.18)" : "0 2px 8px rgba(0,0,0,.06)"
  }),

  // Frame como en Alineación Oficial: 172 móvil / 320 desktop; cover móvil / contain desktop
  frame: (isMobile)=>({
    width:"100%", height: isMobile ? 172 : IMG_H,
    borderRadius:12, overflow:"hidden",
    background:"#ffffff", display:"grid", placeItems:"center",
    border:"1px solid #e5e7eb", position:"relative"
  }),
  img: (isMobile) => ({ width:"100%", height:"100%", objectFit: isMobile ? "cover" : "contain", background:"#ffffff", display:"block" }),

  // Nombre: desktop igual; móvil con autofit 2 líneas (como Alineación Oficial)
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

  // Badge "pulgar hacia arriba" (OK selección) — móvil más pequeño y pegado a esquina
  okThumbDesktop: {
    position:"absolute", top:8, right:8,
    background:"rgba(56,189,248,.95)", color:"#fff",
    borderRadius:999, padding:"3px 6px",
    font:"700 12px/1 Montserrat,system-ui,sans-serif",
    boxShadow:"0 2px 8px rgba(56,189,248,.35)",
    display:"grid", placeItems:"center", userSelect:"none", pointerEvents:"none"
  },
  okThumbMobile: {
    position:"absolute", top:3, right:3,
    background:"rgba(56,189,248,.98)", color:"#fff",
    borderRadius:999, padding:"2px 5px",
    font:"700 10.5px/1 Montserrat,system-ui,sans-serif",
    boxShadow:"0 1px 4px rgba(56,189,248,.35)",
    display:"grid", placeItems:"center", userSelect:"none", pointerEvents:"none"
  },

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

export default function HazTu11() {
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);

  const [sel, setSel] = useState(new Set());
  const [lastCounterId, setLastCounterId] = useState(null);
  const [showOK, setShowOK] = useState(false);
  const [toast, setToast] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null); // registro última aliñación
  const max11 = 11;

  useEffect(() => {
    let raf=0;
    const onR=()=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(()=> setIsMobile(window.innerWidth<=560)); };
    window.addEventListener("resize", onR);
    return ()=>{ window.removeEventListener("resize", onR); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    (async () => {
      // Obtemos convocatoria publicada
      const { data: pub } = await supabase.from("convocatoria_publica").select("jugador_id");
      const ids = (pub || []).map(r => r.jugador_id);

      // match de referencia
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

      // Alineación previa do usuario (para timestamp e picks)
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
            // última actualización do conxunto
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
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else {
        if (n.size >= max11) return prev;
        n.add(id);
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
      // Borrar e inserir novo 11
      await supabase.from("alineaciones_usuarios").delete().eq("user_id", uid).eq("match_iso", iso);

      const now = new Date().toISOString();
      const rows = [...sel].map(jid => ({ user_id: uid, jugador_id: jid, match_iso: iso, updated_at: now }));
      const { error } = await supabase.from("alineaciones_usuarios").insert(rows);
      if (error) throw error;

      setLastSavedAt(now); // rexistro da última aliñación
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

  const confirmLabel = isMobile ? (sel.size===11 ? "CONFIRMAR" : `CONFIRMAR (${sel.size}/11)`) : (sel.size===11 ? "CONFIRMAR ALIÑACIÓN" : `CONFIRMAR ALIÑACIÓN (${sel.size}/11)`);
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
      <h1 style={S.h1}>Fai aquí a túa aliñación</h1>
      <p style={S.sub}>Aquí é onde demostras o Giráldez que levas dentro.</p>

      {header && (
        <div style={S.resumen}>
          <p style={S.resumeLine}><strong>{cap(header.equipo1)}</strong> vs <strong>{cap(header.equipo2)}</strong></p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>

          {/* 3) Rexistro última aliñación */}
          <p style={S.resumeNoteTitle}>Rexistro da túa última aliñación:</p>
          <p style={S.resumeNoteTime}>{last ? `${last.f} ás ${last.h}` : "-"}</p>
        </div>
      )}

      {/* 7 & móvil: botonera baixo o cadro e respectando marxes */}
      <div style={S.topRow(isMobile)}>
        <button
          style={S.btnInfo}
          title="Información"
          aria-label="Información"
        >
          {/* 5) Botón Info blanco + icono 'i' azul */}
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"
               style={{display:"block",fill:"none",stroke:"#0b4f8a",strokeWidth:1.6}}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 10v6" />
            <path d="M12 7.5h.01" />
          </svg>
        </button>

        <button style={S.btnConfirm} onClick={saveMy11} disabled={sel.size!==11}>
          {confirmLabel}
        </button>

        <button style={S.btnTrash} onClick={clearMy11} title="Borrar" aria-label="Borrar">
          {/* 7) Icono papelera SIN bold */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
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

                    {/* 1) Pulgar arriba en esquina superior dereita cando está seleccionado */}
                    <div style={S.frame(isMobile)}>
                      <Img src={p.foto_url} alt={`Foto de ${nombre}`} isMobile={isMobile} />
                      {picked && (
                        <span style={isMobile ? S.okThumbMobile : S.okThumbDesktop} aria-hidden="true">
                          {/* pulgar (SVG) */}
                          <svg width={isMobile ? 12 : 14} height={isMobile ? 12 : 14} viewBox="0 0 24 24" fill="none"
                               style={{display:"block",stroke:"#ffffff",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}}>
                            <path d="M14 10V5a3 3 0 0 0-3-3l-2 7" />
                            <path d="M5 12h13.28a2 2 0 0 1 1.96 2.39l-1 5A2 2 0 0 1 17.28 21H9a4 4 0 0 1-4-4v-5z" />
                          </svg>
                        </span>
                      )}
                      {/* contador como antes */}
                      {lastCounterId === p.id && <span style={S.counter}>{`${sel.size}/11`}</span>}
                    </div>

                    {/* 2) Sen espazos innecesarios: mesmos marxes que Alineación Oficial */}
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
