// src/pages/AlineacionOficial.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const cap = (s="") => (s || "").toUpperCase();
const isUUID = (v="") => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

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

const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 12px", color: "#475569", fontSize: 16 },

  // Cabeceira vermella con sombra e borde suave
  resumen: {
    margin:"0 0 12px", padding:"12px 14px", borderRadius:12,
    border:"1px solid #fecaca",
    background:"linear-gradient(180deg,#fee2e2,#fecaca)",
    color:"#7f1d1d",
    boxShadow:"0 10px 26px rgba(239,68,68,.18)"
  },
  resumeLine: { margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: ".35px", lineHeight: 1.45 },
  resumeTeams: { margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: ".4px", lineHeight: 1.45 },

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
    width:"100%",
    height: isMobile ? 172 : 320,
    borderRadius:12, overflow:"hidden",
    background:"#ffffff",
    display:"grid", placeItems:"center",
    border:"1px solid #e5e7eb",
    position:"relative"
  }),
  img: { width:"100%", height:"100%", objectFit:"contain", background:"#ffffff" },

  name: { margin:"8px 0 0", font:"700 15px/1.2 Montserrat, system-ui, sans-serif", color:"#0f172a", textAlign:"center" },
  meta: { margin:"2px 0 0", color:"#475569", fontSize:13, textAlign:"center" },

  // Botoneira superior 85% + 15% (papeleira)
  rowBtns: { display:"grid", gridTemplateColumns:"85% 15%", gap:8, alignItems:"stretch", marginTop:10 },

  // Botón vermello degradado, contorno simple, sen sombra, texto un pouco maior
  btnLoad: {
    width:"100%", padding:"10px 14px", borderRadius:10,
    background:"linear-gradient(180deg,#fca5a5,#ef4444)",
    border:"2px solid #ef4444", color:"#fff", fontWeight:800,
    fontSize:16, letterSpacing:.4, cursor:"pointer"
  },

  // Papeleira: fondo branco, contorno simple, sen bold
  btnTrash: {
    width:"100%", padding:"10px 12px", borderRadius:10,
    background:"#fff", color:"#7f1d1d",
    border:"2px solid #ef4444", cursor:"pointer",
    display:"grid", placeItems:"center"
  },

  // Botón inferior igual que o superior pero 100% ancho
  btnBottom: {
    width:"100%", padding:"10px 14px", borderRadius:10,
    background:"linear-gradient(180deg,#fca5a5,#ef4444)",
    border:"2px solid #ef4444", color:"#fff", fontWeight:800,
    fontSize:16, letterSpacing:.4, cursor:"pointer", marginTop:14
  },

  // Contador fixo no seleccionado
  counter: {
    position:"absolute", left:"50%", top:"78%", transform:"translate(-50%,-50%)",
    fontFamily:"Montserrat, system-ui, sans-serif",
    fontWeight:900, fontSize:30, color:"#0c4a6e",
    background:"rgba(56,189,248,.55)", padding:"6px 12px", borderRadius:999,
    letterSpacing:1.1, userSelect:"none", pointerEvents:"none"
  },

  // Liñas de “aliñación subida”
  upLabel: { margin:"8px 0 0", font:"600 15px/1.35 Montserrat,system-ui,sans-serif", color:"#7f1d1d" },
  upValue: { margin:"2px 0 0", font:"600 15px/1.35 Montserrat,system-ui,sans-serif", color:"#7f1d1d", opacity:.9 }
};

export default function AlineacionOficial(){
  const [header, setHeader] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  const [sel, setSel] = useState(new Set());
  const [lastCounterId, setLastCounterId] = useState(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null); // ← última subida/gravación
  const max11 = 11;

  useEffect(() => {
    let raf=0;
    const onR=()=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(()=> setIsMobile(window.innerWidth<=560)); };
    window.addEventListener("resize", onR);
    return ()=>{ window.removeEventListener("resize", onR); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id || null;
        if (uid) {
          const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
          setIsAdmin(((prof?.role)||"").toLowerCase()==="admin");
        }
      } catch {}

      // Header
      const { data: top } = await supabase
        .from("matches_vindeiros")
        .select("id,equipo1,equipo2,match_iso")
        .order("match_iso", { ascending: true }).limit(1).maybeSingle();

      if (top?.match_iso) {
        setHeader({ equipo1: cap(top.equipo1||""), equipo2: cap(top.equipo2||""), match_iso: top.match_iso, encuentro_id: top.id });
        await preloadOfficial(top.match_iso);
      } else {
        const { data: nm } = await supabase.from("next_match").select("equipo1,equipo2,match_iso").eq("id",1).maybeSingle();
        if (nm?.match_iso) {
          setHeader({ equipo1: cap(nm.equipo1||""), equipo2: cap(nm.equipo2||""), match_iso: nm.match_iso, encuentro_id: null });
          await preloadOfficial(nm.match_iso);
        }
      }

      const { data: js } = await supabase
        .from("jugadores")
        .select("id, nombre, dorsal, foto_url")
        .order("dorsal", { ascending: true });
      setPlayers(js || []);
    })();
  }, []);

  async function preloadOfficial(iso){
    try {
      // Preselección anterior (se existe)
      const { data: ofi } = await supabase
        .from("alineacion_oficial")
        .select("jugador_id,updated_at")
        .eq("match_iso", iso);

      if (ofi && ofi.length) {
        setSel(new Set(ofi.map(r=>r.jugador_id)));
        // últimos updated_at
        const last = ofi.reduce((acc, r)=> (!acc || (r.updated_at > acc) ? r.updated_at : acc), null);
        if (last) setLastSavedAt(last);
      } else {
        setSel(new Set());
        setLastSavedAt(null);
      }
    } catch {}
  }

  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of players || []) {
      const { pos } = finalFromAll(p);
      if (pos && g[pos]) g[pos].push(p);
    }
    return g;
  }, [players]);

  const { fecha: sFecha, hora: sHora } = fmtDT(header?.match_iso);
  const savedFmt = fmtDT(lastSavedAt);

  function togglePick(id) {
    setSel(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else { if (n.size >= max11) return prev; n.add(id); }
      return n;
    });
    setLastCounterId(id);
  }

  function showToast(m, ms=2600){
    setToast(m);
    setTimeout(()=>setToast(""), ms);
  }

  async function resolveEncuentroId(iso) {
    const a = await supabase.from("matches_vindeiros").select("id").eq("match_iso", iso).maybeSingle();
    if (a?.data?.id) return a.data.id;
    return null;
  }

  async function loadOfficial() {
    if (!isAdmin) { showToast("Só admins poden gardar a aliñación oficial."); return; }
    if (sel.size !== 11) { showToast("Escolle 11 xogadores."); return; }
    if (!header?.match_iso) { showToast("Falta o partido de referencia."); return; }

    setSaving(true);
    try {
      const iso = header.match_iso;
      const encuentro_id = header.encuentro_id || await resolveEncuentroId(iso);
      if (!encuentro_id) { showToast("Crea o encontro en Vindeiros antes de gardar."); setSaving(false); return; }

      const ids = [...sel];
      const invalid = ids.filter(id => !isUUID(id));
      if (invalid.length) {
        const byId = new Map(players.map(p => [p.id, p]));
        const names = invalid.map(id => byId.get(id)?.nombre || String(id));
        showToast(`IDs non-UUID en xogadores: ${names.join(", ")}`);
        setSaving(false);
        return;
      }

      const check = await supabase.from("jugadores").select("id").in("id", ids);
      const okSet = new Set((check.data||[]).map(r=>r.id));
      if (okSet.size !== ids.length) {
        const missing = ids.filter(id => !okSet.has(id));
        showToast(`Xogadores inexistentes: ${missing.join(", ")}`);
        setSaving(false);
        return;
      }

      await supabase.from("alineacion_oficial").delete().eq("encuentro_id", encuentro_id);

      const now = new Date().toISOString();
      const rows = ids.map(jid => ({
        jugador_id: jid,
        match_iso: iso,
        encuentro_id,
        updated_at: now,
        jugadores_ids: [] // por compatibilidade se a columna existe como uuid[]
      }));

      const ins = await supabase.from("alineacion_oficial").insert(rows);
      if (ins.error) throw ins.error;

      setLastSavedAt(now); // ← marca de tempo visible
      showToast("Aliñación oficial gardada.");
    } catch (e) {
      const msg = [e?.code, e?.message, e?.details, e?.hint].filter(Boolean).join(" | ");
      console.error("[AlineacionOficial] save error:", e);
      showToast(`Erro gardando: ${msg || "descoñecido"}`, 5200);
    } finally {
      setSaving(false);
    }
  }

  function resetAll(){ setSel(new Set()); setLastCounterId(null); }

  const baseText = "GRAVAR ALIÑACIÓN OFICIAL";
  const loadLabel = sel.size===11 ? baseText : `${baseText} (${sel.size}/11)`;

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Aliñación oficial</h1>
      <p style={S.sub}>Os once xogadores que saen de inicio neste partido.</p>

      {header && (
        <div style={S.resumen}>
          {/* Equipos en BOLD */}
          <p style={S.resumeTeams}>
            <strong>{cap(header.equipo1)}</strong> vs <strong>{cap(header.equipo2)}</strong>
          </p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>

          {/* Liñas de última subida/gravación */}
          <p style={S.upLabel}>Aliñación oficial subida:</p>
          <p style={S.upValue}>{lastSavedAt ? `${savedFmt.fecha} ás ${savedFmt.hora}` : "-"}</p>

          {/* Botoneira superior */}
          <div style={S.rowBtns}>
            <button style={S.btnLoad} onClick={loadOfficial} disabled={sel.size!==11 || saving}>
              {saving ? "Gardando…" : loadLabel}
            </button>
            <button style={S.btnTrash} onClick={resetAll} title="Restablecer" aria-label="Restablecer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6h18" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8 6V4h8v2" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round"/>
                <path d="M19 6l-1 14H6L5 6" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 11v6M14 11v6" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round"/>
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

      {/* Botón inferior 100% */}
      <button style={S.btnBottom} onClick={loadOfficial} disabled={sel.size!==11 || saving}>
        {saving ? "Gardando…" : loadLabel}
      </button>

      {toast && (
        <div role="status" aria-live="polite" style={{
          position:"fixed", bottom:18, left:"50%", transform:"translateX(-50%)",
          background:"#0ea5e9", color:"#fff", padding:"10px 16px",
          borderRadius:12, boxShadow:"0 10px 22px rgba(2,132,199,.35)", fontWeight:700,
          maxWidth:"92vw", textAlign:"center"
        }}>
          {toast}
        </div>
      )}
    </main>
  );
}
