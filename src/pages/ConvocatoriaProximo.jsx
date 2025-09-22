import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
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
    pos:    (posFile || ""),
    nombre: (nameFile || p.nombre || "").trim()
  };
}

/* ===== Estilos ===== */
const OVERLAY_NUMS = new Set([29,32,39]);
const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 16px", color: "#475569", fontSize: 16 },
  resumen: {
    margin:"0 0 14px", padding:"12px 14px", borderRadius:12,
    border:"1px solid #dbeafe",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)", color:"#0f172a"
  },
  resumeLine: { margin: 0, fontSize: 19, fontWeight: 400, letterSpacing: ".35px", lineHeight: 1.5 },
  posHeader: { margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },

  grid4: { display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:12 },

  card: (active)=>({
    position:"relative",
    border: active ? "2px solid #38bdf8" : "1px solid #dbeafe",
    borderRadius:16,
    padding:10,
    boxShadow: active ? "0 8px 20px rgba(56,189,248,.30)" : "0 2px 8px rgba(0,0,0,.06)",
    background: active
      ? "linear-gradient(180deg,#e0f2fe,#bae6fd)"  // celeste máis marcado cando está convocado
      : "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    cursor:"pointer", userSelect:"none"
  }),

  frame: (active)=>({
    width:"100%", height:320, borderRadius:12, overflow:"hidden",
    background:"#0b1e2a",
    display:"grid", placeItems:"center",
    border: active ? "2px solid #38bdf8" : "1px solid #e5e7eb",
    position:"relative"
  }),

  name: { margin:"8px 0 0", font:"700 15px/1.2 Montserrat, system-ui, sans-serif", color:"#0f172a", textAlign:"center" },
  meta: { margin:"2px 0 0", color:"#475569", fontSize:13, textAlign:"center" },

  btnPrimary: {
    width: "100%", padding: "14px 16px",
    borderRadius: 10,
    background:"linear-gradient(180deg,#bae6fd,#7dd3fc)",
    color:"#0c4a6e", fontWeight:800, border:"1px solid #38bdf8",
    cursor:"pointer", boxShadow:"0 10px 22px rgba(2,132,199,.25)"
  },

  toastFixedBlue: {
    position:"fixed", bottom:18, left:"50%", transform:"translateX(-50%)",
    background:"#0ea5e9", color:"#fff", padding:"10px 16px",
    borderRadius:12, boxShadow:"0 10px 22px rgba(2,132,199,.35)", fontWeight:700, zIndex:9999
  },

  badgeNum: {
    position:"absolute", top:8, left:10,
    fontFamily:"Montserrat, system-ui, sans-serif",
    fontWeight:600, fontSize:36, lineHeight:1, color:"#9aa4b2",
    textShadow:"0 1px 2px rgba(0,0,0,.25)", letterSpacing:"0.5px", userSelect:"none", pointerEvents:"none"
  },

  labelConvocado: {
    position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
    padding:"10px 14px", borderRadius:999, fontWeight:900, fontSize:12,
    letterSpacing:.5, color:"#083344",
    background:"linear-gradient(180deg, rgba(125,211,252,.95), rgba(56,189,248,.95))",
    boxShadow:"0 10px 24px rgba(2,132,199,.35)", pointerEvents:"none"
  }
};

function NumOverlay({ dorsal }) {
  const n = Number(dorsal);
  if (!OVERLAY_NUMS.has(n)) return null;
  return <span style={S.badgeNum}>{n}</span>;
}

function ConvocadoOverlay({ show=false }) {
  return show ? <div style={S.labelConvocado}>CONVOCADO</div> : null;
}

/* ===== Página ===== */
export default function ConvocatoriaProximo() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState(new Set()); // ← NUEVO: selección explícita de convocados
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [header, setHeader] = useState(null); // {equipo1,equipo2,match_iso}

  // ===== Carga inicial (sin preselecciones automáticas)
  useEffect(() => {
    (async () => {
      // admin?
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id || null;
      let admin = false;
      if (uid) {
        const { data: prof } = await supabase
          .from("profiles").select("role").eq("id", uid).maybeSingle();
        admin = (prof?.role || "").toLowerCase() === "admin";
      }
      setIsAdmin(admin);

      // plantilla completa
      const { data: js } = await supabase
        .from("jugadores")
        .select("id, nombre, dorsal, foto_url")
        .order("dorsal", { ascending: true });
      setPlayers(js || []);

      // cabecera: vindeiros #1 (fallback a next_match)
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

      // Nota: NO traemos convocatoria_publica para preseleccionar:
      // el admin debe marcar manualmente los convocados.
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

  const toggleSelect = (id) => {
    if (!isAdmin) return;
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const { fecha: sFecha, hora: sHora } = fmtDT(header?.match_iso);

  async function saveAndPublish() {
    if (!isAdmin) return;
    if (!header) {
      setToast("Engade en Vindeiros o seguinte encontro antes de gardar.");
      setTimeout(()=>setToast(""), 2500);
      return;
    }
    setSaving(true);
    try {
      // Publicar SOLO os seleccionados:
      const ids = [...selected];

      // Limpiamos publicación anterior
      await supabase
        .from("convocatoria_publica")
        .delete()
        .neq("jugador_id", "00000000-0000-0000-0000-000000000000");

      if (ids.length) {
        const rows = ids.map(jid => ({ jugador_id: jid, updated_at: new Date().toISOString() }));
        const { error } = await supabase.from("convocatoria_publica").insert(rows);
        if (error) throw error;
      }

      // Feedback y redirección automática a HazTu11
      setToast("Convocatoria gardada. Cargando Fai aquí a túa aliñación…");
      setTimeout(() => route("/haz-tu-11"), 600);
    } catch(e) {
      console.error(e);
      setToast("Erro ao gardar a convocatoria.");
      setTimeout(()=>setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Convocatoria oficial</h1>
      <p style={S.sub}>Preme en cada xogador para **convocalo**. Garda para publicar.</p>

      {header ? (
        <div style={S.resumen}>
          <p style={S.resumeLine}>{cap(header.equipo1)} vs {cap(header.equipo2)}</p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>

          {isAdmin && (
            <div style={{ marginTop: 10 }}>
              <button
                style={S.btnPrimary}
                onClick={saveAndPublish}
                disabled={saving}
                aria-label="Gardar convocatoria"
              >
                {saving ? "Gardando…" : "GARDAR CONVOCATORIA"}
              </button>
            </div>
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
                const { dorsal, nombre, pos } = p;
                const active = selected.has(p.id);
                return (
                  <article
                    key={p.id}
                    style={S.card(active)}
                    onClick={()=>toggleSelect(p.id)}
                    title={active ? "Convocado" : "Clic para convocar"}
                  >
                    <div style={S.frame(active)}>
                      {p.foto_url ? (
                        <>
                          <img
                            src={p.foto_url}
                            alt={`Foto de ${nombre}`}
                            style={{ width:"100%", height:"100%", objectFit:"contain", background:"#0b1e2a" }}
                            loading="lazy" decoding="async" crossOrigin="anonymous" referrerPolicy="no-referrer"
                          />
                          <NumOverlay dorsal={dorsal}/>
                          <ConvocadoOverlay show={active}/>
                        </>
                      ) : (
                        <>
                          <div style={{ color:"#cbd5e1" }}>Sen foto</div>
                          <ConvocadoOverlay show={active}/>
                        </>
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
            style={S.btnPrimary}
            onClick={saveAndPublish}
            disabled={saving}
            aria-label="Gardar convocatoria ao final"
          >
            {saving ? "Gardando…" : "GARDAR CONVOCATORIA"}
          </button>
        </div>
      )}

      {toast && (
        <div role="status" aria-live="polite" style={S.toastFixedBlue}>
          {toast}
        </div>
      )}
    </main>
  );
}
