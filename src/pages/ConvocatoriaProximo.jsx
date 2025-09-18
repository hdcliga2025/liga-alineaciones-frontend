import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Utils compactas ===== */
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
    pos:    posFile || "",
    nombre: (nameFile || p.nombre || "").trim()
  };
}

/* ===== Overlays / estilos ===== */
const OVERLAY_NUMS = new Set([29,32,39]);

const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 16px", color: "#475569", fontSize: 16 }, // un poco mayor
  resumen: {
    margin:"0 0 14px", padding:"12px 14px", borderRadius:12,
    border:"1px solid #dbeafe",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)", color:"#0f172a"
  },
  resumeLine: { margin: 0, fontSize: 19, fontWeight: 400, letterSpacing: ".35px", lineHeight: 1.5 },
  posHeader: { margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },
  grid4: { display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:12 },
  card: (out)=>({
    position:"relative",
    border: out ? "2px solid rgba(220,38,38,.8)" : "1px solid #dbeafe",
    borderRadius:16, padding:10,
    boxShadow:"0 2px 8px rgba(0,0,0,.06)",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)", // celeste degradado
    cursor:"pointer", userSelect:"none"
  }),
  frame: { width:"100%", height:320, borderRadius:12, overflow:"hidden", background:"#0b1e2a", display:"grid", placeItems:"center", border:"1px solid #e5e7eb", position:"relative" },
  name: { margin:"8px 0 0", font:"700 15px/1.2 Montserrat, system-ui, sans-serif", color:"#0f172a", textAlign:"center" },
  meta: { margin:"2px 0 0", color:"#475569", fontSize:13, textAlign:"center" },
  saveFull: {
    width: "100%", padding: "14px 16px",
    borderRadius: 10, // más cuadrado
    background:"linear-gradient(180deg,#bae6fd,#7dd3fc)",
    color:"#0c4a6e", fontWeight:800, border:"none",
    cursor:"pointer", boxShadow:"0 10px 22px rgba(2,132,199,.25)"
  },
  saveInline: {
    width: "100%", padding: "14px 16px",
    borderRadius: 10, // más cuadrado
    background:"linear-gradient(180deg,#bae6fd,#7dd3fc)",
    color:"#0c4a6e", fontWeight:800, border:"none",
    cursor:"pointer", boxShadow:"0 10px 22px rgba(2,132,199,.25)"
  },
  fixedNote: {
    marginTop: 10,
    fontSize: 15,
    color: "#b91c1c", // rojo
    fontWeight: 600
  }
};

const Shade = ({ show=false }) => show ? (
  <>
    <div style={{ position:"absolute", inset:0, background:"rgba(2,6,23,.62)" }}/>
    <div style={{
      position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
      padding:"10px 14px", borderRadius:999, fontWeight:800, fontSize:12,
      letterSpacing:.4, color:"#fff",
      background:"linear-gradient(180deg, rgba(248,113,113,.92), rgba(239,68,68,.82))",
      boxShadow:"0 10px 24px rgba(0,0,0,.25)"
    }}>DESCARTADO</div>
  </>
) : null;

const NumOverlay = ({ dorsal }) => {
  const n = Number(dorsal);
  if (!OVERLAY_NUMS.has(n)) return null;
  return (
    <span style={{
      position:"absolute", top:8, left:10, fontFamily:"Montserrat, system-ui, sans-serif",
      fontWeight:600, fontSize:36, lineHeight:1, color:"#9aa4b2",
      textShadow:"0 1px 2px rgba(0,0,0,.25)", letterSpacing:"0.5px", userSelect:"none", pointerEvents:"none"
    }}>
      {n}
    </span>
  );
};

/* ===== Página ===== */
export default function ConvocatoriaProximo() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState([]);
  const [convIds, setConvIds] = useState([]);          // info ya publicada (si la hubiera)
  const [discarded, setDiscarded] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Cabecera desde Vindeiros (prioridad) o next_match (fallback)
  const [header, setHeader] = useState(null); // {equipo1,equipo2,match_iso}

  // ===== Carga inicial
  useEffect(() => {
    (async () => {
      // admin?
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id || null;
      let admin = false;
      if (uid) {
        const { data: prof } = await supabase
          .from("profiles").select("role,email").eq("id", uid).maybeSingle();
        const role = (prof?.role || "").toLowerCase();
        admin = role === "admin";
      }
      setIsAdmin(admin);

      // plantilla completa
      const { data: js } = await supabase
        .from("jugadores")
        .select("id, nombre, dorsal, foto_url")
        .order("dorsal", { ascending: true });
      setPlayers(js || []);

      // cabecera: vindeiros #1
      const { data: top } = await supabase
        .from("matches_vindeiros")
        .select("equipo1,equipo2,match_iso")
        .order("match_iso", { ascending: true }).limit(1).maybeSingle();

      if (top?.match_iso) {
        setHeader({ equipo1: cap(top.equipo1||""), equipo2: cap(top.equipo2||""), match_iso: top.match_iso });
      } else {
        const { data: nm } = await supabase
          .from("next_match")
          .select("equipo1,equipo2,match_iso")
          .eq("id",1).maybeSingle();
        if (nm?.match_iso) setHeader({ equipo1: cap(nm.equipo1||""), equipo2: cap(nm.equipo2||""), match_iso: nm.match_iso });
        else setHeader(null);
      }

      // si hubiera una convocatoria publicada, precargo por comodidad
      const { data: pub } = await supabase
        .from("convocatoria_publica")
        .select("jugador_id");
      const published = new Set((pub||[]).map(r=>r.jugador_id));
      if (admin && js?.length) {
        const allIds = new Set(js.map(p=>p.id));
        const disc = new Set([...allIds].filter(id => !published.has(id))); // activos por defecto; descarto los no publicados
        setDiscarded(disc);
        setConvIds([...published]);
      }
    })().catch(e=>console.error("[Convocatoria] init", e));
  }, []);

  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of players || []) {
      const info = finalFromAll(p);
      if (info.pos && g[info.pos]) g[info.pos].push({ ...p, ...info });
    }
    return g;
  }, [players]);

  const toggleDiscard = (id) => {
    if (!isAdmin) return;
    setDiscarded(prev => {
      const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
  };

  const { fecha: sFecha, hora: sHora } = fmtDT(header?.match_iso);

  async function saveAndPublish() {
    if (!isAdmin) return;
    if (!header) {
      setToast("Non hai datos de cabeceira. Engade en Vindeiros o seguinte encontro.");
      setTimeout(()=>setToast(""), 2500);
      return;
    }
    setSaving(true);
    try {
      const allIds = players.map(p => p.id);
      const convocados = allIds.filter(id => !discarded.has(id));
      // publicar como singleton
      await supabase.from("convocatoria_publica").delete().neq("jugador_id", "00000000-0000-0000-0000-000000000000");
      if (convocados.length) {
        const rows = convocados.map(jid => ({ jugador_id: jid, updated_at: new Date().toISOString() }));
        const { error } = await supabase.from("convocatoria_publica").insert(rows);
        if (error) throw error;
      }
      setConvIds(convocados);
      // Mensaje fijo (sin forzar navegación)
      setToast("CONFIGURACIÓN CONVOCATORIA GARDADA");
    } catch(e) {
      console.error(e);
      setToast("Erro ao gardar");
      setTimeout(()=>setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Convocatoria oficial</h1>
      <p style={S.sub}>Lista de xogadores que poderían estar na aliñación para o seguinte partido.</p>

      {/* Cabecera resumida (100% ancho) */}
      {header ? (
        <div style={S.resumen}>
          <p style={S.resumeLine}>{cap(header.equipo1)} vs {cap(header.equipo2)}</p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>
          {/* Botón superior (full-width, cuadrado) */}
          {isAdmin && (
            <div style={{ marginTop: 10 }}>
              <button
                style={S.saveInline}
                onClick={saveAndPublish}
                disabled={saving}
                aria-label="Gardar convocatoria"
              >
                {saving ? "Gardando…" : "GARDAR CONVOCATORIA"}
              </button>
            </div>
          )}
          {/* Mensaje fijo en rojo (si ya se guardó) */}
          {toast && toast.toUpperCase().includes("GARDADA") && (
            <div style={S.fixedNote}>{toast}</div>
          )}
        </div>
      ) : (
        <p style={{ margin:0 }}>Engade o seguinte encontro en Vindeiros para amosar a cabeceira.</p>
      )}

      {(["POR","DEF","CEN","DEL"]).map((k) => {
        const arr = (grouped[k] || []);
        if (!arr.length) return null;
        const label = k === "POR" ? "Porteiros" : k === "DEF" ? "Defensas" : k === "CEN" ? "Medios" : "Dianteiros";
        return (
          <section key={k}>
            <div style={S.posHeader}>{label}</div>
            <div style={S.grid4}>
              {arr.map((p) => {
                const out = discarded.has(p.id);
                const { dorsal, nombre, pos } = p;
                return (
                  <article key={p.id} style={S.card(out)} onClick={()=>toggleDiscard(p.id)} title={out?"Descartado":"Clic para descartar"}>
                    <div style={S.frame}>
                      {p.foto_url ? (
                        <>
                          <img
                            src={p.foto_url}
                            alt={`Foto de ${nombre}`}
                            style={{ width:"100%", height:"100%", objectFit:"contain", background:"#0b1e2a" }}
                            loading="lazy" decoding="async" crossOrigin="anonymous" referrerPolicy="no-referrer"
                          />
                          <NumOverlay dorsal={dorsal}/>
                          <Shade show={out}/>
                        </>
                      ) : (
                        <div style={{ color:"#cbd5e1" }}>Sen foto</div>
                      )}
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

      {isAdmin && (
        <div style={{ marginTop: 16 }}>
          <button
            style={S.saveFull}
            onClick={saveAndPublish}
            disabled={saving}
            aria-label="Gardar convocatoria ao final"
          >
            {saving ? "Gardando…" : "GARDAR CONVOCATORIA"}
          </button>
          {/* Mensaje fijo réplica bajo botón inferior si se guardó */}
          {toast && toast.toUpperCase().includes("GARDADA") && (
            <div style={S.fixedNote}>CONFIGURACIÓN CONVOCATORIA GARDADA</div>
          )}
        </div>
      )}

      {/* Toast azul solo para avisos/erros non “gardada” */}
      {toast && !toast.toUpperCase().includes("GARDADA") && (
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
