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

const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 12px", color: "#475569", fontSize: 16 },
  resumen: {
    margin:"0 0 10px", padding:"10px 12px", borderRadius:12,
    border:"1px solid #dbeafe",
    background:"linear-gradient(180deg,#fee2e2,#fecaca)",
    color:"#7f1d1d"
  },
  resumeLine: { margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: ".35px", lineHeight: 1.45 },
  posHeader: { margin:"14px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#7f1d1d", borderLeft:"4px solid #fecaca", borderBottom:"2px solid #fecaca" },
  grid: (isMobile) => ({ display:"grid", gridTemplateColumns: isMobile ? "repeat(3, minmax(0,1fr))" : "repeat(4, minmax(0,1fr))", gap:12 }),
  card: (picked)=>({
    position:"relative", border: "1px solid #fecaca", borderRadius:16, padding:10,
    background: picked ? "linear-gradient(180deg,#fee2e2,#fecaca)" : "#fff",
    boxShadow: picked ? "0 0 0 2px rgba(239,68,68,.25), 0 8px 26px rgba(239,68,68,.18)" : "0 2px 8px rgba(0,0,0,.06)"
  }),
  frame: (isMobile)=>({
    width:"100%", height: isMobile ? 172 : 320, borderRadius:12, overflow:"hidden",
    background:"#ffffff", display:"grid", placeItems:"center", border:"1px solid #e5e7eb", position:"relative"
  }),
  img: { width:"100%", height:"100%", objectFit:"contain", background:"#ffffff" },
  name: { margin:"8px 0 0", font:"700 15px/1.2 Montserrat, system-ui, sans-serif", color:"#0f172a", textAlign:"center" },
  meta: { margin:"2px 0 0", color:"#475569", fontSize:13, textAlign:"center" },
  rowBtns: { display:"grid", gridTemplateColumns:"85% 15%", gap:8, alignItems:"stretch", marginTop:10 },
  btnLoad: {
    width:"100%", padding:"9px 12px", borderRadius:10, background:"linear-gradient(180deg,#e7f6ff,#cfeeff)",
    color:"#075985", fontWeight:800, border:"3px solid #38bdf8", cursor:"pointer"
  },
  btnTrash: {
    width:"100%", padding:"9px 12px", borderRadius:10, background:"linear-gradient(180deg,#ffd8d8,#ffbcbc)",
    color:"#7f1d1d", fontWeight:800, border:"3px solid #ef4444", cursor:"pointer", display:"grid", placeItems:"center"
  },
  btnBottom: {
    width:"100%", padding:"9px 12px", borderRadius:10, background:"linear-gradient(180deg,#e7f6ff,#cfeeff)",
    color:"#075985", fontWeight:800, border:"3px solid #38bdf8", cursor:"pointer", marginTop:14
  },
  counter: {
    position:"absolute", left:"50%", top:"78%", transform:"translate(-50%,-50%)",
    fontFamily:"Montserrat, system-ui, sans-serif", fontWeight:900, fontSize:30, color:"#0c4a6e",
    background:"rgba(56,189,248,.55)", padding:"6px 12px", borderRadius:999, letterSpacing:1.1, userSelect:"none", pointerEvents:"none"
  }
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
  const max11 = 11;

  useEffect(() => {
    let raf=0;
    const onR=()=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(()=> setIsMobile(window.innerWidth<=560)); };
    window.addEventListener("resize", onR);
    return ()=>{ window.removeEventListener("resize", onR); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    (async () => {
      // Admin?
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id || null;
        if (uid) {
          const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
          setIsAdmin(((prof?.role)||"").toLowerCase()==="admin");
        }
      } catch {}

      // match de referencia
      const { data: top } = await supabase
        .from("matches_vindeiros")
        .select("id,equipo1,equipo2,match_iso")
        .order("match_iso", { ascending: true }).limit(1).maybeSingle();

      if (top?.match_iso) {
        setHeader({ equipo1: cap(top.equipo1||""), equipo2: cap(top.equipo2||""), match_iso: top.match_iso });
      } else {
        const { data: nm } = await supabase.from("next_match").select("equipo1,equipo2,match_iso").eq("id",1).maybeSingle();
        if (nm?.match_iso) setHeader({ equipo1: cap(nm.equipo1||""), equipo2: cap(nm.equipo2||""), match_iso: nm.match_iso });
      }

      // plantilla completa
      const { data: js } = await supabase
        .from("jugadores")
        .select("id, nombre, dorsal, foto_url")
        .order("dorsal", { ascending: true });
      setPlayers(js || []);

      // precargar once oficial existente
      try {
        const iso =
          top?.match_iso ||
          (await supabase.from("next_match").select("match_iso").eq("id",1).maybeSingle()).data?.match_iso;
        if (iso) {
          const { data: ofi } = await supabase.from("alineacion_oficial").select("jugador_id").eq("match_iso", iso);
          if (ofi && ofi.length) setSel(new Set(ofi.map(r=>r.jugador_id)));
        }
      } catch {}
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

  function showToast(m, ms=2400){
    setToast(m);
    setTimeout(()=>setToast(""), ms);
  }

  async function resolveEncuentroId(iso) {
    // 1) intentar en vindeiros
    const a = await supabase.from("matches_vindeiros").select("id").eq("match_iso", iso).maybeSingle();
    if (a?.data?.id) return a.data.id;
    // 2) intentar en finalizados
    const b = await supabase.from("matches_finalizados").select("id").eq("match_iso", iso).maybeSingle();
    if (b?.data?.id) return b.data.id;
    return null;
  }

  async function loadOfficial() {
    if (!isAdmin) { showToast("Só admins poden gardar a aliñación oficial."); return; }
    if (sel.size !== 11) { showToast("Escolle 11 xogadores."); return; }
    if (!header?.match_iso) { showToast("Falta o partido de referencia."); return; }

    setSaving(true);
    try {
      const iso = header.match_iso;

      // 🔑 NUEVO: necesitamos encuentro_id (NOT NULL na BD)
      const encuentro_id = await resolveEncuentroId(iso);
      if (!encuentro_id) {
        showToast("Non atopei o encontro en Vindeiros/Finalizados. Sube ou crea o partido primeiro.");
        setSaving(false);
        return;
      }

      // borrar previo deste encontro
      const del = await supabase.from("alineacion_oficial").delete().eq("encuentro_id", encuentro_id);
      if (del.error) throw del.error;

      // insertar novo
      const now = new Date().toISOString();
      const rows = [...sel].map(jid => ({
        jugador_id: jid,
        match_iso: iso,           // se existe na táboa, perfecto
        encuentro_id,             // requerido NOT NULL segundo a BD
        updated_at: now
      }));
      const ins = await supabase.from("alineacion_oficial").insert(rows);
      if (ins.error) throw ins.error;

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

  const loadLabel = isMobile ? (sel.size===11 ? "CARGAR ONCE OFICIAL" : `CARGAR ONCE OFICIAL (${sel.size}/11)`)
                             : (sel.size===11 ? "CARGAR ALIÑACIÓN OFICIAL" : `CARGAR ALIÑACIÓN OFICIAL (${sel.size}/11)`);

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Aliñación oficial</h1>
      <p style={S.sub}>Os once xogadores que saen de inicio neste partido.</p>

      {header && (
        <div style={S.resumen}>
          <p style={S.resumeLine}>{header ? `${cap(header.equipo1)} vs ${cap(header.equipo2)}` : ""}</p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>

          <div style={S.rowBtns}>
            <button style={S.btnLoad} onClick={loadOfficial} disabled={sel.size!==11 || saving}>
              {saving ? "Gardando…" : loadLabel}
            </button>
            <button style={S.btnTrash} onClick={resetAll} title="Restaurar" aria-label="Restaurar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6h18" stroke="#7f1d1d" strokeWidth="3.2" strokeLinecap="round"/>
                <path d="M8 6V4h8v2" stroke="#7f1d1d" strokeWidth="3.2" strokeLinecap="round"/>
                <path d="M19 6l-1 14H6L5 6" stroke="#7f1d1d" strokeWidth="3.2" strokeLinecap="round"/>
                <path d="M10 11v6M14 11v6" stroke="#7f1d1d" strokeWidth="3.2" strokeLinecap="round"/>
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
