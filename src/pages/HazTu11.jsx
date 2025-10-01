// src/pages/HazTu11.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
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

const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 12px", color: "#475569", fontSize: 16, fontWeight: 400 },

  resumen: {
    margin:"0 0 12px", padding:"12px 14px", borderRadius:12,
    border:"2px solid #38bdf8",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    color:"#0f172a"
  },
  resumeLine: { margin: 0, fontSize: 19, fontWeight: 500, letterSpacing: ".35px", lineHeight: 1.5 },

  topRow: { display:"grid", gridTemplateColumns:"15% 70% 15%", gap:8, alignItems:"stretch", margin:"8px 0 12px" },
  btnInfo: {
    width:"100%", padding:"9px 12px",
    borderRadius:10,
    background:"linear-gradient(180deg,#dbeafe,#bfdbfe)",
    color:"#0b4f8a", fontWeight:800, textAlign:"center",
    border:"3px solid #38bdf8",
    cursor:"pointer", display:"grid", placeItems:"center"
  },
  btnConfirm: {
    width:"100%", padding:"9px 12px",
    borderRadius:10,
    background:"linear-gradient(180deg,#e7f6ff,#cfeeff)",
    color:"#075985", fontWeight:800,
    border:"3px solid #38bdf8",
    cursor:"pointer"
  },
  btnTrash: {
    width:"100%", padding:"9px 12px",
    borderRadius:10,
    background:"linear-gradient(180deg,#ffd8d8,#ffbcbc)",
    color:"#7f1d1d", fontWeight:800,
    border:"3px solid #ef4444",
    cursor:"pointer", display:"grid", placeItems:"center"
  },

  btnBottom: {
    width:"100%", padding:"9px 12px",
    borderRadius:10,
    background:"linear-gradient(180deg,#e7f6ff,#cfeeff)",
    color:"#075985", fontWeight:800,
    border:"3px solid #38bdf8",
    cursor:"pointer", marginTop:14
  },

  posHeader: { margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },
  grid: (isMobile)=>({
    display:"grid",
    gridTemplateColumns: isMobile ? "repeat(3, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))",
    gap:12
  }),

  card: (picked)=>({
    display:"grid", gridTemplateRows: `${IMG_H}px auto`,
    background: picked ? "#e6f4ff" : "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    border: picked ? "2px solid #38bdf8" : "1px solid #dbeafe",
    borderRadius:16, padding:10,
    boxShadow: picked ? "0 0 0 2px rgba(56,189,248,.35), 0 8px 26px rgba(56,189,248,.25)" : "0 2px 8px rgba(0,0,0,.06)",
    alignItems:"center", textAlign:"center", position:"relative"
  }),
  frame: (isMobile)=>({
    position:"relative", width:"100%", height: isMobile ? 172 : IMG_H,
    borderRadius:12, display:"grid", placeItems:"center",
    background:"#ffffff", border:"1px solid #e5e7eb", overflow:"hidden"
  }),
  img: { width:"100%", height:"100%", objectFit:"contain", background:"#ffffff" },
  name: { margin:"8px 0 0", font:"700 15px/1.2 Montserrat, system-ui, sans-serif", color:"#0f172a" },
  meta: { margin:"2px 0 0", color:"#475569", fontSize:13 },

  counter: {
    position:"absolute", left:"50%", top:"78%", transform:"translate(-50%,-50%)",
    fontFamily:"Montserrat, system-ui, sans-serif",
    fontWeight:900, fontSize:30, color:"#0c4a6e",
    background:"rgba(56,189,248,.55)", padding:"6px 12px", borderRadius:999,
    letterSpacing:1.1, userSelect:"none", pointerEvents:"none"
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

function Img({ src, alt }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" style={S.img} crossOrigin="anonymous" referrerPolicy="no-referrer" />;
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

      // Si hay alineación previa del usuario para este partido, precargarla
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id || null;
        const keyIso = (top?.match_iso || (await supabase.from("next_match").select("match_iso").eq("id",1).maybeSingle())?.data?.match_iso);
        if (uid && keyIso) {
          const { data: prev } = await supabase
            .from("alineaciones_usuarios")
            .select("jugador_id")
            .eq("user_id", uid)
            .eq("match_iso", keyIso);
          if (prev && prev.length) setSel(new Set(prev.map(r=>r.jugador_id)));
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
      // Borramos o 11 previo do usuario para este partido e inserimos o novo (unha fila por xogador).
      await supabase.from("alineaciones_usuarios").delete().eq("user_id", uid).eq("match_iso", iso);

      const now = new Date().toISOString();
      const rows = [...sel].map(jid => ({ user_id: uid, jugador_id: jid, match_iso: iso, updated_at: now }));
      const { error } = await supabase.from("alineaciones_usuarios").insert(rows);
      if (error) throw error;

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

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Fai aquí a túa aliñación</h1>
      <p style={S.sub}>Aquí é onde demostras o Giráldez que levas dentro.</p>

      {header && (
        <div style={S.resumen}>
          <p style={S.resumeLine}>{cap(header.equipo1)} vs {cap(header.equipo2)}</p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>
        </div>
      )}

      <div style={S.topRow}>
        <button style={S.btnInfo} title="Información" aria-label="Información"><strong>INFO</strong></button>
        <button style={S.btnConfirm} onClick={saveMy11} disabled={sel.size!==11}>{confirmLabel}</button>
        <button style={S.btnTrash} onClick={clearMy11} title="Borrar" aria-label="Borrar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 6h18" stroke="#7f1d1d" strokeWidth="3.2" strokeLinecap="round"/>
            <path d="M8 6V4h8v2" stroke="#7f1d1d" strokeWidth="3.2" strokeLinecap="round"/>
            <path d="M19 6l-1 14H6L5 6" stroke="#7f1d1d" strokeWidth="3.2" strokeLinecap="round"/>
            <path d="M10 11v6M14 11v6" stroke="#7f1d1d" strokeWidth="3.2" strokeLinecap="round"/>
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
                return (
                  <article key={p.id} style={S.card(picked)} onClick={()=>togglePick(p.id)}>
                    <div style={S.frame(isMobile)}>
                      <Img src={p.foto_url} alt={`Foto de ${nombre}`}/>
                      {lastCounterId === p.id && <span style={S.counter}>{`${sel.size}/11`}</span>}
                    </div>
                    <div>
                      <p style={S.name}>{dorsal != null ? `${String(dorsal).padStart(2,"0")} · ` : ""}{nombre}</p>
                      <p style={S.meta}>{pos}</p>
                    </div>
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
