// src/pages/PartidosFinalizados.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos ===== */
const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };
const PAGE_HEAD = { margin: "0 0 6px", font: "700 22px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const PAGE_SUB_ROW = { display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:10, marginBottom:12 };
const PAGE_SUB  = { margin: 0, font: "400 16px/1.3 Montserrat,system-ui,sans-serif", color: "#475569" };

/* Botón “+” rojo — unificado (centrado y trazo grueso) */
const PLUS_BTN_RED = {
  display:"inline-grid", placeItems:"center",
  width: 36, height: 36, borderRadius: 10,
  background: "linear-gradient(180deg,#f87171,#ef4444)",
  border: "1px solid #ef4444",
  boxShadow: "0 6px 18px rgba(239,68,68,.28)",
  cursor: "pointer"
};
const PLUS_SVG = { fill:"none", stroke:"#ffffff", strokeWidth:2.2, strokeLinecap:"round", strokeLinejoin:"round" };

const CARD_BASE = { position:"relative", borderRadius: 14, padding: 12, boxShadow: "0 6px 18px rgba(0,0,0,.05)", marginBottom: 10 };
const CARD = { ...CARD_BASE, border: "1px solid #ef4444", background: "linear-gradient(180deg,#fff5f5,#fff0f0)" };

const ROW = (isMobile) => ({ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: 8, alignItems: "start" });
const CARD_CONTENT = { paddingLeft: 48 };

const RED = "#b91c1c";
/* Texto equipos — móvil -15%, separador '-' en móvil; 'vs' minúsculas en desktop */
const TEAMS_LINE = (isMobile) => ({
  font: `600 ${isMobile ? 13.6 : 18}px/1.12 Montserrat,system-ui,sans-serif`,
  color: RED, textTransform: "uppercase"
});
const LINE = (isMobile) => ({ font: `400 ${isMobile ? 15.4 : 14}px/1.12 Montserrat,system-ui,sans-serif`, color: RED, marginTop: 2 });
const LINE_LABEL = (isMobile) => ({ fontWeight: isMobile ? 600 : 500, marginRight: 4 });

const BADGE = { position:"absolute", top:8, left:8, font:"700 12px/1 Montserrat,system-ui,sans-serif", background:"#ef4444", color:"#fff", padding:"4px 7px", borderRadius:999 };

/* Iconos: mismo layout que Vindeiros (móvil columna bajo número; desktop a la derecha) */
const ACTIONS = { display: "flex", gap: 8, alignItems: "center" };
const ACTIONS_MOBILE_COLUMN = { position:"absolute", left:8, top:36, display:"grid", gap:5 };
const ICONBTN = { width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.06)", cursor: "pointer" };
const SVGI = { fill: "none", stroke: "#0f172a", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
const SVG_RED = { ...SVGI, stroke: "#dc2626" };

const EDIT_CARD = { border: "1px solid #fecaca", borderRadius: 14, background: "linear-gradient(180deg,#fff7f7,#fffafa)", padding: 12, boxShadow: "0 6px 18px rgba(0,0,0,.05)", marginBottom: 12 };

const INPUT = { width: "100%", borderRadius: 10, border: "1px solid #dbe2f0", background: "#fff", padding: "10px 12px", font: "400 14px/1.1 Montserrat,system-ui,sans-serif", color: "#0f172a", outline: "none" };
const INPUT_UP = { ...INPUT, textTransform:"uppercase" };
const FIELD_WITH_ICON = { position:"relative", display:"grid" };
const FIELD_ICON = { position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", opacity:.55 };
const SELECT = { ...INPUT, appearance: "none", paddingLeft: 36, paddingRight: 36, cursor: "pointer", textTransform: "none" };
const GRID3 = { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems:"center" };

const SAVE_ICON_BTN = { width: 42, height: 42, display:"grid", placeItems:"center", borderRadius: 10, border: "1px solid #ef4444", background: "linear-gradient(180deg,#f87171,#ef4444)", boxShadow: "0 6px 18px rgba(239,68,68,.30)", cursor: "pointer" };
const SAVE_SVG = { fill:"none", stroke:"#fff", strokeWidth:2, strokeLinecap:"round", strokeLinejoin:"round" };

/* ===== Utils ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const sortDescByDate = (a, b) => (b.match_iso?new Date(b.match_iso).getTime():-Infinity)-(a.match_iso?new Date(a.match_iso).getTime():-Infinity);
function dmyWithWeekday(iso){ if(!iso) return "—"; const d=new Date(iso); try{const w=new Intl.DateTimeFormat("gl-ES",{weekday:"long",timeZone:"Europe/Madrid"}).format(d); return `${w}, ${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;}catch{ return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;}}
const toISOFromParts=(d,t)=>(!d||!t)?null:(isNaN(new Date(`${d}T${t}:00`).getTime())?null:new Date(`${d}T${t}:00`).toISOString());
const timeOptions=()=>{const r=[];for(let h=11;h<=24;h++)for(const m of[0,15,30,45])r.push(`${String(h===24?0:h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);return r;};

export default function PartidosFinalizados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);

  const [draft, setDraft] = useState({ equipo1:"", equipo2:"", competition:"", lugar:"", dateStr:"", timeStr:"" });
  const allDraftFilled = (d)=> !!(d.equipo1.trim() && d.equipo2.trim() && d.competition.trim() && d.lugar.trim() && d.dateStr && d.timeStr);

  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 560);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  async function resolveAdmin() {
    const { data: s } = await supabase.auth.getSession();
    const email = s?.session?.user?.email?.toLowerCase() || "";
    const uid   = s?.session?.user?.id || null;
    let admin = (email === "hdcliga@gmail.com" || email === "hdcliga2@gmail.com");
    if (!admin && uid) {
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
      if ((prof?.role||"").toLowerCase() === "admin") admin = true;
    }
    setIsAdmin(admin);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      await resolveAdmin();
      await loadList();
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      if (!alive) return;
      await resolveAdmin();
      await loadList();
    });
    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  async function loadList() {
    setErr("");
    try {
      const { data, error } = await supabase.from("matches_finalizados").select("*");
      if (error) throw error;
      setRows((data||[]).map(r=>({
        id:r.id??null, equipo1:r.equipo1||"", equipo2:r.equipo2||"", lugar:r.lugar||"",
        competition:r.competition||"", match_iso:r.match_iso||null, updated_at:r.updated_at||null
      })).sort(sortDescByDate));
    } catch (e) { console.error("loadList Finalizados:", e); setErr("Erro cargando Finalizados."); }
  }

  const showToast = (m)=>{ setToast(m); setTimeout(()=>setToast(""),3500); };

  async function onDelete(id){
    if (!isAdmin) return;
    if (!window.confirm("Borrar este partido finalizado?")) return;
    try {
      const { error } = await supabase.from("matches_finalizados").delete().eq("id", id);
      if (error) throw error;
      setRows(cur=>cur.filter(x=>x.id!==id));
      showToast("Partido eliminado.");
    } catch (e) { console.error("delete Finalizados:", e); showToast("Erro eliminando partido."); }
  }

  async function onCreate() {
    if (!isAdmin) { showToast("Só admins poden gardar."); return; }
    if (saving) return;
    if (!allDraftFilled(draft)) { showToast("Rechea todos os campos para gardar."); return; }
    setSaving(true);
    try {
      const iso = toISOFromParts(draft.dateStr, draft.timeStr);
      const payload = {
        equipo1: draft.equipo1.trim().toUpperCase(),
        equipo2: draft.equipo2.trim().toUpperCase(),
        lugar: draft.lugar.trim(),
        competition: draft.competition.trim(),
        match_iso: iso,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("matches_finalizados").insert(payload).select("*").single();
      if (error) throw error;
      setRows((cur)=>[...cur, data].sort(sortDescByDate));
      setDraft({ equipo1:"", equipo2:"", competition:"", lugar:"", dateStr:"", timeStr:"" });
      setCreateOpen(false);
      showToast("Partido finalizado gardado.");
    } catch (e) { console.error("insert Finalizados:", e); showToast("Erro gardando partido finalizado."); }
    finally { setSaving(false); }
  }

  const view = useMemo(()=>rows,[rows]);

  return (
    <main style={WRAP}>
      <h2 style={PAGE_HEAD}>PARTIDOS FINALIZADOS</h2>

      <div style={PAGE_SUB_ROW}>
        <p style={PAGE_SUB}>Encontros xa disputados polo Celta.</p>
        {isAdmin && (
          <button type="button" style={PLUS_BTN_RED} onClick={()=> setCreateOpen(v=>!v)} title="Crear novo partido finalizado" aria-label="Crear novo partido finalizado">
            <svg width="26" height="26" viewBox="0 0 24 24" style={PLUS_SVG}><path d="M12 5v14M5 12h14" /></svg>
          </button>
        )}
      </div>

      {toast && <div style={{ margin: "8px 0 12px", padding: "10px 12px", borderRadius: 10, background: "#ecfeff", border: "1px solid #67e8f9", color: "#0e7490", font: "600 13px/1.2 Montserrat,system-ui,sans-serif" }}>{toast}</div>}
      {err && <div style={{ margin: "8px 0 12px", padding: "10px 12px", borderRadius: 10, background:"#fee2e2", border:"1px solid #fecaca", color:"#b91c1c", font: "600 13px/1.2 Montserrat,system-ui,sans-serif" }}>{err}</div>}

      {view.map((r, idx) => {
        const niceDate = dmyWithWeekday(r.match_iso);
        const timeStr = r.match_iso ? new Date(r.match_iso).toLocaleTimeString("gl-ES", { hour: "2-digit", minute:"2-digit", hour12: false }) : "—";
        const number = view.length - idx;

        return (
          <article key={r.id} style={CARD}>
            <span style={BADGE}>{number}</span>

            {/* Acciones en columna bajo número (solo móvil) */}
            {isAdmin && isMobile && (
              <div style={ACTIONS_MOBILE_COLUMN}>
                <button type="button" style={ICONBTN} title="Ver resultados" onClick={()=> route("/resultados-ultima-alineacion")} aria-label="Ver resultados da última aliñación">
                  <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                </button>
                <button type="button" style={{ ...ICONBTN, marginTop: -2 }} title="Borrar partido" onClick={()=> onDelete(r.id)} aria-label="Borrar partido">
                  <svg width="20" height="20" viewBox="0 0 24 24" style={SVG_RED}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                </button>
              </div>
            )}

            <div style={ROW(isMobile)}>
              <div style={CARD_CONTENT}>
                <div style={TEAMS_LINE(isMobile)}>
                  {(r.equipo1||"—").toUpperCase()} <span style={{ margin:"0 4px" }}>{isMobile ? "-" : "vs"}</span> {(r.equipo2||"—").toUpperCase()}
                </div>
                <div style={LINE(isMobile)}><span style={LINE_LABEL(isMobile)}>Competición:</span> {r.competition || "—"}</div>
                <div style={LINE(isMobile)}><span style={LINE_LABEL(isMobile)}>Lugar:</span> {r.lugar || "—"}</div>
                <div style={LINE(isMobile)}><span style={LINE_LABEL(isMobile)}>Data:</span> {niceDate}</div>
                <div style={LINE(isMobile)}><span style={LINE_LABEL(isMobile)}>Hora:</span> {timeStr}</div>
              </div>

              {/* Acciones a la derecha en desktop */}
              {isAdmin && !isMobile && (
                <div style={ACTIONS}>
                  <button type="button" style={ICONBTN} title="Ver resultados" onClick={()=> route("/resultados-ultima-alineacion")} aria-label="Ver resultados da última aliñación">
                    <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  </button>
                  <button type="button" style={ICONBTN} title="Borrar partido" onClick={()=> onDelete(r.id)} aria-label="Borrar partido">
                    <svg width="20" height="20" viewBox="0 0 24 24" style={SVG_RED}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </main>
  );
}
