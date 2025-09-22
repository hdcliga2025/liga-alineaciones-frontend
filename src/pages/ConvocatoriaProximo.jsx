import { h } from "preact";
import { useEffect, useMemo, useState, useRef } from "preact/hooks";
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
    pos:    (posFile || "").toUpperCase(),
    nombre: (nameFile || p.nombre || "").trim()
  };
}

/* ===== Estilos ===== */
const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 16px", color: "#475569", fontSize: 16 }, // subleyenda GL
  resumen: {
    margin:"0 0 14px", padding:"12px 14px", borderRadius:12,
    border:"1px solid #dbeafe",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)", color:"#0f172a"
  },
  resumeLine: { margin: 0, fontSize: 19, fontWeight: 400, letterSpacing: ".35px", lineHeight: 1.5 },
  posHeader: { margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },
  grid4: { display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:12 },

  card: (selected)=>({
    position:"relative",
    border: selected ? "2px solid #38bdf8" : "1px solid #dbeafe",
    borderRadius:16, padding:10,
    boxShadow:"0 2px 8px rgba(0,0,0,.06)",
    background: selected ? "linear-gradient(180deg,#e0f2fe,#bae6fd)" : "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    cursor:"pointer", userSelect:"none", transition:"border-color .12s, background .12s"
  }),
  frame: {
    width:"100%", height:320, borderRadius:12, overflow:"hidden",
    background:"#0b1e2a", display:"grid", placeItems:"center",
    border:"1px solid #e5e7eb", position:"relative"
  },
  name: { margin:"8px 0 0", font:"700 15px/1.2 Montserrat, system-ui, sans-serif", color:"#0f172a", textAlign:"center" },
  meta: { margin:"2px 0 0", color:"#475569", fontSize:13, textAlign:"center" },

  saveBtn: {
    width: "100%", padding: "14px 16px",
    borderRadius: 10,
    background:"linear-gradient(180deg,#bae6fd,#7dd3fc)",
    color:"#0c4a6e", fontWeight:800, border:"none",
    cursor:"pointer", boxShadow:"0 10px 22px rgba(2,132,199,.25)"
  },

  badgeConv: {
    position:"absolute", top:12, left:12,
    padding:"6px 10px", borderRadius:999,
    background:"linear-gradient(180deg,#22d3ee,#06b6d4)",
    color:"#083344", fontWeight:800, fontSize:12, letterSpacing:.3,
    boxShadow:"0 6px 16px rgba(13,148,136,.25)"
  },

  toastInfo: {
    position:"fixed", bottom:18, left:"50%", transform:"translateX(-50%)",
    background:"#0ea5e9", color:"#fff", padding:"10px 16px",
    borderRadius:12, boxShadow:"0 10px 22px rgba(2,132,199,.35)", fontWeight:700, zIndex:9999
  }
};

const BadgeConvocado = ({ show=false }) => show ? (
  <span style={S.badgeConv}>CONVOCADO</span>
) : null;

export default function ConvocatoriaProximo() {
  const [isAdmin, setIsAdmin] = useState(false);

  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState(new Set()); // IDs convocados
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const toastRef = useRef(null);

  // Cabeceira (desde Vindeiros ou fallback a next_match)
  const [header, setHeader] = useState(null); // {equipo1,equipo2,match_iso}

  // Tras gardar → nesta páxina só se amosan os convocados
  const [showOnlyConvocados, setShowOnlyConvocados] = useState(false);

  useEffect(() => () => clearTimeout(toastRef.current), []);

  useEffect(() => {
    (async () => {
      // Admin?
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id || null;
      let admin = false;
      if (uid) {
        const { data: prof } = await supabase.from("profiles").select("role,email").eq("id", uid).maybeSingle();
        const role = (prof?.role || "").toLowerCase();
        admin = role === "admin";
      }
      setIsAdmin(admin);

      // Plantel completo
      const { data: js } = await supabase
        .from("jugadores")
        .select("id,nombre,dorsal,foto_url")
        .order("dorsal", { ascending: true });
      setPlayers(js || []);

      // Cabeceira
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

      // Precarga dos xa publicados como seleccionados (convocados)
      const { data: pub } = await supabase.from("convocatoria_publica").select("jugador_id");
      const convSet = new Set((pub || []).map(r => r.jugador_id));
      setSelected(convSet);

      // Ao entrar nun novo partido, volvemos amosar todo
      setShowOnlyConvocados(false);
    })().catch(e => console.error("[ConvocatoriaProximo] init", e));
  }, []);

  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of players || []) {
      const info = finalFromAll(p);
      if (info.pos && g[info.pos]) g[info.pos].push({ ...p, ...info });
    }
    return g;
  }, [players]);

  // Lista de IDs visibles (depende de showOnlyConvocados)
  const visibleIdSet = useMemo(() => {
    if (!showOnlyConvocados) return null; // amosar todos
    return selected;
  }, [showOnlyConvocados, selected]);

  const { fecha: sFecha, hora: sHora } = fmtDT(header?.match_iso);

  const toggleSelect = (id) => {
    if (!isAdmin) return;
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  async function saveAndPublish() {
    if (!isAdmin) return;
    setSaving(true);
    try {
      // Persistir: borra e inserta lista de convocados actual
      await supabase.from("convocatoria_publica").delete().neq("jugador_id", "00000000-0000-0000-0000-000000000000");

      const arr = Array.from(selected);
      if (arr.length) {
        const rows = arr.map(jid => ({ jugador_id: jid, updated_at: new Date().toISOString() }));
        const { error } = await supabase.from("convocatoria_publica").insert(rows);
        if (error) throw error;
      }

      // Feedback e estado UI:
      setShowOnlyConvocados(true); // agora nesta páxina só se ven os convocados
      setToast("Convocatoria gardada");
      clearTimeout(toastRef.current);
      toastRef.current = setTimeout(() => setToast(""), 1800);
    } catch (e) {
      console.error(e);
      setToast("Erro ao gardar a convocatoria");
      clearTimeout(toastRef.current);
      toastRef.current = setTimeout(() => setToast(""), 2200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Convocatoria oficial</h1>
      <p style={S.sub}>Lista de xogadores pre-seleccionados para xogar o partido.</p>

      {/* Cabeceira resumida */}
      {header && (
        <div style={S.resumen}>
          <p style={S.resumeLine}>{cap(header.equipo1)} vs {cap(header.equipo2)}</p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>

          {isAdmin && (
            <div style={{ marginTop: 10 }}>
              <button
                style={S.saveBtn}
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

      {(["POR","DEF","CEN","DEL"]).map((k) => {
        let arr = (grouped[k] || []);
        if (visibleIdSet) arr = arr.filter(p => visibleIdSet.has(p.id));
        if (!arr.length) return null;

        const label = k === "POR" ? "Porteiros" : k === "DEF" ? "Defensas" : k === "CEN" ? "Medios" : "Dianteiros";
        return (
          <section key={k}>
            <div style={S.posHeader}>{label}</div>
            <div style={S.grid4}>
              {arr.map((p) => {
                const isSel = selected.has(p.id);
                const { dorsal, nombre, pos } = p;
                return (
                  <article
                    key={p.id}
                    style={S.card(isSel)}
                    onClick={() => toggleSelect(p.id)}
                    title={isSel ? "Convocado" : "Preme para convocar"}
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
                          <BadgeConvocado show={isSel}/>
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

      {toast && <div role="status" aria-live="polite" style={S.toastInfo}>{toast}</div>}
    </main>
  );
}
