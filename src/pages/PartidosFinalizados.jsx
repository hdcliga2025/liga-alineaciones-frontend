// src/pages/PartidosFinalizados.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos ===== */
const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };
const PAGE_HEAD = { margin: "0 0 6px", font: "700 22px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const PAGE_SUB_ROW = { display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:10, marginBottom:12 };
const PAGE_SUB  = { margin: 0, font: "400 16px/1.3 Montserrat,system-ui,sans-serif", color: "#475569" }; // ↑ un pouco máis grande

const PLUS_BTN_RED = { display:"inline-grid", placeItems:"center", width: 36, height: 36, borderRadius: 10, background: "linear-gradient(180deg,#f87171,#ef4444)", border: "1px solid #ef4444", boxShadow: "0 6px 18px rgba(239,68,68,.28)", cursor: "pointer" };
const PLUS_SVG_RED = { fill:"none", stroke:"#ffffff", strokeWidth:1.6, strokeLinecap:"round", strokeLinejoin:"round" };

const CARD_BASE = { position:"relative", borderRadius: 14, padding: 12, boxShadow: "0 6px 18px rgba(0,0,0,.05)", marginBottom: 10 };
const CARD = { ...CARD_BASE, border: "1px solid #ef4444", background: "linear-gradient(180deg,#fff5f5,#fff0f0)" };

const ROW = { display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "start" };
const CARD_CONTENT = { paddingLeft: 48 };

const RED = "#b91c1c";
const TEAMS_LINE = { font: "600 16px/1.12 Montserrat,system-ui,sans-serif", color: RED, textTransform: "uppercase" };
const LINE = { font: "400 13px/1.12 Montserrat,system-ui,sans-serif", color: RED, marginTop: 2 };

const BADGE = { position:"absolute", top:8, left:8, font:"700 12px/1 Montserrat,system-ui,sans-serif", background:"#ef4444", color:"#fff", padding:"4px 7px", borderRadius:999 };

const ACTIONS = { display: "flex", gap: 8, alignItems: "center" };
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

const TOAST = { margin: "8px 0 12px", padding: "10px 12px", borderRadius: 10, background: "#ecfeff", border: "1px solid #67e8f9", color: "#0e7490", font: "600 13px/1.2 Montserrat,system-ui,sans-serif" };

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

  const [draft, setDraft] = useState({ equipo1:"", equipo2:"", competition:"", lugar:"", dateStr:"", timeStr:"" });
  const allDraftFilled = (d)=> !!(d.equipo1.trim() && d.equipo2.trim() && d.competition.trim() && d.lugar.trim() && d.dateStr && d.timeStr);

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
            <svg width="26" height="26" viewBox="0 0 24 24" style={PLUS_SVG_RED}><path d="M12 5v14M5 12h14" /></svg>
          </button>
        )}
      </div>

      {toast && <div style={TOAST}>{toast}</div>}
      {err && <div style={{ ...TOAST, background:"#fee2e2", border:"1px solid #fecaca", color:"#b91c1c" }}>{err}</div>}

      {isAdmin && createOpen && (
        <section style={EDIT_CARD}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center" }}>
            <input style={INPUT_UP} value={draft.equipo1} placeholder="Local" onInput={(e)=> setDraft(d => ({ ...d, equipo1: e.currentTarget.value }))}/>
            <div style={{ font:"600 14px/1 Montserrat,system-ui,sans-serif", color: RED }}>vs</div>
            <input style={INPUT_UP} value={draft.equipo2} placeholder="Visitante" onInput={(e)=> setDraft(d => ({ ...d, equipo2: e.currentTarget.value }))}/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center", marginTop:10 }}>
            <div style={FIELD_WITH_ICON}>
              <div style={FIELD_ICON}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ fill:"none", stroke:"#64748b", strokeWidth:1.6, strokeLinecap:"round", strokeLinejoin:"round" }}>
                  <path d="M8 21h8M12 17v4M6 3h12v4a6 6 0 0 1-12 0V3Z"/><path d="M18 5h2a2 2 0 0 1-2 2M6 5H4a2 2 0 0 0 2 2"/>
                </svg>
              </div>
              <select style={SELECT} value={draft.competition} onChange={(e)=> setDraft(d => ({ ...d, competition: e.currentTarget.value }))}>
                <option value="">Torneo</option>
                <option value="LaLiga">LaLiga</option>
                <option value="Europa League">Europa League</option>
                <option value="Copa do Rei">Copa do Rei</option>
              </select>
            </div>
            <div />
            <input style={INPUT} value={draft.lugar} placeholder="Localidad" onInput={(e)=> setDraft(d => ({ ...d, lugar: e.currentTarget.value }))}/>
          </div>

          <div style={{ ...GRID3, marginTop:10 }}>
            <input type="date" style={INPUT} value={draft.dateStr} onInput={(e)=> setDraft(d => ({ ...d, dateStr: e.currentTarget.value }))}/>
            <select value={draft.timeStr} style={SELECT} onChange={(e)=> setDraft(d => ({ ...d, timeStr: e.currentTarget.value }))}>
              <option value="">Establecer hora do encontro</option>
              {timeOptions().map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="button" style={SAVE_ICON_BTN} title="Gardar" onClick={onCreate} disabled={saving}>
              <svg width="22" height="22" viewBox="0 0 24 24" style={SAVE_SVG}><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v6H8V4"/><path d="M8 18h8"/></svg>
            </button>
          </div>
        </section>
      )}

      {view.map((r, idx) => {
        const niceDate = dmyWithWeekday(r.match_iso);
        const timeStr = r.match_iso ? new Date(r.match_iso).toLocaleTimeString("gl-ES", { hour: "2-digit", minute:"2-digit", hour12: false }) : "—";
        const number = view.length - idx; // 1 abaixo
        return (
          <article key={r.id} style={CARD}>
            <span style={BADGE}>{number}</span>
            <div style={ROW}>
              <div style={CARD_CONTENT}>
                <div style={TEAMS_LINE}>{(r.equipo1||"—").toUpperCase()} <span style={{ margin:"0 6px" }}>vs</span> {(r.equipo2||"—").toUpperCase()}</div>
                <div style={LINE}>Competición: <span>{r.competition || "—"}</span></div>
                <div style={LINE}>Lugar: <span>{r.lugar || "—"}</span></div>
                <div style={LINE}>Data: <span>{niceDate}</span></div>
                <div style={LINE}>Hora: <span>{timeStr}</span></div>
              </div>

              <div style={ACTIONS}>
                <button type="button" style={ICONBTN} title="Ver resultados da última aliñación" onClick={()=> route("/resultados-ultima-alineacion")} aria-label="Ver resultados da última aliñación">
                  <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                </button>
                {isAdmin && (
                  <button type="button" style={ICONBTN} title="Borrar partido" onClick={()=> onDelete(r.id)} aria-label="Borrar partido">
                    <svg width="20" height="20" viewBox="0 0 24 24" style={SVG_RED}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </main>
  );
}
