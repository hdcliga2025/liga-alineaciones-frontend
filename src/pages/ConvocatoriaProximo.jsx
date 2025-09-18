import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Utils ===== */
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
  sub: { margin: "0 0 18px", color: "#475569", fontSize: 16 },

  headerRow: (isNarrow) => ({
    display: "grid",
    gridTemplateColumns: isNarrow ? "1fr" : "70% 30%",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  }),
  resumen: {
    padding:"12px 14px",
    borderRadius:12,
    border:"1px solid #dbeafe",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    color:"#0f172a",
    minHeight: 78,
    display: "grid",
    alignContent: "center"
  },
  resumeLine: { margin: 0, fontSize: 19, fontWeight: 400, letterSpacing: ".35px", lineHeight: 1.5 },

  posHeader: { margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },
  grid4: { display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:12 },
  card: (out)=>({
    position:"relative",
    border: out ? "2px solid rgba(220,38,38,.8)" : "1px solid #eef2ff",
    borderRadius:16, padding:10, boxShadow:"0 2px 8px rgba(0,0,0,.06)", background:"#fff",
    cursor:"pointer", userSelect:"none"
  }),
  frame: { width:"100%", height:320, borderRadius:12, overflow:"hidden", background:"#0b1e2a", display:"grid", placeItems:"center", border:"1px solid #e5e7eb", position:"relative" },
  name: { margin:"8px 0 0", font:"700 15px/1.2 Montserrat, system-ui, sans-serif", color:"#0f172a", textAlign:"center" },
  meta: { margin:"2px 0 0", color:"#475569", fontSize:13, textAlign:"center" },

  btn: (full)=>({
    width: full ? "100%" : "auto",
    padding: full ? "14px 16px" : "12px 14px",
    borderRadius: 14,
    background:"linear-gradient(180deg,#bae6fd,#7dd3fc)",
    color:"#0c4a6e",
    fontWeight:800,
    border:"none",
    cursor:"pointer",
    boxShadow: full ? "0 10px 22px rgba(2,132,199,.25)" : "0 6px 16px rgba(2,132,199,.2)",
    whiteSpace:"nowrap"
  }),

  savedMsg: { color:"#dc2626", fontSize:19, fontWeight:600, margin:"10px 0 0" }
};

const Shade = ({ show=false }) => show ? (
  <>
    <div style={{ position:"absolute", inset:0, background:"rgba(2,6,23,.58)" }}/>
    <div style={{
      position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
      padding:"10px 14px", borderRadius:999, fontWeight:700, fontSize:12,
      letterSpacing:.4, color:"#fff",
      background:"linear-gradient(180deg, rgba(248,113,113,.95), rgba(239,68,68,.85))",
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
  const [discarded, setDiscarded] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [header, setHeader] = useState(null);
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 680 : false
  );

  useEffect(() => {
    const onR = () => setIsNarrow(window.innerWidth <= 680);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // ===== Carga inicial (paralela)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [{ data: sess }, jugadoresRes, vindeirosRes] = await Promise.all([
          supabase.auth.getSession(),
          supabase.from("jugadores").select("id, nombre, dorsal, foto_url").order("dorsal", { ascending: true }),
          supabase.from("matches_vindeiros").select("equipo1,equipo2,match_iso").order("match_iso",{ascending:true}).limit(1).maybeSingle(),
        ]);

        if (!alive) return;

        const uid = sess?.session?.user?.id || null;
        if (uid) {
          const { data: prof } = await supabase
            .from("profiles").select("role").eq("id", uid).maybeSingle();
          const role = (prof?.role || "").toLowerCase();
          setIsAdmin(role === "admin");
        } else {
          setIsAdmin(false);
        }

        setPlayers(jugadoresRes?.data || []);

        const top = vindeirosRes || null;
        if (top?.match_iso) {
          setHeader({ equipo1: cap(top.equipo1||""), equipo2: cap(top.equipo2||""), match_iso: top.match_iso });
        } else {
          setHeader(null);
        }
      } catch (e) {
        console.error("[Convocatoria] init", e);
      }
    })();
    return () => { alive = false; };
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
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const { fecha: sFecha, hora: sHora } = fmtDT(header?.match_iso);

  async function saveAndPublish() {
    if (!isAdmin || saving) return;
    setSaving(true);
    try {
      const allIds = players.map(p => p.id);
      const convocados = allIds.filter(id => !discarded.has(id));

      // Publicación simple (borra y crea)
      await supabase
        .from("convocatoria_publica")
        .delete()
        .neq("jugador_id","00000000-0000-0000-0000-000000000000");

      if (convocados.length) {
        const rows = convocados.map(jid => ({ jugador_id: jid, updated_at: new Date().toISOString() }));
        const { error } = await supabase.from("convocatoria_publica").insert(rows);
        if (error) throw error;
      }

      setSaved(true); // mensaje fijo (arriba y abajo)
    } catch (e) {
      console.error("[Convocatoria] save", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Convocatoria oficial</h1>
      <p style={S.sub}>Lista de xogadores que poderían estar na aliñación para o seguinte partido.</p>

      {/* Cabecera al 70% + botón al 30% */}
      {header && (
        <div style={S.headerRow(isNarrow)}>
          <div style={S.resumen}>
            <p style={S.resumeLine}>{cap(header.equipo1)} vs {cap(header.equipo2)}</p>
            <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>
          </div>

          {isAdmin && (
            <div style={{ display:"flex", alignItems:"center", justifyContent: isNarrow ? "flex-start" : "flex-end" }}>
              <button
                style={S.btn(false)}
                onClick={saveAndPublish}
                disabled={saving}
                aria-label="Gardar convocatoria"
              >
                {saving ? "Gardando…" : "GARDAR CONVOCATORIA"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mensaje fijo superior si ya se guardó */}
      {saved && (
        <p style={S.savedMsg}>CONFIGURACIÓN DA CONVOCATORIA GARDADA</p>
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
                  <article
                    key={p.id}
                    style={S.card(out)}
                    onClick={()=>toggleDiscard(p.id)}
                    title={out ? "Descartado (clic para restaurar)" : "Clic para descartar"}
                  >
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
                    <p style={S.name}>
                      {dorsal != null ? `${String(dorsal).padStart(2,"0")} · ` : ""}{nombre}
                    </p>
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
            style={S.btn(true)}
            onClick={saveAndPublish}
            disabled={saving}
            aria-label="Gardar convocatoria (inferior)"
          >
            {saving ? "Gardando…" : "GARDAR CONVOCATORIA"}
          </button>

          {/* Mensaje fijo inferior idéntico */}
          {saved && (
            <p style={{ ...S.savedMsg, textAlign:"center", marginTop: 10 }}>
              CONFIGURACIÓN DA CONVOCATORIA GARDADA
            </p>
          )}
        </div>
      )}
    </main>
  );
}
