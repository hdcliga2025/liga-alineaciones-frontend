// src/pages/AlineacionOficial.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const cap = (s="") => (s || "").toUpperCase();
function fmtDT(iso) {
  if (!iso) return { fecha: "-", hora: "-" };
  try {
    const d = new Date(iso);
    return {
      fecha: d.toLocaleDateString("gl-ES", { day: "2-digit", month: "2-digit", year: "numeric" }),
      hora:  d.toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" })
    };
  } catch { return { fecha: "-", hora: "-" }; }
}
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

/* ===== Estilos: encabezado copiado de Convocatoria (mismo look & feel) ===== */
const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 12px", color: "#475569", fontSize: 16 },

  // Caja superior clonada
  resumen: {
    margin:"0 0 10px", padding:"10px 12px", borderRadius:12,
    border:"1px solid #dbeafe",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    color:"#0f172a",
    boxShadow:"0 6px 18px rgba(14,165,233,.16)"
  },
  resumeLine: { margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: ".35px", lineHeight: 1.45 },

  // Botonera igual que Convocatoria: primaria a lo largo + dos de 46px
  btnRow: { display:"grid", gridTemplateColumns:"1fr 46px 46px", gap:8, alignItems:"stretch", marginTop:10 },
  btnLoad: {
    width:"100%", padding:"10px 12px",
    borderRadius:12,
    background:"linear-gradient(180deg,#eef7ff,#e4f1ff)",
    color:"#075985", fontWeight:800,
    border:"1.5px solid #38bdf8",
    cursor:"pointer",
    boxShadow:"0 6px 16px rgba(56,189,248,.25)"
  },
  btnTrash: {
    width:"100%", padding:0,
    borderRadius:12,
    background:"#ffffff",
    color:"#7f1d1d",
    border:"1.5px solid #ef4444",
    cursor:"pointer",
    display:"grid", placeItems:"center",
    boxShadow:"0 6px 16px rgba(239,68,68,.18)"
  },
  btnInfo: {
    width:"100%", padding:0,
    borderRadius:12,
    background:"#ffffff",
    border:"1.5px solid #38bdf8",
    display:"grid", placeItems:"center",
    boxShadow:"0 6px 16px rgba(56,189,248,.18)",
    cursor:"pointer"
  },

  // Resto de la página (tarjetas)
  posHeader: { margin:"14px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#7f1d1d", borderLeft:"4px solid #fecaca", borderBottom:"2px solid #fecaca" },
  grid: (isMobile) => ({
    display:"grid",
    gridTemplateColumns: isMobile ? "repeat(3, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))",
    gap:12
  }),
  card: (picked)=>({
    position:"relative",
    border: "1px solid #fecaca",
    borderRadius:16, padding:10,
    background: picked ? "linear-gradient(180deg,#fee2e2,#fecaca)" : "#fff",
    boxShadow: picked ? "0 0 0 2px rgba(239,68,68,.25), 0 8px 26px rgba(239,68,68,.18)" : "0 2px 8px rgba(0,0,0,.06)"
  }),
  frame: (isMobile)=>({
    width:"100%", height: isMobile ? 172 : 320,
    borderRadius:12, overflow:"hidden", background:"#ffffff",
    display:"grid", placeItems:"center", border:"1px solid #e5e7eb", position:"relative"
  }),
  img: { width:"100%", height:"100%", objectFit:"contain", background:"#ffffff" },
  name: { margin:"8px 0 0", font:"700 15px/1.2 Montserrat, system-ui, sans-serif", color:"#0f172a", textAlign:"center" },
  meta: { margin:"2px 0 0", color:"#475569", fontSize:13, textAlign:"center" },

  // Contador superpuesto
  counter: {
    position:"absolute", left:"50%", top:"78%", transform:"translate(-50%,-50%)",
    fontFamily:"Montserrat, system-ui, sans-serif",
    fontWeight:900, fontSize:30, color:"#0c4a6e",
    background:"rgba(56,189,248,.55)", padding:"6px 12px", borderRadius:999,
    letterSpacing:1.1, userSelect:"none", pointerEvents:"none"
  },

  // Modal info
  modalBg:{ position:"fixed", inset:0, background:"rgba(2,6,23,.45)", display:"grid", placeItems:"center", zIndex:9999 },
  modal:{ width:"min(92vw,560px)", background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, boxShadow:"0 18px 48px rgba(0,0,0,.28)", padding:"16px 14px", position:"relative" },
  modalClose:{ position:"absolute", right:8, top:8, width:34, height:34, borderRadius:10, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", display:"grid", placeItems:"center" },
  modalTitle:{ margin:"0 0 8px", font:"800 18px/1.2 Montserrat,system-ui", color:"#0f172a" },
  modalText:{ margin:0, font:"500 14px/1.35 Montserrat,system-ui", color:"#0f172a" },
};

export default function AlineacionOficial(){
  const [header, setHeader] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  const [sel, setSel] = useState(new Set());
  const [lastCounterId, setLastCounterId] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const max11 = 11;

  useEffect(() => {
    let raf=0;
    const onR=()=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(()=> setIsMobile(window.innerWidth<=560)); };
    window.addEventListener("resize", onR);
    return ()=>{ window.removeEventListener("resize", onR); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    (async () => {
      const { data: top } = await supabase
        .from("matches_vindeiros")
        .select("equipo1,equipo2,match_iso")
        .order("match_iso", { ascending: true }).limit(1).maybeSingle();
      if (top?.match_iso) setHeader({ equipo1: cap(top.equipo1||""), equipo2: cap(top.equipo2||""), match_iso: top.match_iso });
      else {
        const { data: nm } = await supabase.from("next_match").select("equipo1,equipo2,match_iso").eq("id",1).maybeSingle();
        if (nm?.match_iso) setHeader({ equipo1: cap(nm.equipo1||""), equipo2: cap(nm.equipo2||""), match_iso: nm.match_iso });
      }

      const { data: js } = await supabase
        .from("jugadores")
        .select("id, nombre, dorsal, foto_url")
        .order("dorsal", { ascending: true });
      setPlayers(js || []);
    })();
  }, []);

  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of players || []) {
      const { pos } = finalFromAll(p);
      if (pos && g[pos]) g[pos].push(p);
    }
    return g;
  }, [players]);

  const { fecha: sFecha, hora: sHora } = fmtDT(header?.match_iso);

  function togglePick(id) {
    setSel(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else { if (n.size >= max11) return prev; n.add(id); }
      return n;
    });
    setLastCounterId(id);
  }

  async function loadOfficial() {
    if (sel.size !== 11) return;
    // TODO: guardar once oficial → supabase (tabla alineacion_oficial) – ya existente en tu backend
    // Mantengo la función como estaba (no cambiamos lógica aquí).
  }
  function resetAll(){ setSel(new Set()); setLastCounterId(null); }

  const loadLabel = isMobile ? (sel.size===11 ? "CARGAR ONCE OFICIAL" : `CARGAR ONCE OFICIAL (${sel.size}/11)`)
                             : (sel.size===11 ? "CARGAR ALIÑACIÓN OFICIAL" : `CARGAR ALIÑACIÓN OFICIAL (${sel.size}/11)`);

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Aliñación oficial</h1>
      <p style={S.sub}>Os once xogadores que saen de inicio neste partido.</p>

      {/* === Encabezado con el mismo diseño que Convocatoria === */}
      {header && (
        <section style={S.resumen}>
          <p style={S.resumeLine}>
            <strong>{header ? header.equipo1 : ""}</strong> vs <strong>{header ? header.equipo2 : ""}</strong>
          </p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>

          <div style={S.btnRow}>
            <button style={S.btnLoad} onClick={loadOfficial} disabled={sel.size!==11}>{loadLabel}</button>

            <button style={S.btnTrash} onClick={resetAll} title="Restaurar" aria-label="Restaurar">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
                   style={{ display:"block", fill:"none", stroke:"#ef4444", strokeWidth:1.8, strokeLinecap:"round", strokeLinejoin:"round" }}>
                <path d="M3 6h18"/>
                <path d="M8 6V4h8v2"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>

            <button style={S.btnInfo} onClick={()=>setShowInfo(true)} title="Información" aria-label="Información">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
                   style={{ display:"block", fill:"none", stroke:"#0ea5e9", strokeWidth:1.6, strokeLinecap:"round", strokeLinejoin:"round" }}>
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 10v6M12 7h.01"/>
              </svg>
            </button>
          </div>
        </section>
      )}

      {["POR","DEF","CEN","DEL"].map(k => {
        const arr = (grouped[k] || []);
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
                      <img src={p.foto_url} alt={`Foto de ${nombre}`} style={S.img} loading="lazy" decoding="async" />
                      {lastCounterId === p.id && <span style={S.counter}>{`${sel.size}/11`}</span>}
                    </div>
                    <p style={S.name}>{dorsal != null ? `${String(dorsal).padStart(2,"0")} · ` : ""}{nombre}</p>
                    <p style={S.meta}>{pos}</p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Botón inferior mantiene naming y función */}
      <button style={S.btnLoad} onClick={loadOfficial} disabled={sel.size!==11}>{loadLabel}</button>

      {/* Modal información */}
      {showInfo && (
        <div style={S.modalBg} role="dialog" aria-modal="true" aria-label="Información aliñación oficial">
          <div style={S.modal}>
            <button style={S.modalClose} onClick={()=>setShowInfo(false)} aria-label="Pechar">✕</button>
            <h3 style={S.modalTitle}>Información</h3>
            <p style={S.modalText}>
              Selecciona 11 xogadores para cargar a aliñación oficial deste encontro. Podes restablecer a selección co
              botón de lixo. Esta acción establecerá a aliñación oficial que se cruzará coas aliñacións enviadas polas usuarias.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
