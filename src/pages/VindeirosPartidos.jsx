// src/pages/VindeirosPartidos.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos base ===== */
const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };
const PAGE_HEAD = { margin: "0 0 8px", font: "700 22px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const PAGE_SUB_ROW = { display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:10, marginBottom:12 };
const PAGE_SUB  = { margin: 0, font: "400 15px/1.25 Montserrat,system-ui,sans-serif", color: "#475569" };

/* Botón “+” verde */
const PLUS_BTN_GREEN = { display:"inline-grid", placeItems:"center", width: 36, height: 36, borderRadius: 10, background: "linear-gradient(180deg,#34d399,#22c55e)", border: "1px solid #22c55e", boxShadow: "0 6px 18px rgba(34,197,94,.28)", cursor: "pointer" };
const PLUS_SVG_GREEN = { fill:"none", stroke:"#ffffff", strokeWidth:1.6, strokeLinecap:"round", strokeLinejoin:"round" };

/* Tarxetas */
const CARD_BASE = { position:"relative", borderRadius: 14, padding: 12, boxShadow: "0 6px 18px rgba(0,0,0,.05)", marginBottom: 10 };
const CARD = { ...CARD_BASE, border: "1px solid #22c55e", background: "linear-gradient(180deg,#f5fff7,#f0fff4)" };
const CARD_ACTIVE = {
  ...CARD_BASE,
  border: "2px solid #16a34a",
  background: "linear-gradient(180deg,#d1fae5,#bbf7d0)",
  boxShadow: "0 10px 24px rgba(22,163,74,.22)"
};

const ROW = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
  gap: 8,
  alignItems: "start"
});
const CARD_CONTENT = { paddingLeft: 48 };

/* Título equipos: desktop 16px, móvil -20% = 13px */
const TEAMS_LINE = (isMobile) => ({
  font: `600 ${isMobile ? 13 : 16}px/1.12 Montserrat,system-ui,sans-serif`,
  color: "#0f172a",
  textTransform: "uppercase"
});
const LINE = { font: "400 13px/1.12 Montserrat,system-ui,sans-serif", color: "#334155", marginTop: 2 };

const BADGE = { position:"absolute", top:8, left:8, font:"700 12px/1 Montserrat,system-ui,sans-serif", background:"#22c55e", color:"#fff", padding:"4px 7px", borderRadius:999 };

const ACTIONS = { display: "flex", gap: 8, alignItems: "center" };
const ICONBTN = { width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.06)", cursor: "pointer" };
const SVGI = { fill: "none", stroke: "#0f172a", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
const SVG_GREEN = { ...SVGI, stroke: "#16a34a" };
const SVG_RED = { ...SVGI, stroke: "#dc2626" };

/* Form creación */
const EDIT_CARD = { border: "1px solid #a7f3d0", borderRadius: 14, background: "linear-gradient(180deg,#ecfdf5,#f0fff7)", padding: 12, boxShadow: "0 6px 18px rgba(0,0,0,.05)", marginBottom: 12 };
const GRID3 = { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems:"center" };
const INPUT = { width: "100%", borderRadius: 10, border: "1px solid #dbe2f0", background: "#fff", padding: "10px 12px", font: "400 14px/1.1 Montserrat,system-ui,sans-serif", color: "#0f172a", outline: "none" };
const INPUT_UP = { ...INPUT, textTransform:"uppercase" };
const FIELD_WITH_ICON = { position:"relative", display:"grid" };
const FIELD_ICON = { position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", opacity:.55 };
const SELECT = { ...INPUT, appearance: "none", paddingLeft: 36, paddingRight: 36, cursor: "pointer", textTransform: "none" };

const SAVE_ICON_BTN = { width: 42, height: 42, display:"grid", placeItems:"center", borderRadius: 10, border: "1px solid #22c55e", background: "linear-gradient(180deg,#34d399,#22c55e)", boxShadow: "0 6px 18px rgba(34,197,94,.30)", cursor: "pointer" };
const SAVE_SVG = { fill:"none", stroke:"#fff", strokeWidth:2, strokeLinecap:"round", strokeLinejoin:"round" };

const TOAST = { margin: "8px 0 12px", padding: "10px 12px", borderRadius: 10, background: "#ecfeff", border: "1px solid #67e8f9", color: "#0e7490", font: "600 13px/1.2 Montserrat,system-ui,sans-serif" };

/* ===== Utils ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const timeOptions = () => { const r=[]; for (let h=11; h<=24; h++) for (const m of [0,15,30,45]) r.push(`${String(h===24?0:h).padStart(2,"0")}:${String(m).padStart(2,"0")}`); return r; };
const toISOFromParts = (d,t) => (!d||!t) ? null : (isNaN(new Date(`${d}T${t}:00`).getTime())? null : new Date(`${d}T${t}:00`).toISOString());
function dmyWithWeekday(iso){ if(!iso) return "—"; const d=new Date(iso); try{const w=new Intl.DateTimeFormat("gl-ES",{weekday:"long",timeZone:"Europe/Madrid"}).format(d); return `${w}, ${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;}catch{ return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;}}
const sortAscByDate = (a,b)=> (a.match_iso?new Date(a.match_iso).getTime():Infinity)-(b.match_iso?new Date(b.match_iso).getTime():Infinity);

/* ===== Página ===== */
export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [nextMatchIso, setNextMatchIso] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);

  const [draft, setDraft] = useState({ equipo1:"", equipo2:"", lugar:"", competition:"", dateStr:"", timeStr:"" });

  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 560);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  async function resolveAdminAndNext() {
    const { data: s } = await supabase.auth.getSession();
    const email = s?.session?.user?.email?.toLowerCase() || "";
    const uid   = s?.session?.user?.id || null;
    let admin = (email === "hdcliga@gmail.com" || email === "hdcliga2@gmail.com");
    if (!admin && uid) {
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
      if ((prof?.role||"").toLowerCase() === "admin") admin = true;
    }
    setIsAdmin(admin);

    const { data: nm } = await supabase.from("next_match").select("match_iso").eq("id",1).maybeSingle();
    setNextMatchIso(nm?.match_iso || null);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      await resolveAdminAndNext();
      await loadList();
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      if (!alive) return;
      await resolveAdminAndNext();
      await loadList();
    });
    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  async function loadList() {
    setErr("");
    try {
      const { data, error } = await supabase.from("matches_vindeiros").select("*");
      if (error) throw error;
      const m = (data || []).map(r => ({
        id: r.id ?? null,
        equipo1: r.equipo1 || "",
        equipo2: r.equipo2 || "",
        lugar:   r.lugar   || "",
        competition: r.competition || "",
        match_iso: r.match_iso || null,
        updated_at: r.updated_at || null
      })).sort(sortAscByDate);
      setRows(m);
    } catch (e) {
      console.error("loadList Vindeiros:", e);
      setErr("Erro cargando Vindeiros.");
    }
  }

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 3500); };
  const allDraftFilled = (d) => !!(d.equipo1.trim() && d.equipo2.trim() && d.lugar.trim() && d.competition.trim() && d.dateStr && d.timeStr);

  async function onPromote(id) {
    if (!isAdmin) return;
    const r = rows.find(x=>x.id===id);
    if (!r) return;
    if (!window.confirm("Subir este partido a ‘Próximo Partido’?")) return;
    try {
      const payload = { id:1, equipo1:r.equipo1?.toUpperCase()||null, equipo2:r.equipo2?.toUpperCase()||null, lugar:r.lugar||null, competition:r.competition||null, match_iso:r.match_iso||null, updated_at:new Date().toISOString() };
      const { error } = await supabase.from("next_match").upsert(payload, { onConflict:"id" });
      if (error) throw error;
      setNextMatchIso(r.match_iso || null);
      showToast("Partido subido a Próximo Partido.");
    } catch (e) {
      console.error(e);
      showToast("Erro subindo o partido.");
    }
  }

  async function onDelete(id) {
    if (!isAdmin) return;
    if (!window.confirm("Borrar esta tarxeta de Vindeiros?")) return;
    try {
      const { error } = await supabase.from("matches_vindeiros").delete().eq("id", id);
      if (error) throw error;
      setRows(cur=>cur.filter(x=>x.id!==id));
      showToast("Tarxeta eliminada.");
    } catch (e) {
      console.error(e);
      showToast("Erro eliminando a tarxeta.");
    }
  }

  async function onCreate() {
    if (!isAdmin) { showToast("Só admins poden gardar."); return; }
    if (saving) return;
    if (!allDraftFilled(draft)) { showToast("Rechea todos os campos para gardar."); return; }
    setSaving(true);
    try {
      const iso = toISOFromParts(draft.dateStr, draft.timeStr);
      const payload = { equipo1: draft.equipo1.trim().toUpperCase(), equipo2: draft.equipo2.trim().toUpperCase(), lugar: draft.lugar.trim(), competition: draft.competition.trim(), match_iso: iso, updated_at: new Date().toISOString() };
      const { data, error } = await supabase.from("matches_vindeiros").insert(payload).select("*").single();
      if (error) throw error;
      setRows((cur)=>[...cur, data].sort(sortAscByDate));
      setDraft({ equipo1:"", equipo2:"", lugar:"", competition:"", dateStr:"", timeStr:"" });
      setCreateOpen(false);
      showToast("Partido gardado en Vindeiros.");
    } catch (e) {
      console.error("insert Vindeiros:", e);
      showToast("Erro gardando o partido.");
    } finally { setSaving(false); }
  }

  const view = useMemo(() => rows, [rows]);

  return (
    <main style={WRAP}>
      <h2 style={PAGE_HEAD}>Vindeiros partidos</h2>

      <div style={PAGE_SUB_ROW}>
        <p style={PAGE_SUB}>Próximos partidos a xogar polo Celta con data programada.</p>
        {isAdmin && (
          <button type="button" style={PLUS_BTN_GREEN} onClick={()=> setCreateOpen(v=>!v)} title="Crear novo partido" aria-label="Crear novo partido">
            <svg width="26" height="26" viewBox="0 0 24 24" style={PLUS_SVG_GREEN}><path d="M12 5v14M5 12h14" /></svg>
          </button>
        )}
      </div>

      {toast && <div style={TOAST}>{toast}</div>}
      {err && <div style={{ ...TOAST, background:"#fee2e2", border:"1px solid #fecaca", color:"#b91c1c" }}>{err}</div>}

      {isAdmin && createOpen && (
        <section style={EDIT_CARD}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center" }}>
            <input style={INPUT_UP} value={draft.equipo1} placeholder="Local" onInput={(e)=> setDraft(d => ({ ...d, equipo1: e.currentTarget.value }))}/>
            <div style={{ font:"600 14px/1 Montserrat,system-ui,sans-serif", color:"#0f172a" }}>vs</div>
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
            <select style={SELECT} value={draft.timeStr} onChange={(e)=> setDraft(d => ({ ...d, timeStr: e.currentTarget.value }))}>
              <option value="">Establecer hora do encontro</option>
              {timeOptions().map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="button" style={SAVE_ICON_BTN} title="Gardar" onClick={onCreate} disabled={saving}>
              <svg width="22" height="22" viewBox="0 0 24 24" style={SAVE_SVG}><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v6H8V4"/><path d="M8 18h8"/></svg>
            </button>
          </div>
        </section>
      )}

      {view.slice(0,10).map((r, idx) => {
        const niceDate = dmyWithWeekday(r.match_iso);
        const timeStr = r.match_iso ? new Date(r.match_iso).toLocaleTimeString("gl-ES", { hour: "2-digit", minute:"2-digit", hour12: false }) : "—";
        const number = idx + 1;
        const isActive = nextMatchIso && r.match_iso && (new Date(r.match_iso).getTime() === new Date(nextMatchIso).getTime());

        return (
          <article key={r.id} style={isActive ? CARD_ACTIVE : CARD}>
            <span style={BADGE}>{number}</span>

            <div style={ROW(isMobile)}>
              <div style={CARD_CONTENT}>
                <div style={TEAMS_LINE(isMobile)}>
                  {(r.equipo1||"—").toUpperCase()}
                  <span style={{ margin:"0 6px" }}>vs</span>
                  {(r.equipo2||"—").toUpperCase()}
                </div>
                <div style={LINE}>Competición: <span>{r.competition || "—"}</span></div>
                <div style={LINE}>Lugar: <span>{r.lugar || "—"}</span></div>
                <div style={LINE}>Data: <span>{niceDate}</span></div>

                {/* Hora + Acciones (solo móvil van juntos) */}
                <div style={{ ...LINE, display:"grid", gridTemplateColumns: isMobile ? "1fr auto" : "1fr", alignItems:"center", gap: 8 }}>
                  <span>Hora: <span>{timeStr}</span></span>
                  {isAdmin && isMobile && (
                    <div style={ACTIONS}>
                      <button type="button" style={ICONBTN} title="Subir a Próximo Partido" onClick={()=> onPromote(r.id)} aria-label="Subir a Próximo Partido">
                        <svg width="20" height="20" viewBox="0 0 24 24" style={SVG_GREEN}><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></svg>
                      </button>
                      <button type="button" style={ICONBTN} title="Borrar tarxeta" onClick={()=> onDelete(r.id)} aria-label="Borrar tarxeta">
                        <svg width="20" height="20" viewBox="0 0 24 24" style={SVG_RED}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones a la derecha: solo desktop */}
              {isAdmin && !isMobile && (
                <div style={ACTIONS}>
                  <button type="button" style={ICONBTN} title="Subir a Próximo Partido" onClick={()=> onPromote(r.id)} aria-label="Subir a Próximo Partido">
                    <svg width="20" height="20" viewBox="0 0 24 24" style={SVG_GREEN}><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></svg>
                  </button>
                  <button type="button" style={ICONBTN} title="Borrar tarxeta" onClick={()=> onDelete(r.id)} aria-label="Borrar tarxeta">
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
