// src/pages/ResultadosHistoricos.jsx
import { h } from "preact";
import { useEffect, useMemo, useState, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos base ===== */
const WRAP = { maxWidth: 1120, margin: "0 auto", padding: "16px" };
const PAGE_HEAD = { margin: "0 0 6px", font: "700 22px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const PAGE_SUB = { margin: "0 0 12px", font: "400 16px/1.3 Montserrat,system-ui,sans-serif", color: "#475569" };

const LIST = { listStyle: "none", margin: 0, padding: 0 };
const ITEM = {
  display: "grid",
  gridTemplateColumns: "140px 1fr auto",
  gap: 12,
  alignItems: "center",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,.05)",
  marginBottom: 8,
};
const DATE = { font: "600 13px/1.1 Montserrat,system-ui,sans-serif", color: "#0f172a", whiteSpace: "nowrap" };
const TEAMS = { font: "800 14px/1.1 Montserrat,system-ui,sans-serif", textTransform: "uppercase", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const SEP = { margin: "0 6px", fontWeight: 800, color: "#0f172a" };

const ACTIONS = { display:"flex", gap:8, alignItems:"center", justifySelf:"end" };
const ICONBTN = { width:34, height:34, display:"grid", placeItems:"center", borderRadius:10, border:"1px solid #e2e8f0", background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)", cursor:"pointer" };
const SVGI = { fill:"none", stroke:"#0f172a", strokeWidth:1.9, strokeLinecap:"round", strokeLinejoin:"round" };

/* Toasts */
const TOAST_OK = { margin:"8px 0 12px", padding:"10px 12px", borderRadius:10, background:"#ecfeff", border:"1px solid #67e8f9", color:"#0e7490", font:"600 12.5px/1.2 Montserrat,system-ui,sans-serif" };
const TOAST_ERR = { ...TOAST_OK, background:"#fee2e2", border:"1px solid #fecaca", color:"#b91c1c" };

/* ===== Panel Persoas ===== */
const PEOPLE_SHELL = (twoCols) =>
  twoCols
    ? { marginTop:8, border:"1px solid #e2e8f0", borderRadius:10, background:"#fff", padding:12,
        display:"grid", gridTemplateColumns:"320px 1fr", gap:16, alignItems:"start" }
    : { marginTop:8, border:"1px solid #e2e8f0", borderRadius:10, background:"#fff", padding:"10px 12px" };

const USERS_LIST = { listStyle:"none", margin:0, padding:0, display:"grid", gap:6 };
const USER_ROW_BASE = { display:"grid", gridTemplateColumns:"auto 1fr auto", gap:6, alignItems:"center", padding:"6px 8px", borderRadius:8, border:"1px solid #eef2f7", background:"#f9fafb" };
const USER_ROW_BLINK = {
  ...USER_ROW_BASE,
  animation:"userBlink 1.5s ease-in-out infinite",
  background:"linear-gradient(180deg,#e8f5ff,#f9fafb)",
  boxShadow:"0 6px 18px rgba(14,165,233,.25)"
};
const USER_ROW_CONFIRMED = { ...USER_ROW_BASE, background:"linear-gradient(180deg,#eafff3,#f7fff9)", border:"1px solid #22c55e" };
const USER_BADGE = { font:"900 11px/1 Montserrat,system-ui,sans-serif", color:"#0ea5e9", background:"#e0f2fe", padding:"4px 7px", borderRadius:8, minWidth:38, textAlign:"center" };
const USER_NAME = { font:"800 13px/1.05 Montserrat,system-ui,sans-serif", color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" };
const USER_SUB  = { font:"600 11.5px/1.05 Montserrat,system-ui,sans-serif", color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" };

/* ===== Editor á dereita ===== */
const RIGHT_PAD = { paddingLeft: 16 }; // 2 espazos aprox
const EDIT_RIGHT = { display:"grid", gridTemplateColumns:"minmax(260px,1fr) minmax(260px,1fr)", gap:10, alignItems:"start" };
const COL_BASE = { border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden", position:"relative" };
const COL_BG_ALI = { background:"#e9f9f2" };
const COL_BG_OFI = { background:"#fff5e7" };
const COL_HEAD = { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 8px", background:"#f1f5f9", borderBottom:"1px solid #e2e8f0" };
const COL_TITLE = { font:"900 11.3px/1.05 Montserrat,system-ui,sans-serif", color:"#0f172a", letterSpacing:.2, textTransform:"uppercase" };
const COL_TITLE_BLINK = { ...COL_TITLE, animation:"blinkSoft 1.5s ease-in-out infinite" };
const COUNT = { font:"900 11.3px/1.05 Montserrat,system-ui,sans-serif", color:"#22c55e" };

const GROUP_SCROLL = { maxHeight: 188, overflowY: "auto", background: "inherit" };
/* interlineado mínimo e espazo extra entre checkbox e dorsal */
const ROW_PLAYER = { display:"grid", gridTemplateColumns:"18px 1fr", gap:6, alignItems:"center", padding:"0 6px", minWidth:0 };
const CHECKBOX = { width:16, height:16, transform:"scale(1.02)", marginRight:2 };
const playerNameStyle = { font:"700 12.2px/1 Montserrat,system-ui,sans-serif", color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" };
const POS_SEP = { height:1, background:"#e5e7eb" };
/* cabeceira de demarcación máis compacta */
const POS_TAG = (bg) => ({ font:"900 10px/1 Montserrat,system-ui,sans-serif", color:"#64748b", padding:"2px 6px", position:"sticky", top:0, zIndex:2, background:bg, borderBottom:"1px solid #e2e8f0" });

/* Resumo baixo as dúas táboas */
const SUMMARY = {
  marginTop:8,
  border:"1px solid #fecaca",
  borderRadius:12,
  background:"linear-gradient(180deg,#fff1f1,#ffe7e7)",
  padding:8
};
const SUMMARY_TITLE = { ...COL_TITLE, textDecoration:"underline", margin:"2px 0 6px 0" }; // RESULTADOS OBTIDOS
const T_HEADER = {
  display:"grid", gridTemplateColumns:"120px 1fr 70px 3fr", gap:8, padding:"4px 6px",
  borderBottom:"1px solid #e5e7eb", color:"#0f172a", font:"800 11.3px/1.05 Montserrat,system-ui,sans-serif"
};
const T_ROW    = {
  display:"grid", gridTemplateColumns:"120px 1fr 70px 3fr", gap:8, padding:"4px 6px",
  borderBottom:"1px solid #f1f5f9", font:"600 11.2px/1.05 Montserrat,system-ui,sans-serif"
};
const ACERTOS_CELL = { textAlign:"center" };
const CELSTE = { color:"#0ea5e9", fontWeight:800 };

const BTN_CONFIRM = { marginTop:8, width:"100%", borderRadius:10, padding:"9px 10px", font:"900 12.2px/1.05 Montserrat,system-ui,sans-serif", background:"linear-gradient(180deg,#38bdf8,#0ea5e9)", color:"#fff", border:"1px solid #0ea5e9", boxShadow:"0 3px 10px rgba(14,165,233,.18)", cursor:"pointer" };
const BTN_CONFIRM_BLINK = { ...BTN_CONFIRM, animation:"pulseSoft 1.5s ease-in-out infinite" };

const EMPTY = { marginTop:8, padding:"8px 10px", borderRadius:10, background:"#ecfeff", border:"1px solid #67e8f9", color:"#0e7490", font:"600 12.2px/1.2 Montserrat,system-ui,sans-serif" };
const ERR = { ...EMPTY, background:"#fee2e2", border:"1px solid #fecaca", color:"#b91c1c" };

const STYLES = `
@keyframes blinkSoft{0%{opacity:1}50%{opacity:.7}100%{opacity:1}}
@keyframes pulseSoft{0%{transform:scale(1)}50%{transform:scale(1.02)}100%{transform:scale(1)}}
@keyframes userBlink{
  0%{box-shadow:0 0 0 rgba(14,165,233,0.0)}
  50%{box-shadow:0 8px 22px rgba(14,165,233,0.35)}
  100%{box-shadow:0 0 0 rgba(14,165,233,0.0)}
}
`;

/* ===== Utils ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const sortDescByDate = (a, b) => (b.match_iso ? new Date(b.match_iso).getTime() : -Infinity) - (a.match_iso ? new Date(a.match_iso).getTime() : -Infinity);
const dmyShort = (iso) => { // dd/mm/yy-HH:MM
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth()+1);
  const yy = String(d.getFullYear()).slice(-2);
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${dd}/${mm}/${yy}-${hh}:${mi}`;
};

function inferPosFromFoto(url = "") {
  const m = url.match(/-(POR|DEF|CEN|DEL)\.(?:jpg|jpeg|png|webp)$/i);
  return m ? m[1].toUpperCase() : "CEN";
}
function normalizePlayer(p) {
  let nombre = p.nombre || "";
  let pos = p.pos || null;
  const nlow = nombre.trim().toLowerCase();
  if (nlow === "joel lago") { nombre = "Yoel Lago"; pos = "DEF"; }
  if (nlow.includes("jones") && nlow.includes("el-abdellaoui")) { pos = "DEL"; }
  return { ...p, nombre, pos };
}
const POS_ORDER = ["POR", "DEF", "CEN", "DEL"];
function groupByPos(players) {
  const b = { POR: [], DEF: [], CEN: [], DEL: [] };
  for (const p of players || []) (b[(p.pos || "CEN").toUpperCase()] || b.CEN).push(p);
  POS_ORDER.forEach(k => b[k].sort((a,b) => (a.dorsal ?? 999) - (b.dorsal ?? 999)));
  return b;
}

/* Sonidos */
function bipSingle(freq = 880, dur = 0.11) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.01);
    o.start(); o.stop(ctx.currentTime + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  } catch {}
}
function bipDouble(){ bipSingle(880,0.1); setTimeout(()=>bipSingle(920,0.1), 160); }

/* ===== Compo ===== */
export default function ResultadosHistoricos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  useEffect(() => { const onR = () => setIsMobile(window.innerWidth <= 560); window.addEventListener("resize", onR); return () => window.removeEventListener("resize", onR); }, []);

  const [editingMatchId, setEditingMatchId] = useState(null);
  const [openPeopleMatchId, setOpenPeopleMatchId] = useState(null);
  const [openResultsMatchId, setOpenResultsMatchId] = useState(null);

  const [openUserPanel, setOpenUserPanel] = useState(null);
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);

  const [selPlantilla, setSelPlantilla] = useState(new Set());
  const [selOnce, setSelOnce] = useState(new Set());

  const [resultsConfirmed, setResultsConfirmed] = useState({});
  const [confirmedUsersByMatch, setConfirmedUsersByMatch] = useState({}); // {matchId: Set<userId>}

  const showToast = (msg, ok=true) => { setToast({ msg, ok, t: Date.now() }); setTimeout(()=> setToast(""), 4200); };

  // Confirmación de gardado
  const [armedMatchId, setArmedMatchId] = useState(null);
  const armTimerRef = useRef(null);
  const armClear = () => { clearTimeout(armTimerRef.current); armTimerRef.current = null; setArmedMatchId(null); };

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
      setErr(""); setLoading(true);
      try {
        await resolveAdmin();
        const { data, error } = await supabase.from("matches_finalizados").select("id,equipo1,equipo2,match_iso");
        if (error) throw error;
        const norm = (data||[]).map(r => ({
          id:r.id??null,
          equipo1:(r.equipo1||"").toUpperCase(),
          equipo2:(r.equipo2||"").toUpperCase(),
          match_iso:r.match_iso||null
        })).sort(sortDescByDate);
        if (alive) setRows(norm);
      } catch (e) { console.error("Historico load:", e); if (alive) setErr("Produciuse un erro ao cargar o histórico."); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  async function ensurePlayersLoaded() {
    if (players.length) return;
    try {
      const { data: playersData, error: playersErr } = await supabase
        .from("jugadores").select("id, nombre, dorsal, foto_url");
      if (playersErr) throw playersErr;
      setPlayers((playersData||[]).map(pp => {
        const p = normalizePlayer(pp);
        const pos = p.pos || inferPosFromFoto(p.foto_url || "");
        return { id:p.id, dorsal:p.dorsal ?? null, pos, label: p.dorsal ? `${p.dorsal} - ${p.nombre}` : (p.nombre || "—") };
      }));
    } catch (e) { console.error("Load players error:", e); setPlayers([]); }
  }

  async function loadUsersList() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name, email")
        .order("first_name", { ascending: true, nullsFirst: true });
      if (error) throw error;

      const arr = (data||[])
        .map(u => {
          const code = (u.first_name || "").trim();
          const surname = (u.last_name || "").trim();
          const email = (u.email || "").trim();
          const full = (u.full_name || "").trim();
          const displayName =
            full ||
            `${code} ${surname}`.trim() ||
            email ||
            u.id;
          const allEmpty = !full && !code && !surname && !email;
          return allEmpty ? null : { id: u.id, code, surname, name: displayName };
        })
        .filter(Boolean)
        .sort((a,b) => {
          const na = /^\d{2}$/.test(a.code||"") ? 0 : 1;
          const nb = /^\d{2}$/.test(b.code||"") ? 0 : 1;
          if (na !== nb) return na - nb;
          return (a.code||"").localeCompare(b.code||"");
        });

      setUsers(arr);
    } catch (e) {
      console.error("load users error:", e);
      showToast("Erro cargando usuarias/os.", false);
    }
  }

  async function loadConfirmedForMatch(matchId) {
    try {
      const { data, error } = await supabase
        .from("resultados_confirmados")
        .select("user_id, confirmed_at, acertos, plantilla_ids, once_ids")
        .eq("match_id", matchId)
        .order("confirmed_at", { ascending:false });
      if (error) throw error;

      const ids = Array.from(new Set((data||[]).map(r => r.user_id))).filter(Boolean);
      let profMap = new Map();
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        profMap = new Map((profs||[]).map(p => [p.id, (p.full_name || p.id)]));
      }

      const arr = (data||[]).map(rec => ({
        whenISO: rec.confirmed_at,
        userId: rec.user_id,
        userName: profMap.get(rec.user_id) || rec.user_id,
        acertos: rec.acertos,
        plantillaIds: rec.plantilla_ids || [],
        onceIds: rec.once_ids || [],
      }));

      setResultsConfirmed(prev => ({ ...prev, [matchId]: arr }));
    } catch (e) {
      console.error("loadConfirmedForMatch error:", e);
      showToast("Erro cargando resultados confirmados.", false);
    }
  }

  async function onClickPeople(matchId) {
    if (!isAdmin) return;
    const opening = openPeopleMatchId !== matchId;
    setOpenPeopleMatchId(opening ? matchId : null);
    setOpenUserPanel(null);
    setEditingMatchId(opening ? matchId : null);
    if (opening) { await loadUsersList(); await ensurePlayersLoaded(); }
  }

  async function onOpenUserEditor(matchId, userId) {
    if (!isAdmin) return;
    bipSingle();
    setEditingMatchId(matchId);
    setOpenUserPanel(userId);
    setSelPlantilla(new Set());
    setSelOnce(new Set());
    await ensurePlayersLoaded();
  }

  async function confirmarMatch(matchId) {
    try {
      if (!openUserPanel) { showToast("Selecciona unha usuaria/o primeiro (teclado).", false); return; }
      if (selPlantilla.size !== 11) { showToast("Aliñación realizada debe ter 11.", false); return; }
      if (selOnce.size !== 11) { showToast("Once oficial debe ter 11.", false); return; }

      if (armedMatchId !== matchId) {
        bipSingle(); setArmedMatchId(matchId);
        armTimerRef.current = setTimeout(() => setArmedMatchId(null), 8000);
        showToast("Preme de novo para confirmar.", true);
        return;
      }

      bipDouble();
      try { if (!window.confirm("¿Seguro que queres gardar esta aliñación?")) return; } catch {}

      const plantillaSet = new Set(selPlantilla);
      const onceSet = new Set(selOnce);
      let acertos = 0; onceSet.forEach(id => { if (plantillaSet.has(id)) acertos++; });

      const confirmedAtISO = new Date().toISOString();
      const payload = [{
        match_id: matchId,
        user_id: openUserPanel,
        confirmed_at: confirmedAtISO,
        acertos,
        plantilla_ids: Array.from(plantillaSet),
        once_ids: Array.from(onceSet),
        updated_at: confirmedAtISO,
      }];

      const { error: upErr } = await supabase
        .from("resultados_confirmados")
        .upsert(payload, { onConflict:"match_id,user_id", ignoreDuplicates:false });
      if (upErr) { showToast(`Erro gardando: ${upErr.message}`, false); armClear(); return; }

      // Marca esa persoa como confirmada (verde) para ese partido
      setConfirmedUsersByMatch(prev => {
        const cur = new Set(prev[matchId] || []);
        cur.add(openUserPanel);
        return { ...prev, [matchId]: cur };
      });

      // Pecha todo, sen abrir o ollo; a consulta verase no ollo xeral
      setOpenUserPanel(null);
      setOpenPeopleMatchId(null);
      setEditingMatchId(null);
      setSelPlantilla(new Set());
      setSelOnce(new Set());
      armClear();

      await loadConfirmedForMatch(matchId);
    } catch (e) {
      console.error("confirmarMatch error:", e);
      showToast("Erro inesperado ao confirmar.", false);
      armClear();
    }
  }

  const view = useMemo(() => rows, [rows]);
  const aliIs11 = selPlantilla.size === 11;
  const onceIs11 = selOnce.size === 11;

  function renderPlayersColumn(list, checkedSet, onToggle, bg) {
    const buckets = groupByPos(list);
    return (
      <div style={{ ...COL_BASE, ...(bg || {}) }}>
        <div style={COL_HEAD}>
          <span style={bg === COL_BG_OFI ? (aliIs11 ? COL_TITLE_BLINK : COL_TITLE) : COL_TITLE}>
            {bg === COL_BG_OFI ? "ONCE OFICIAL" : "ALIÑACIÓN REALIZADA"}
          </span>
          <span style={COUNT}>{checkedSet.size}/11</span>
        </div>
        {POS_ORDER.map((k) => {
          const group = buckets[k] || [];
          if (!group.length) return null;
          return (
            <div key={k} style={{ background:"inherit" }}>
              <div style={POS_TAG((bg && bg.background) || "#fff")}>{k}</div>
              <div style={POS_SEP} />
              <div style={GROUP_SCROLL}>
                {group.map(p => {
                  const isChecked = checkedSet.has(p.id);
                  return (
                    <label key={p.id} style={ROW_PLAYER} title={p.label}>
                      <input type="checkbox" style={CHECKBOX} checked={isChecked} onChange={()=> onToggle(p.id)} />
                      <span style={playerNameStyle}>{p.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderSummary(user) {
    const playersById = new Map(players.map(p => [p.id, p]));
    const acertosLive = Array.from(selOnce).filter(id => selPlantilla.has(id)).length;
    const aliLabels = Array.from(selPlantilla).map(pid => {
      const p = playersById.get(pid);
      const ok = selOnce.has(pid);
      const label = p ? p.label : "—";
      return ok ? <strong style={CELSTE}>{label}</strong> : <span>{label}</span>;
    });
    const out = [];
    aliLabels.forEach((node, i) => { out.push(node); if (i < aliLabels.length - 1) out.push(<span style={{ opacity:.6 }}> {" | "} </span>); });

    return (
      <div style={SUMMARY}>
        <div style={SUMMARY_TITLE}>RESULTADOS OBTIDOS</div>
        <div role="table" style={{ width:"100%" }}>
          <div role="row" style={T_HEADER}>
            <div>Data e hora</div><div>HDC Membro</div><div style={{textAlign:"center"}}>Acertos</div><div>Aliñación presentada</div>
          </div>
          <div role="row" style={T_ROW}>
            <div>{dmyShort(new Date().toISOString())}</div>
            <div>{user?.name || "—"}</div>
            <div style={ACERTOS_CELL}><span style={CELSTE}>{acertosLive}</span></div>
            <div>{out}</div>
          </div>
        </div>
        <button
          type="button"
          style={onceIs11 ? BTN_CONFIRM_BLINK : BTN_CONFIRM}
          onClick={()=> confirmarMatch(editingMatchId)}
        >
          CONFIRMAR
        </button>
      </div>
    );
  }

  return (
    <main style={WRAP}>
      <style>{STYLES}</style>

      <h2 style={PAGE_HEAD}>HISTÓRICO DE RESULTADOS</h2>
      <p style={PAGE_SUB}>Índice dos partidos rematados (máis recente → máis antigo).</p>

      {toast?.msg && <div style={toast.ok ? TOAST_OK : TOAST_ERR} aria-live="polite">{toast.msg}</div>}
      {err && <div style={ERR} role="status" aria-live="polite"> {err} </div>}
      {!err && loading && <div style={EMPTY} role="status" aria-live="polite">Cargando…</div>}
      {!err && !loading && view.length === 0 && (<div style={EMPTY} role="status" aria-live="polite">Non hai partidos rematados aínda.</div>)}

      {!err && !loading && view.length > 0 && (
        <ul style={LIST} aria-label="Lista de partidos rematados">
          {view.map((match, i) => {
            const isPeopleOpen = openPeopleMatchId === match.id;
            const isResultsOpen = openResultsMatchId === match.id;
            const userObj = users.find(u => u.id === openUserPanel);
            const confirmedSet = confirmedUsersByMatch[match.id] || new Set();

            return (
              <li key={`${match.id ?? match.match_iso ?? "noid"}-${i}`} style={{ ...ITEM, marginBottom: (isPeopleOpen || isResultsOpen) ? 12 : 8 }}>
                <span style={DATE}>{dmyShort(match.match_iso)}</span>
                <span style={TEAMS}>{match.equipo1 || "—"} <span style={SEP}>-</span> {match.equipo2 || "—"}</span>

                <div style={ACTIONS}>
                  {isAdmin && !isMobile && (
                    <>
                      {/* Se está aberta a pestaña xeral: só X; se non: só persoas */}
                      {!isPeopleOpen ? (
                        <button
                          type="button"
                          style={ICONBTN}
                          title="Ver usuarias/os"
                          aria-label="Ver usuarias/os"
                          onClick={()=> onClickPeople(match.id)}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}>
                            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          style={ICONBTN}
                          title="Pechar etiqueta do partido"
                          aria-label="Pechar etiqueta do partido"
                          onClick={()=> { setOpenPeopleMatchId(null); setOpenUserPanel(null); setEditingMatchId(null); }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" style={SVGI}>
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}

                  {/* Ollo (resultados confirmados) */}
                  <button
                    type="button"
                    style={ICONBTN}
                    title={isResultsOpen ? "Pechar resultados" : "Ver resultados do partido"}
                    aria-label={isResultsOpen ? "Pechar resultados" : "Ver resultados do partido"}
                    onClick={async ()=>{
                      const opening = openResultsMatchId !== match.id;
                      setOpenResultsMatchId(opening ? match.id : null);
                      if (opening) { await ensurePlayersLoaded(); await loadConfirmedForMatch(match.id); }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  </button>

                  {isResultsOpen && (
                    <button
                      type="button"
                      style={ICONBTN}
                      title="Pechar pestaña"
                      aria-label="Pechar pestaña"
                      onClick={()=> setOpenResultsMatchId(null)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" style={SVGI}>
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* PANEL PERSOAS + EDITOR Á DEREITA */}
                {isPeopleOpen && isAdmin && !isMobile && (
                  <section style={PEOPLE_SHELL(!!openUserPanel)} aria-label="Edición por usuaria/o">
                    {/* Columna esquerda: persoas */}
                    <div>
                      {users.length === 0 ? (
                        <div style={EMPTY}>Cargando usuarias/os…</div>
                      ) : (
                        <ul style={USERS_LIST}>
                          {users.map(u => {
                            const isOpen = openUserPanel === u.id;
                            const isConfirmed = confirmedSet.has(u.id);
                            const rowStyle = isConfirmed ? USER_ROW_CONFIRMED : (isOpen ? USER_ROW_BLINK : USER_ROW_BASE);
                            return (
                              <li key={u.id} style={rowStyle} title={u.name}>
                                <span style={USER_BADGE}>{u.code || "—"}</span>
                                <div>
                                  <div style={USER_NAME}>{u.name}</div>
                                  {u.surname && <div style={USER_SUB}>{u.surname}</div>}
                                </div>
                                {/* Se está aberta a edición desta persoa → só X; se non, só teclado */}
                                {!isOpen ? (
                                  <button
                                    type="button"
                                    style={ICONBTN}
                                    title="Abrir táboas desta persoa"
                                    aria-label="Abrir táboas desta persoa"
                                    onClick={()=> onOpenUserEditor(match.id, u.id)}
                                  >
                                    <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}>
                                      <rect x="3" y="6" width="18" height="12" rx="2" />
                                      <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
                                    </svg>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    style={ICONBTN}
                                    title="Pechar editor desta persoa"
                                    aria-label="Pechar editor desta persoa"
                                    onClick={()=> { if (openUserPanel === u.id) setOpenUserPanel(null); }}
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" style={SVGI}>
                                      <path d="M18 6 6 18M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {/* Dereita: dúas táboas + resumo (se hai persoa aberta) */}
                    {openUserPanel && (
                      <div style={RIGHT_PAD}>
                        {players.length === 0 ? (
                          <div style={EMPTY}>Cargando xogadoras/es…</div>
                        ) : (
                          <>
                            <div style={EDIT_RIGHT}>
                              {renderPlayersColumn(
                                players,
                                selPlantilla,
                                (id)=>{ const nx=new Set(selPlantilla); nx.has(id)?nx.delete(id):nx.add(id); setSelPlantilla(nx); armClear(); },
                                COL_BG_ALI
                              )}
                              {renderPlayersColumn(
                                players,
                                selOnce,
                                (id)=>{ const nx=new Set(selOnce); nx.has(id)?nx.delete(id):nx.add(id); setSelOnce(nx); armClear(); },
                                COL_BG_OFI
                              )}
                            </div>
                            {renderSummary(userObj)}
                          </>
                        )}
                      </div>
                    )}
                  </section>
                )}

                {/* Pestaña de resultados confirmados (visor) */}
                {openResultsMatchId === match.id && (
                  <section style={{ marginTop:8, border:"1px solid #e5e7eb", borderRadius:12, background:"#fff", padding:8 }}>
                    <div style={{ ...SUMMARY_TITLE }}>RESULTADOS OBTIDOS (confirmados)</div>
                    <div role="table" style={{ width:"100%" }}>
                      <div role="row" style={T_HEADER}>
                        <div>Data e hora</div><div>HDC Membro</div><div style={{textAlign:"center"}}>Acertos</div><div>Aliñación presentada</div>
                      </div>
                      {(resultsConfirmed[match.id] || []).map((rec, idx) => (
                        <div key={`${rec.userId}-${idx}`} role="row" style={T_ROW}>
                          <div>{dmyShort(rec.whenISO)}</div>
                          <div>{rec.userName}</div>
                          <div style={ACERTOS_CELL}><span style={CELSTE}>{rec.acertos}</span></div>
                          <div>
                            {(rec.plantillaIds||[]).map((pid, j, arr) => {
                              const p = players.find(px=>px.id===pid);
                              const ok = (rec.onceIds||[]).includes(pid);
                              const label = p ? p.label : "—";
                              return (
                                <span key={pid}>
                                  {ok ? <strong style={CELSTE}>{label}</strong> : <span>{label}</span>}
                                  {j < arr.length-1 && <span style={{ opacity:.6 }}> {" | "} </span>}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
