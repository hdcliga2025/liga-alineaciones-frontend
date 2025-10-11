// src/pages/ResultadosHistoricos.jsx
import { h } from "preact";
import { useEffect, useMemo, useState, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos base ===== */
const WRAP = { maxWidth: 1040, margin: "0 auto", padding: "16px" };
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
const DATE = { font: "600 14px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a", whiteSpace: "nowrap" };
const TEAMS = { font: "700 15.5px/1.2 Montserrat,system-ui,sans-serif", textTransform: "uppercase", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const SEP = { margin: "0 6px", fontWeight: 700, color: "#0f172a" };

const ACTIONS = { display:"flex", gap:8, alignItems:"center", justifySelf:"end" };
const ICONBTN = { width:34, height:34, display:"grid", placeItems:"center", borderRadius:10, border:"1px solid #e2e8f0", background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)", cursor:"pointer" };
const SVGI = { fill:"none", stroke:"#0f172a", strokeWidth:1.9, strokeLinecap:"round", strokeLinejoin:"round" };

const EDIT_WRAP = { marginTop: 8, border: "1px solid #dbe2f0", borderRadius: 12, background:"#f8fafc", padding: 12, marginLeft: -12, marginRight: -12 };

/* Toasts */
const TOAST_OK = { margin:"8px 0 12px", padding:"10px 12px", borderRadius:10, background:"#ecfeff", border:"1px solid #67e8f9", color:"#0e7490", font:"600 13px/1.2 Montserrat,system-ui,sans-serif" };
const TOAST_ERR = { ...TOAST_OK, background:"#fee2e2", border:"1px solid #fecaca", color:"#b91c1c" };

/* Lista de usuarios (panel simple) */
const USERS_PANEL = { marginTop:8, border:"1px solid #e2e8f0", borderRadius:10, background:"#fff", padding:"10px 12px" };
const USERS_LIST = { listStyle:"none", margin:0, padding:0, display:"grid", gap:6 };
const USER_ROW = { display:"grid", gridTemplateColumns:"auto 1fr auto", gap:8, alignItems:"center", padding:"6px 8px", borderRadius:8, border:"1px solid #eef2f7", background:"#f9fafb" };
const USER_BADGE = { font:"800 12px/1 Montserrat,system-ui,sans-serif", color:"#0ea5e9", background:"#e0f2fe", padding:"5px 8px", borderRadius:8, minWidth:42, textAlign:"center" };
const USER_NAME = { font:"800 14px/1.1 Montserrat,system-ui,sans-serif", color:"#0f172a" };
const USER_SUB  = { font:"600 12.5px/1.15 Montserrat,system-ui,sans-serif", color:"#64748b" };

/* Columnas do cruce */
const threeColStyle = (minPx, isMobile) =>
  isMobile
    ? { display:"grid", gridTemplateColumns:"1fr", gap:12, alignItems:"start" }
    : { display:"grid", gridTemplateColumns:`repeat(3, minmax(${minPx}px, 1fr))`, gap:12, alignItems:"start" };

const COL_BASE = { border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden", position:"relative" };
const COL_BG_ALI = { background:"#e9f9f2" };
const COL_BG_OFI = { background:"#fff5e7" };
const COL_BG_ACE = { background:"#ffe9e9" };

const COL_HEAD = { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", background:"#f1f5f9", borderBottom:"1px solid #e2e8f0" };
const COL_TITLE = { font:"900 12px/1.05 Montserrat,system-ui,sans-serif", color:"#0f172a", letterSpacing:.2 };
const COL_TITLE_BLINK = { ...COL_TITLE, animation:"blinkSoft 1.5s ease-in-out infinite" };
const COUNT = { font:"900 12px/1.05 Montserrat,system-ui,sans-serif", color:"#22c55e" };
const COUNT_CELESTE_BLINK = { font:"900 12px/1.05 Montserrat,system-ui,sans-serif", color:"#0ea5e9", animation:"blinkScale 1.5s ease-in-out infinite" };

const GROUP_SCROLL = (isMobile) => ({ maxHeight: isMobile ? 132 : 176, overflowY: "auto", background: "inherit" });
const ROW_PLAYER = { display:"grid", gridTemplateColumns:"22px 1fr", gap:8, alignItems:"center", padding:"2px 6px", borderBottom:"1px solid #f1f5f9", minWidth:0 };
const ROW_PLAYER_NOCHK = { display:"grid", gridTemplateColumns:"1fr", gap:2, alignItems:"center", padding:"2px 6px", borderBottom:"1px solid #f1f5f9", minWidth:0 };
const CHECKBOX = { width:18, height:18, transform:"scale(1.18)" };
const playerNameStyle = () => ({ font:"700 13.6px/1.04 Montserrat,system-ui,sans-serif", color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" });
const POS_SEP = { height:1, background:"#e5e7eb" };
const POS_TAG_BASE = { font:"900 10.5px/1 Montserrat,system-ui,sans-serif", color:"#64748b", padding:"5px 8px" };
const POS_TAG_STICKY = (bg) => ({ ...POS_TAG_BASE, position:"sticky", top:0, zIndex:2, background:bg, borderBottom:"1px solid #e2e8f0" });
const COUNT_INLINE = { display:"inline-block", marginLeft:8, padding:"2px 8px", borderRadius:999, font:"900 12px/1 Montserrat,system-ui,sans-serif", color:"#fff", background:"#0ea5e9", boxShadow:"0 2px 8px rgba(14,165,233,.25)" };
const BTN_CONFIRM = { width:"100%", borderRadius:10, padding:"10px 12px", font:"900 12.8px/1.05 Montserrat,system-ui,sans-serif", background:"linear-gradient(180deg,#38bdf8,#0ea5e9)", color:"#fff", border:"1px solid #0ea5e9", boxShadow:"0 3px 10px rgba(14,165,233,.20)", cursor:"pointer" };
const BTN_CONFIRM_BLINK = { ...BTN_CONFIRM, animation:"pulseSoft 1.5s ease-in-out infinite" };
const EMPTY = { marginTop:8, padding:"10px 12px", borderRadius:10, background:"#ecfeff", border:"1px solid #67e8f9", color:"#0e7490", font:"600 13px/1.2 Montserrat,system-ui,sans-serif" };
const ERR = { ...EMPTY, background:"#fee2e2", border:"1px solid #fecaca", color:"#b91c1c" };

const STYLES = `
@keyframes blinkScale{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
@keyframes blinkSoft{0%{opacity:1}50%{opacity:.6}100%{opacity:1}}
@keyframes pulseSoft{0%{transform:scale(1)}50%{transform:scale(1.02)}100%{transform:scale(1)}}
`;

/* ===== Utils ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const sortDescByDate = (a, b) => (b.match_iso ? new Date(b.match_iso).getTime() : -Infinity) - (a.match_iso ? new Date(a.match_iso).getTime() : -Infinity);
const dmy = (iso) => { if (!iso) return "—"; const d = new Date(iso); return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`; };

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
function measureLongestLabelPx(players) {
  if (typeof document === "undefined") return 260;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = "700 13.6px Montserrat,system-ui,sans-serif";
  let max = 0;
  for (const p of players || []) max = Math.max(max, ctx.measureText(p?.label || "").width);
  return Math.ceil(max + 16 + 8 + 16);
}
const POS_ORDER = ["POR", "DEF", "CEN", "DEL"];
function groupByPos(players) {
  const buckets = { POR: [], DEF: [], CEN: [], DEL: [] };
  for (const p of players || []) (buckets[(p.pos || "CEN").toUpperCase()] || buckets.CEN).push(p);
  POS_ORDER.forEach(k => buckets[k].sort((a,b) => (a.dorsal ?? 999) - (b.dorsal ?? 999)));
  return buckets;
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
  const [openUserPanel, setOpenUserPanel] = useState(null); // usuario seleccionado para cruce
  const [openPeopleMatchId, setOpenPeopleMatchId] = useState(null); // lista de persoas
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);

  const [resultsConfirmed, setResultsConfirmed] = useState({});
  const [selPlantilla, setSelPlantilla] = useState(new Set());
  const [selOnce, setSelOnce] = useState(new Set());

  const [lastAli, setLastAli] = useState({ id: null, count: 0 });
  const [lastOfi, setLastOfi] = useState({ id: null, count: 0 });
  useEffect(() => { let t; if (lastAli.id) t = setTimeout(() => setLastAli({ id:null, count:0 }), 900); return () => clearTimeout(t); }, [lastAli]);
  useEffect(() => { let t; if (lastOfi.id) t = setTimeout(() => setLastOfi({ id:null, count:0 }), 900); return () => clearTimeout(t); }, [lastOfi]);

  const [openResultsMatchId, setOpenResultsMatchId] = useState(null);
  const [openInfoMatchId, setOpenInfoMatchId] = useState(null);

  const showToast = (msg, ok=true) => { setToast({ msg, ok, t: Date.now() }); setTimeout(()=> setToast(""), 4200); };

  // Confirmación “armada”
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

  async function onOpenEdit(matchId) {
    if (!isAdmin) return;
    setEditingMatchId(cur => (cur === matchId ? null : matchId));
    setSelPlantilla(new Set());
    setSelOnce(new Set());
    await ensurePlayersLoaded();
  }

  async function togglePeoplePanel(matchId) {
    if (!isAdmin) return;
    const opening = openPeopleMatchId !== matchId;
    setOpenPeopleMatchId(opening ? matchId : null);
    if (opening) await loadUsersList();
  }

  // Confirmar (dobre pulsación)
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
      try {
        const ok = window.confirm("¿Seguro que queres gardar esta aliñación?");
        if (!ok) return;
      } catch {}

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

      showToast("Resultados confirmados e gardados.", true);

      // pecha editor e limpa
      setEditingMatchId(null);
      setOpenUserPanel(null);
      setOpenPeopleMatchId(null);
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

  const colMinPx = useMemo(() => !players?.length ? 260 : Math.max(240, measureLongestLabelPx(players)), [players]);
  const view = useMemo(() => rows, [rows]);

  function renderGroupedList(opts) {
    const {
      list, withCheckbox = true, checkedSet = new Set(), onToggle = () => {},
      onlyIds = null, aciertosBaseSet = null, stickyBg = "#fff",
      perDemarcScroll = false, isMobile = false, which = "plantilla"
    } = opts;

    const buckets = groupByPos(list);
    const makeRow = (p) => {
      const isOK = aciertosBaseSet ? aciertosBaseSet.has(p.id) : false;
      const nameStyle = { ...playerNameStyle(), fontWeight: isOK ? 900 : 700, color: isOK ? "#0ea5e9" : "#0f172a" };
      if (withCheckbox) {
        const showInline = (which === "plantilla" ? lastAli.id === p.id : lastOfi.id === p.id);
        const badgeText = which === "plantilla" ? `${lastAli.count}/11` : `${lastOfi.count}/11`;
        const isChecked = checkedSet.has(p.id);
        return (
          <label key={p.id} style={ROW_PLAYER}>
            <input type="checkbox" style={CHECKBOX} checked={isChecked} onChange={()=> onToggle(p.id)} />
            <span style={{ display:"flex", alignItems:"center", minWidth:0 }}>
              <span style={{ ...nameStyle, minWidth:0 }}>{p.label}</span>
              {showInline && <span style={COUNT_INLINE}>{badgeText}</span>}
            </span>
          </label>
        );
      }
      return (
        <div key={p.id} style={ROW_PLAYER_NOCHK}>
          <span style={nameStyle}>{p.label}</span>
        </div>
      );
    };

    const sections = [];
    POS_ORDER.forEach((k) => {
      let group = buckets[k];
      if (onlyIds) { const only = new Set(onlyIds); group = group.filter(p => only.has(p.id)); }
      if (!group.length) return;
      if (perDemarcScroll) {
        sections.push(
          <div key={`group-${k}`} style={{ background:"inherit" }}>
            <div style={POS_TAG_STICKY(stickyBg)}>{k}</div>
            <div style={POS_SEP} />
            <div style={GROUP_SCROLL(isMobile)}>{group.map(makeRow)}</div>
          </div>
        );
      } else {
        sections.push(<div key={`tag-${k}`} style={POS_TAG_STICKY(stickyBg)}>{k}</div>);
        sections.push(<div key={`sep-${k}`} style={POS_SEP} />);
        group.forEach(p => sections.push(makeRow(p)));
      }
    });
    return sections.length ? sections : (
      <div style={{ ...ROW_PLAYER_NOCHK }}>
        <span style={playerNameStyle()}>Sen elementos</span>
      </div>
    );
  }

  function renderResultsViewer(matchId) {
    const rowsC = resultsConfirmed[matchId] || [];
    if (!rowsC.length) return <div style={EMPTY}>Aínda non hai resultados confirmados para este partido.</div>;

    const playersById = new Map(players.map(p => [p.id, p]));
    const renderLineaPresentada = (rec) => {
      const labels = (rec.plantillaIds || []).map(pid => {
        const p = playersById.get(pid); const label = p ? p.label : "—";
        const isOK = (rec.onceIds || []).includes(pid);
        return isOK ? <strong style={{ color:"#0ea5e9" }}>{label}</strong> : <span>{label}</span>;
      });
      const out = []; labels.forEach((node, idx) => { out.push(node); if (idx < labels.length - 1) out.push(<span style={{ opacity:.6 }}> {" | "} </span>); });
      return out;
    };

    return (
      <div style={{ marginTop:8, border:"1px solid #e5e7eb", borderRadius:12, background:"#fff", padding:10 }}>
        <div style={{ font:"700 13.5px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", marginBottom:8 }}>ACERTOS POR USUARIA/O (confirmados)</div>
        <div role="table" style={{ width:"100%", font:"600 12.8px/1.3 Montserrat,system-ui,sans-serif" }}>
          <div role="row" style={{ display:"grid", gridTemplateColumns:"160px 1fr 70px 2fr", gap:10, padding:"6px 8px", borderBottom:"1px solid #e5e7eb", color:"#0f172a", fontWeight:800 }}>
            <div>Data e hora</div><div>HDC Peñista</div><div>Acertos</div><div>Aliñación presentada</div>
          </div>
          {rowsC.map((rec, idx) => (
            <div key={`${rec.userId}-${idx}`} role="row" style={{ display:"grid", gridTemplateColumns:"160px 1fr 70px 2fr", gap:10, padding:"6px 8px", borderBottom:"1px solid #f1f5f9" }}>
              <div>{dmy(rec.whenISO)} {new Date(rec.whenISO).toLocaleTimeString("gl-ES",{hour:"2-digit",minute:"2-digit",hour12:false})}</div>
              <div>{rec.userName}</div>
              <div><strong style={{ color:"#0ea5e9" }}>{rec.acertos}</strong></div>
              <div>{renderLineaPresentada(rec)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const aliIs11 = selPlantilla.size === 11;
  const onceIs11 = selOnce.size === 11;
  const acertosLive = Array.from(selOnce).filter(id => selPlantilla.has(id)).length;

  return (
    <main style={WRAP}>
      <style>{STYLES}</style>

      <h2 style={PAGE_HEAD}>HISTÓRICO DE RESULTADOS</h2>
      <p style={PAGE_SUB}>Índice dos partidos rematados (máis recente → máis antigo).</p>

      {toast?.msg && <div style={toast.ok ? TOAST_OK : TOAST_ERR} aria-live="polite">{toast.msg}</div>}
      {err && <div style={ERR} role="status" aria-live="polite">{err}</div>}
      {!err && loading && <div style={EMPTY} role="status" aria-live="polite">Cargando…</div>}
      {!err && !loading && view.length === 0 && (<div style={EMPTY} role="status" aria-live="polite">Non hai partidos rematados aínda.</div>)}

      {!err && !loading && view.length > 0 && (
        <ul style={LIST} aria-label="Lista de partidos rematados">
          {view.map((r, i) => {
            const isEditing = editingMatchId === r.id;
            const isResultsOpen = openResultsMatchId === r.id;
            const isPeopleOpen = openPeopleMatchId === r.id;

            return (
              <li key={`${r.id ?? r.match_iso ?? "noid"}-${i}`} style={{ ...ITEM, marginBottom: (isEditing || isResultsOpen || isPeopleOpen) ? 12 : 8 }}>
                <span style={DATE}>{dmy(r.match_iso)}</span>
                <span style={TEAMS}>{r.equipo1 || "—"} <span style={SEP}>-</span> {r.equipo2 || "—"}</span>
                <div style={ACTIONS}>
                  {isAdmin && !isMobile && (
                    <>
                      {/* Botón Persona (lista de usuarias/os) */}
                      <button
                        type="button"
                        style={ICONBTN}
                        title={isPeopleOpen ? "Pechar persoas" : "Ver usuarias/os"}
                        aria-label={isPeopleOpen ? "Pechar persoas" : "Ver usuarias/os"}
                        onClick={()=> togglePeoplePanel(r.id)}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}>
                          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Ollo (abre resultados) */}
                  <button
                    type="button"
                    style={ICONBTN}
                    title={isResultsOpen ? "Pechar resultados" : "Ver resultados do partido"}
                    aria-label={isResultsOpen ? "Pechar resultados" : "Ver resultados do partido"}
                    onClick={async ()=>{
                      setOpenResultsMatchId(cur => cur === r.id ? null : r.id);
                      if (openResultsMatchId !== r.id) {
                        await ensurePlayersLoaded();
                        await loadConfirmedForMatch(r.id);
                      }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  </button>

                  {/* NOVO: botón X para pechar a pestaña de resultados (só visible cando está aberta) */}
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

                {/* Panel de persoas (con botón editar por usuario á dereita) */}
                {isPeopleOpen && isAdmin && !isMobile && (
                  <section style={USERS_PANEL} aria-label="Lista de usuarias/os">
                    {users.length === 0 ? (
                      <div style={EMPTY}>Cargando usuarias/os…</div>
                    ) : (
                      <ul style={USERS_LIST}>
                        {users.map(u => (
                          <li key={u.id} style={USER_ROW} title={u.name}>
                            <span style={USER_BADGE}>{u.code || "—"}</span>
                            <div>
                              <div style={USER_NAME}>{u.name}</div>
                              {u.surname && <div style={USER_SUB}>{u.surname}</div>}
                            </div>
                            {/* Icono editar (teclado) á dereita do usuario */}
                            <button
                              type="button"
                              style={ICONBTN}
                              title="Editar cruce para esta persoa"
                              aria-label="Editar cruce para esta persoa"
                              onClick={async ()=>{
                                setOpenUserPanel(u.id);
                                if (editingMatchId !== r.id) await onOpenEdit(r.id);
                                await ensurePlayersLoaded();
                              }}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}>
                                <rect x="3" y="6" width="18" height="12" rx="2" />
                                <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                {/* Visor de resultados confirmados */}
                {isResultsOpen && renderResultsViewer(r.id)}

                {/* Editor/cruce (só desktop admin) */}
                {isEditing && isAdmin && !isMobile && (
                  <section style={EDIT_WRAP}>
                    {players.length === 0 ? (
                      <div style={EMPTY}>Cargando xogadoras/es…</div>
                    ) : (
                      <div style={threeColStyle(colMinPx, false)}>
                        {/* ALIÑACIÓN REALIZADA */}
                        <div style={{ ...COL_BASE, ...COL_BG_ALI, minWidth: `${colMinPx}px` }}>
                          <div style={COL_HEAD}>
                            <span style={COL_TITLE}>ALIÑACIÓN REALIZADA</span>
                            <span style={COUNT}>{selPlantilla.size}/11</span>
                          </div>
                          {renderGroupedList({
                            list: players, withCheckbox: true, checkedSet: selPlantilla,
                            onToggle: (id)=> {
                              const next = new Set(selPlantilla);
                              next.has(id) ? next.delete(id) : next.add(id);
                              setSelPlantilla(next);
                              setLastAli({ id, count: next.size });
                              armClear();
                            },
                            stickyBg: "#e9f9f2", perDemarcScroll: true, which:"plantilla"
                          })}
                        </div>

                        {/* ONCE OFICIAL */}
                        <div style={{ ...COL_BASE, ...COL_BG_OFI, minWidth: `${colMinPx}px` }}>
                          <div style={COL_HEAD}>
                            <span style={aliIs11 ? COL_TITLE_BLINK : COL_TITLE}>ONCE OFICIAL</span>
                            <span style={COUNT}>{selOnce.size}/11</span>
                          </div>
                          {renderGroupedList({
                            list: players, withCheckbox: true, checkedSet: selOnce,
                            onToggle: (id)=> {
                              const next = new Set(selOnce);
                              next.has(id) ? next.delete(id) : next.add(id);
                              setSelOnce(next);
                              setLastOfi({ id, count: next.size });
                              armClear();
                            },
                            stickyBg: "#fff5e7", perDemarcScroll: true, which:"once"
                          })}
                        </div>

                        {/* ACERTOS DO PARTIDO */}
                        <div style={{ ...COL_BASE, ...COL_BG_ACE, minWidth: `${colMinPx}px` }}>
                          <div style={COL_HEAD}>
                            <span style={COL_TITLE}>ACERTOS DO PARTIDO</span>
                            <span style={COUNT_CELESTE_BLINK}>{acertosLive}/11</span>
                          </div>
                          <div style={{ paddingBottom: 10 }}>
                            {renderGroupedList({
                              list: players, withCheckbox: false,
                              onlyIds: selOnce,
                              aciertosBaseSet: new Set(Array.from(selOnce).filter(id => selPlantilla.has(id))),
                              stickyBg: "#ffe9e9", perDemarcScroll: false
                            })}
                          </div>
                          <div style={{ padding:10 }}>
                            <button
                              type="button"
                              style={onceIs11 ? BTN_CONFIRM_BLINK : BTN_CONFIRM}
                              onClick={()=> confirmarMatch(r.id)}
                            >
                              CONFIRMAR
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
