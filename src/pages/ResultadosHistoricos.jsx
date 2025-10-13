// src/pages/ResultadosHistoricos.jsx
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos base ===== */
const WRAP = { maxWidth: 1120, margin: "0 auto", padding: "16px" };
const PAGE_HEAD = { margin: "0 0 6px", font: "700 22px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const PAGE_SUB = { margin: 0, font: "400 14.5px/1.25 Montserrat,system-ui,sans-serif", color: "#475569" };
const PAGE_SUB_WRAP = { display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 8, marginBottom: 12 };

const LIST = { listStyle: "none", margin: 0, padding: 0 };
const itemGrid = (isMobile) =>
  isMobile ? { gridTemplateColumns: "1fr auto" } : { gridTemplateColumns: "140px 1fr auto" };

const ITEM_BASE = {
  display: "grid",
  gap: 8,
  alignItems: "center",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,.05)",
  marginBottom: 8,
};

const DATE = (isMobile) => ({
  font: isMobile ? "700 11.5px/1.1 Montserrat,system-ui,sans-serif" : "600 13px/1.1 Montserrat,system-ui,sans-serif",
  color: "#0f172a",
  whiteSpace: "nowrap",
});

const TEAMS = (isMobile) => ({
  font: isMobile ? "800 13px/1.08 Montserrat,system-ui,sans-serif" : "800 14px/1.1 Montserrat,system-ui,sans-serif",
  textTransform: "uppercase",
  color: "#111827",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  transform: isMobile ? "scaleX(1.02) scaleY(1.06)" : "none",
  transformOrigin: "left center",
  letterSpacing: isMobile ? "0.14px" : "0.2px",
});

const SEP = { margin: "0 6px", fontWeight: 800, color: "#0f172a" };
const COMPACT_TEXT = { display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" };

const ACTIONS = { display: "flex", gap: 6, alignItems: "center", justifySelf: "end" };
const ICONBTN = {
  width: 34,
  height: 34,
  display: "grid",
  placeItems: "center",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
  cursor: "pointer",
};
const SVGI = { fill: "none", stroke: "#0f172a", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };

/* Ollo escritorio */
const EYE_BTN_DESKTOP = (active) =>
  active
    ? { ...ICONBTN, width: 30, height: 30, border: "1px solid #0ea5e9", background: "linear-gradient(180deg,#38bdf8,#0ea5e9)" }
    : { ...ICONBTN, width: 30, height: 30 };
const EYE_SVG = (active) => (active ? { ...SVGI, stroke: "#fff" } : SVGI);

/* Ollo móbil (para fila de resultados) — máis pequeno agora */
const EYE_BTN_MOBILE_SMALL = {
  ...ICONBTN,
  width: 28,
  height: 28,
  border: "1px solid #0ea5e9",
  background: "#fff",
};
const EYE_SVG_BLUE = { ...SVGI, stroke: "#0ea5e9" };

/* Ollo móbil nas etiquetas de partido (segue algo maior) */
const EYE_BTN_MOBILE = {
  ...ICONBTN,
  width: 36,
  height: 36,
  border: "1px solid #0ea5e9",
  background: "#fff",
};

const CONF_COUNT = { font: "800 12.5px/1 Montserrat,system-ui,sans-serif", color: "#16a34a", minWidth: 18, textAlign: "right" };

/* Botóns X (peches) */
const XBTN = { ...ICONBTN, width: 30, height: 30, border: "1px solid #ef4444", background: "#fff" };
const XBTN_SMALL = { ...ICONBTN, width: 26, height: 26, border: "1px solid #ef4444", background: "#fff" };
const XSVG = { fill: "none", stroke: "#ef4444", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

/* Toasts */
const TOAST_OK = { margin: "8px 0 12px", padding: "10px 12px", borderRadius: 10, background: "#ecfeff", border: "1px solid #67e8f9", color: "#0e7490", font: "600 12.5px/1.2 Montserrat,system-ui,sans-serif" };
const TOAST_ERR = { ...TOAST_OK, background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c" };

/* Panel Persoas — escritorio */
const PEOPLE_SHELL = (twoCols) =>
  twoCols
    ? {
        marginTop: 8,
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        background: "#fff",
        padding: 12,
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 16,
        alignItems: "start",
      }
    : { marginTop: 8, border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", padding: "10px 12px" };

const USERS_LIST = { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 };
const USER_ROW_BASE = { display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 6, alignItems: "center", padding: "6px 8px", borderRadius: 8, border: "1px solid #eef2f7", background: "f9fafb" };
const USER_ROW_BLINK = { ...USER_ROW_BASE, animation: "userBlink 1.5s ease-in-out infinite", background: "linear-gradient(180deg,#e6f4ff,#f2f8ff)" };
const USER_ROW_CONFIRMED = { ...USER_ROW_BASE, background: "linear-gradient(180deg,#eafff3,#f7fff9)", border: "1px solid #22c55e" };
const USER_BADGE = { font: "900 11px/1 Montserrat,system-ui,sans-serif", color: "#0ea5e9", background: "#e0f2fe", padding: "4px 7px", borderRadius: 8, minWidth: 38, textAlign: "center" };
const USER_NAME = { font: "800 13px/1.05 Montserrat,system-ui,sans-serif", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const USER_SUB = { font: "600 11.5px/1.05 Montserrat,system-ui,sans-serif", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

const RIGHT_PAD = { paddingLeft: 16 };

/* Edición — escritorio */
const EDIT_GRID = { display: "grid", gridTemplateColumns: "minmax(252px,1fr) minmax(252px,1fr)", gap: 8, alignItems: "start" };

const COL_BASE = { border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", position: "relative" };
const COL_BG_ALI = { background: "linear-gradient(180deg,#f0fff6,#e9f9f2)" };
const COL_BG_OFI = { background: "linear-gradient(180deg,#fff9ee,#fff5e7)" };
const COL_HEAD = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 6px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" };
const COL_TITLE = { font: "900 10.9px/1.02 Montserrat,system-ui,sans-serif", color: "#0f172a", letterSpacing: 0.2, textTransform: "uppercase" };
const COL_TITLE_BLINK = { ...COL_TITLE, animation: "blinkSoft 1.5s ease-in-out infinite" };
const COUNT = { font: "900 10.5px/1.02 Montserrat,system-ui,sans-serif", color: "#22c55e" };

/* Demarcacións */
const GROUP_SCROLL = { maxHeight: 260, overflowY: "auto", background: "inherit" };
const GROUP_WRAP = (bg) => ({ position: "relative", background: "inherit", paddingRight: 20, marginBottom: 3 });
const POS_SIDE = (bg) => ({ position: "absolute", right: 2, top: 2, bottom: 2, writingMode: "vertical-rl", textOrientation: "mixed", font: "900 9.8px/1 Montserrat,system-ui,sans-serif", color: "#64748b", opacity: 0.85, display: "grid", placeItems: "center", background: "transparent", padding: "2px 0" });
const POS_SEP = { height: 1, background: "#e5e7eb" };
const ROW_PLAYER = { display: "grid", gridTemplateColumns: "16px 1fr auto", gap: 8, alignItems: "center", padding: "0 2px", minWidth: 0 };
const CHECKBOX = { width: 14, height: 14, transform: "scale(1.02)", marginRight: 10 };
const playerNameStyle = { font: "700 10.2px/.72 Montserrat,system-ui,sans-serif", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const COUNT_MINI = { font: "900 10px/1 Montserrat,system-ui,sans-serif", color: "#0ea5e9", padding: "0 4px", borderRadius: 6, background: "#e0f2fe" };

/* Preview escritorio */
const SUMMARY = { border: "1px solid #fecaca", borderRadius: 12, background: "linear-gradient(180deg,#fff6f6,#ffeaea)", padding: 8, position: "relative", width: "100%", marginTop: 8 };
const SUMMARY_TITLE_WRAP = { padding: "2px 6px 6px 6px", background: "linear-gradient(180deg,#fff,#fff6f6)", borderTopLeftRadius: 10, borderTopRightRadius: 10 };
const SUMMARY_TITLE = { font: "800 11px/1.02 Montserrat,system-ui,sans-serif", color: "#0f172a", textDecoration: "none", margin: "2px 0 4px 0" };
const HR = { height: 1, background: "#e5e7eb", width: "100%" };
const GRID_DEF = "auto 1fr auto 3fr";
const T_HEADER = { display: "grid", gridTemplateColumns: GRID_DEF, gap: 0, padding: "4px 0", borderBottom: "1px solid #e5e7eb", color: "#0f172a", font: "800 11px/1.02 Montserrat,system-ui,sans-serif", alignItems: "center" };
const T_ROW = { display: "grid", gridTemplateColumns: GRID_DEF, gap: 0, padding: "3px 0", borderBottom: "1px solid #f1f5f9", font: "600 10.2px/.96 Montserrat,system-ui,sans-serif", alignItems: "center" };
const CELL = { padding: "0 6px", borderRight: "1px solid #e5e7eb", display: "flex", alignItems: "center" };
const CELL_LAST = { padding: "0 6px", display: "flex", alignItems: "center" };
const ACERTOS_CELL = { justifyContent: "center", minWidth: 60 };
const CELSTE = { color: "#0ea5e9", fontWeight: 800 };
const BTN_CONFIRM = { marginTop: 8, width: "100%", borderRadius: 10, padding: "8px 10px", font: "900 12px/1.02 Montserrat,system-ui,sans-serif", background: "linear-gradient(180deg,#38bdf8,#0ea5e9)", color: "#fff", border: "1px solid #0ea5e9", boxShadow: "0 3px 10px rgba(14,165,233,.18)", cursor: "pointer" };
const BTN_CONFIRM_BLINK = { ...BTN_CONFIRM, animation: "pulseSoft 1.5s ease-in-out infinite" };

/* Resultados — escritorio */
const FULL_TITLE_BAR_DESKTOP = {
  marginTop: 6,
  marginBottom: 8,
  padding: "9px 10px",
  border: "1px solid #7dd3fc",
  background: "linear-gradient(180deg,#5dd3ff,#2ab6f0)",
  borderRadius: 10,
  color: "#fff",
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: 8,
};
const FULL_TITLE = { font: "900 15px/1.15 Montserrat,system-ui,sans-serif", color: "#fff" };
const FULL_TABLE = { width: "100%", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#fff" };
const FULL_HEAD_DESKTOP = {
  display: "grid",
  gridTemplateColumns: "auto 1fr auto 3fr",
  padding: "10px 6px",
  borderBottom: "1px solid #e5e7eb",
  font: "800 13.5px/1.2 Montserrat,system-ui,sans-serif",
  background: "linear-gradient(180deg,#dcfce7,#bbf7d0)",
  color: "#064e3b",
  alignItems: "center",
};
const FULL_ROW_DESKTOP = { display: "grid", gridTemplateColumns: "auto 1fr auto 3fr", padding: "8px 6px", borderBottom: "1px solid #f1f5f9", font: "600 12.6px/1.05 Montserrat,system-ui,sans-serif", alignItems: "center" };
const FULL_CELL = { padding: "0 6px", borderRight: "1px solid #e5e7eb", display: "flex", alignItems: "center" };
const FULL_LAST = { padding: "0 6px", display: "flex", alignItems: "center", wordBreak: "break-word" };
const FULL_ACERTOS = { textAlign: "center", color: "#0ea5e9", fontWeight: 900, minWidth: 76, justifyContent: "center" };

/* ====== Resultados — móbil (AQUÍ VAN OS CAMBIOS) ====== */
const FULL_TITLE_BAR_MOBILE = {
  marginTop: 6,
  marginBottom: 8,
  padding: "9px 10px",
  border: "1px solid #7dd3fc",
  background: "linear-gradient(180deg,#5dd3ff,#2ab6f0)",
  borderRadius: 10,
  color: "#fff",
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: 8,
};
const FULL_TITLE_MOBILE = { font: "600 14.5px/1.15 Montserrat,system-ui,sans-serif", color: "#fff" };

/* Cabeceira máis pequena */
const FULL_HEAD_MOBILE = {
  display: "grid",
  gridTemplateColumns: "1fr max-content max-content",
  padding: "6px 6px",
  borderBottom: "1px solid #e5e7eb",
  background: "linear-gradient(180deg,#dcfce7,#bbf7d0)",
  color: "#064e3b",
  alignItems: "center",
  font: "700 11.2px/1.05 Montserrat,system-ui,sans-serif",
  textTransform: "none"
};

/* Filas con contido un pouco máis grande */
const FULL_ROW_MOBILE = {
  display: "grid",
  gridTemplateColumns: "1fr max-content max-content",
  padding: "9px 6px",
  borderBottom: "1px solid #eef2f7",
  font: "600 13.4px/1.15 Montserrat,system-ui,sans-serif",
  alignItems: "center"
};

/* Sen liñas verticais agora */
const FULL_CELL_SPLIT = { padding: "0 6px", display: "flex", alignItems: "center" };
const FULL_CELL_SPLIT_CENTER = { ...FULL_CELL_SPLIT, justifyContent: "center" };
const FULL_CELL_LAST_CENTER = { padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "center" };

/* Valor de acertos centrado */
const FULL_ACERTOS_VAL = { textAlign: "center", color: "#0ea5e9", fontWeight: 900, width: "100%", justifyContent: "center", display: "flex" };

/* Editor inline — escritorio */
const EDIT_OVERLAY = { position: "fixed", inset: "auto auto 24px 50%", transform: "translateX(-50%)", zIndex: 60, background: "rgba(255,255,255,.98)", border: "1px solid #cbd5e1", borderRadius: 12, boxShadow: "0 12px 28px rgba(0,0,0,.22)", padding: 12, minWidth: 280 };
const DT_INPUT = { border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 8px", font: "600 12px/1 Montserrat,system-ui,sans-serif", width: "100%" };
const SAVE_BTN = { ...ICONBTN, width: 28, height: 28, position: "absolute", top: 8, right: 8, border: "1px solid #22c55e", background: "#fff" };
const SAVE_SVG = { fill: "none", stroke: "#16a34a", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

/* Móbil: info admins + popup + date bubble */
const INFO_BTN = { ...ICONBTN, width: 30, height: 30, border: "1px solid #0ea5e9", placeItems: "center", background: "#fff" }; // AZUL
const INFO_SVG = { ...SVGI, stroke: "#0ea5e9", strokeWidth: 2.1 };

const MOBILE_ALIGN_POP = {
  position: "fixed",
  inset: "10% 5% auto 5%",
  zIndex: 120,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  boxShadow: "0 24px 64px rgba(0,0,0,.45)",
  padding: 16,
  maxHeight: "74vh",
  overflowY: "auto",
  maxWidth: 560,
  margin: "0 auto"
};

const LOCAL_DATE_BUBBLE = {
  position: "absolute",
  top: 36,
  left: 0,
  zIndex: 200,
  background: "rgba(15,23,42,.94)",
  color: "#fff",
  font: "800 11px/1.1 Montserrat,system-ui,sans-serif",
  padding: "6px 8px",
  borderRadius: 8,
  pointerEvents: "none"
};

/* Animacións */
const STYLES = `
@keyframes blinkSoft{0%{opacity:1}50%{opacity:.7}100%{opacity:1}}
@keyframes pulseSoft{0%{transform:scale(1)}50%{transform:scale(1.02)}100%{transform:scale(1)}}
@keyframes userBlink{0%{box-shadow:0 0 0 rgba(14,165,233,0)}50%{box-shadow:0 10px 26px rgba(14,165,233,.45)}100%{box-shadow:0 0 0 rgba(14,165,233,0)}}
`;

/* ===== Utils ===== */
const pad2 = (n) => String(n ?? "").padStart(2, "0");
const sortDescByDate = (a, b) => (b.match_iso ? new Date(b.match_iso).getTime() : -Infinity) - (a.match_iso ? new Date(a.match_iso).getTime() : -Infinity);
const dmyShort = (iso) => { if (!iso) return "—"; const d = new Date(iso); return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${String(d.getFullYear()).slice(-2)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const dmyFull = (iso) => { if (!iso) return "—"; const d = new Date(iso); return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`; };
const dmyFullTime = (iso) => { if (!iso) return "—"; const d = new Date(iso); return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const toLocalInput = (iso) => { if (!iso) return ""; const d = new Date(iso); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const fromLocalInput = (localStr) => { if (!localStr) return null; const ms = Date.parse(localStr); return isNaN(ms) ? null : new Date(ms).toISOString(); };

function inferPosFromFoto(url = "") { const m = url.match(/-(POR|DEF|CEN|DEL)\.(?:jpg|jpeg|png|webp)$/i); return m ? m[1].toUpperCase() : "CEN"; }
function normalizePlayer(p) {
  let nombre = p.nombre || "";
  let pos = p.pos || null;
  const nlow = nombre.trim().toLowerCase();
  if (nlow === "joel lago") { nombre = "Yoel Lago"; pos = "DEF"; }
  if (nlow.includes("jones") && nlow.includes("el-abdellaoui")) { pos = "DEL"; }
  return { ...p, nombre, pos };
}
const POS_ORDER = ["POR", "DEF", "CEN", "DEL"];
function groupByPos(players) { const b = { POR: [], DEF: [], CEN: [], DEL: [] }; for (const p of players || []) (b[(p.pos || "CEN").toUpperCase()] || b.CEN).push(p); POS_ORDER.forEach(k => b[k].sort((a, b) => (a.dorsal ?? 999) - (b.dorsal ?? 999))); return b; }

/* Sonidos */
function bip(opacity = 0.22, freq = 880, dur = 0.11) {
  try { const AC = window.AudioContext || window.webkitAudioContext; const ctx = new AC(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = "sine"; o.frequency.value = freq; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(opacity, ctx.currentTime + 0.01); o.start(); o.stop(ctx.currentTime + dur); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur); } catch {}
}
function bipConfirm() { bip(0.18, 820, 0.08); setTimeout(() => bip(0.14, 700, 0.28), 130); }

/* ===== Compo ===== */
export default function ResultadosHistoricos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  useEffect(() => { const onR = () => setIsMobile(window.innerWidth <= 560); window.addEventListener("resize", onR); return () => window.removeEventListener("resize", onR); }, []);

  const [openPeopleMatchId, setOpenPeopleMatchId] = useState(null);
  const [openResultsMatchId, setOpenResultsMatchId] = useState(null);
  const [openUserPanel, setOpenUserPanel] = useState(null);

  const [users, setUsers] = useState([]);
  const [userNames, setUserNames] = useState(new Map());
  const [players, setPlayers] = useState([]);

  const [selPlantilla, setSelPlantilla] = useState(new Set());
  const [selOnce, setSelOnce] = useState(new Set());

  const [flash, setFlash] = useState({ id: null, count: 0, t: 0 });
  const flashTimerRef = useRef(null);
  const showFlash = (id, count) => { clearTimeout(flashTimerRef.current); setFlash({ id, count, t: Date.now() }); flashTimerRef.current = setTimeout(() => setFlash({ id: null, count: 0, t: 0 }), 900); };

  const [editOverlay, setEditOverlay] = useState(null);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [mobileAlignFor, setMobileAlignFor] = useState(null);
  const [dateBubbleFor, setDateBubbleFor] = useState(null);

  const [resultsConfirmed, setResultsConfirmed] = useState({});
  const [hasResults, setHasResults] = useState(new Set());
  const [confirmedByMatch, setConfirmedByMatch] = useState({});

  const [confirmSaving, setConfirmSaving] = useState(false);

  const showToast = (msg, ok = true, ms = 1500) => { setToast({ msg, ok, t: Date.now() }); setTimeout(() => setToast(""), ms); };

  async function resolveAdmin() {
    const { data: s } = await supabase.auth.getSession();
    const email = s?.session?.user?.email?.toLowerCase() || "";
    const uid = s?.session?.user?.id || null;
    let admin = email === "hdcliga@gmail.com" || email === "hdcliga2@gmail.com";
    if (!admin && uid) {
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
      if ((prof?.role || "").toLowerCase() === "admin") admin = true;
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
        const norm = (data || []).map(r => ({ id: r.id ?? null, equipo1: (r.equipo1 || "").toUpperCase(), equipo2: (r.equipo2 || "").toUpperCase(), match_iso: r.match_iso || null })).sort(sortDescByDate);
        if (alive) setRows(norm);

        if ((data || []).length) {
          const ids = (data || []).map(r => r.id).filter(Boolean);
          const { data: rc } = await supabase.from("resultados_confirmados").select("match_id,user_id").in("match_id", ids);
          const map = {};
          (rc || []).forEach(r => { if (!map[r.match_id]) map[r.match_id] = new Set(); map[r.match_id].add(r.user_id); });
          if (alive) setConfirmedByMatch(map);
          const sset = new Set((rc || []).map(x => x.match_id)); if (alive) setHasResults(sset);
        }
      } catch (e) { console.error("Historico load:", e); if (alive) setErr("Produciuse un erro ao cargar o histórico."); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; clearTimeout(flashTimerRef.current); };
  }, []);

  async function ensurePlayersLoaded() {
    if (players.length) return;
    try {
      const { data: playersData, error: playersErr } = await supabase.from("jugadores").select("id, nombre, dorsal, foto_url");
      if (playersErr) throw playersErr;
      setPlayers((playersData || []).map(pp => {
        const p = normalizePlayer(pp);
        const pos = p.pos || inferPosFromFoto(p.foto_url || "");
        const nameOnly = p.nombre || "";
        const label = p.dorsal ? `${p.dorsal} - ${nameOnly}` : nameOnly;
        return { id: p.id, dorsal: p.dorsal ?? null, pos, name: nameOnly, label };
      }));
    } catch (e) { console.error("Load players error:", e); setPlayers([]); }
  }

  async function ensureUserNames(ids) {
    const missing = ids.filter(id => !userNames.has(id)); if (!missing.length) return;
    try {
      const { data, error } = await supabase.from("profiles").select("id, first_name, last_name, full_name, email").in("id", missing);
      if (error) throw error;
      const m = new Map(userNames);
      (data || []).forEach(u => {
        const code = (u.first_name || "").trim();
        const surname = (u.last_name || "").trim();
        const full = (u.full_name || "").trim();
        const email = (u.email || "").trim();
        const display = full || `${code} ${surname}`.trim() || email || u.id;
        m.set(u.id, display);
      });
      setUserNames(m);
    } catch (e) { console.error("ensureUserNames:", e); }
  }

  async function loadUsersList() {
    try {
      const { data, error } = await supabase.from("profiles").select("id, first_name, last_name, full_name, email").order("first_name", { ascending: true, nullsFirst: true });
      if (error) throw error;
      const arr = (data || [])
        .map(u => {
          const code = (u.first_name || "").trim();
          const surname = (u.last_name || "").trim();
          const email = (u.email || "").trim();
          const full = (u.full_name || "").trim();
          const display = full || `${code} ${surname}`.trim() || email || u.id;
          const allEmpty = !full && !code && !surname && !email;
          return allEmpty ? null : { id: u.id, code, surname, name: display };
        })
        .filter(Boolean)
        .sort((a, b) => {
          const na = /^\d{2}$/.test(a.code || "") ? 0 : 1;
          const nb = /^\d{2}$/.test(b.code || "") ? 0 : 1;
          if (na !== nb) return na - nb;
          return (a.code || "").localeCompare(b.code || "");
        });
      setUsers(arr);
      const m = new Map(userNames); arr.forEach(u => m.set(u.id, u.name)); setUserNames(m);
    } catch (e) { console.error("load users error:", e); showToast("Erro cargando usuarias/os.", false); }
  }

  async function loadConfirmedForMatch(matchId) {
    try {
      const { data, error } = await supabase.from("resultados_confirmados").select("match_id,user_id,confirmed_at,acertos,plantilla_ids,once_ids").eq("match_id", matchId).order("confirmed_at", { ascending: false });
      if (error) throw error;
      setResultsConfirmed(prev => ({ ...prev, [matchId]: data || [] }));
      setHasResults(prev => new Set([...prev, matchId]));
      const setU = new Set((data || []).map(r => r.user_id));
      setConfirmedByMatch(prev => ({ ...prev, [matchId]: setU }));
      await ensureUserNames(Array.from(setU));
    } catch (e) { console.error("loadConfirmedForMatch error:", e); showToast("Erro cargando resultados confirmados.", false); }
  }

  async function onClickPeople(matchId) {
    if (!isAdmin) return;
    const opening = openPeopleMatchId !== matchId;
    setOpenResultsMatchId(null);
    setOpenPeopleMatchId(opening ? matchId : null);
    setOpenUserPanel(null);
    if (opening) { await loadUsersList(); await ensurePlayersLoaded(); await loadConfirmedForMatch(matchId); }
  }

  async function onOpenUserEditor(userId) { if (!isAdmin) return; bip(0.22, 880, 0.11); setOpenUserPanel(userId); setSelPlantilla(new Set()); setSelOnce(new Set()); await ensurePlayersLoaded(); }
  function toggleSelect(id, checkedSet, setSet) { const nx = new Set(checkedSet); if (nx.has(id)) nx.delete(id); else nx.add(id); setSet(nx); showFlash(id, nx.size); }

  async function confirmarMatch(matchId) {
    if (confirmSaving) return;
    setConfirmSaving(true);
    try {
      if (!matchId) return showToast("Falta o identificador do partido.", false);
      if (!openUserPanel) return showToast("Selecciona unha usuaria/o primeiro (teclado).", false);
      if (selPlantilla.size !== 11) return showToast("Aliñación realizada debe ter 11.", false);
      if (selOnce.size !== 11) return showToast("Once oficial debe ter 11.", false);

      bipConfirm();

      const plantillaSet = new Set(selPlantilla);
      const onceSet = new Set(selOnce);
      let acertos = 0; onceSet.forEach(id => { if (plantillaSet.has(id)) acertos++; });

      const nowISO = new Date().toISOString();
      const payload = [{ match_id: matchId, user_id: openUserPanel, confirmed_at: nowISO, acertos, plantilla_ids: Array.from(plantillaSet), once_ids: Array.from(onceSet), updated_at: nowISO }];

      const { error: upErr } = await supabase.from("resultados_confirmados").upsert(payload, { onConflict: "match_id,user_id", ignoreDuplicates: false });
      if (upErr) return showToast(`Erro gardando: ${upErr.message || upErr.code}`, false);

      setOpenUserPanel(null);
      setSelPlantilla(new Set());
      setSelOnce(new Set());

      await loadConfirmedForMatch(matchId);
      showToast("Resultado gardado.", true, 1500);
    } catch (e) { console.error("confirmarMatch error:", e); showToast("Erro inesperado ao confirmar.", false); }
    finally { setConfirmSaving(false); }
  }

  async function saveEditedTs(matchId, userId, valueLocal) {
    const iso = fromLocalInput(valueLocal); if (!iso) return showToast("Data/hora non válida.", false);
    try {
      const { error } = await supabase.from("resultados_confirmados").update({ confirmed_at: iso, updated_at: iso }).eq("match_id", matchId).eq("user_id", userId);
      if (error) throw error;
      setEditOverlay(null);
      await loadConfirmedForMatch(matchId);
      showToast("Data/hora actualizada.");
    } catch (e) { console.error("saveEditedTs:", e); showToast("Erro actualizando data/hora.", false); }
  }

  const view = useMemo(() => rows, [rows]);
  const aliIs11 = selPlantilla.size === 11;
  const onceIs11 = selOnce.size === 11;

  const fmtPlayer = (p) => `${pad2(p.dorsal ?? "")} · ${p.name || (p.label?.split(" - ").slice(-1)[0] || "")}`;

  function renderPlayersColumn(list, checkedSet, setSet, bg) {
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
          const bgcol = (bg && bg.background) || "#fff";
          return (
            <div key={k} style={GROUP_WRAP(bgcol)}>
              <div style={POS_SEP} />
              <div style={GROUP_SCROLL}>
                {group.map((p) => {
                  const isChecked = checkedSet.has(p.id);
                  return (
                    <label key={p.id} style={ROW_PLAYER} title={fmtPlayer(p)}>
                      <input type="checkbox" style={CHECKBOX} checked={isChecked} onChange={() => toggleSelect(p.id, checkedSet, setSet)} />
                      <span style={playerNameStyle}>{fmtPlayer(p)}</span>
                      {flash.id === p.id && <span style={COUNT_MINI}>{flash.count}/11</span>}
                    </label>
                  );
                })}
              </div>
              <div aria-hidden="true" style={POS_SIDE(bgcol)}>{k}</div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderSummaryRight(matchId) {
    const userLabel = (new Map(users.map((u) => [u.id, u]))).get(openUserPanel)?.name || "—";
    const playersById = new Map(players.map((p) => [p.id, p]));
    const onceSet = new Set(selOnce);
    const acertosLive = Array.from(selOnce).filter((id) => selPlantilla.has(id)).length;

    const aliNodes = Array.from(selPlantilla).map((pid, idx, arr) => {
      const p = playersById.get(pid);
      const txt = p ? `${pad2(p?.dorsal ?? "")} · ${p?.name ?? ""}` : String(pid);
      const node = onceSet.has(pid) ? <strong style={{ color: "#0ea5e9" }}>{txt}</strong> : txt;
      return (
        <span key={`${pid}-${idx}`}>
          {node}
          {idx < arr.length - 1 && <span style={{ opacity: 0.6 }}>|</span>}
        </span>
      );
    });

    return (
      <div style={{ border: "1px solid #fecaca", borderRadius: 12, background: "linear-gradient(180deg,#fff6f6,#ffeaea)", padding: 8, position: "relative", width: "100%", marginTop: 8 }}>
        <div style={SUMMARY_TITLE_WRAP}>
          <div style={SUMMARY_TITLE}>RESULTADOS OBTIDOS</div>
          <div style={HR} />
        </div>
        <div role="table" style={{ width: "100%" }}>
          <div role="row" style={T_HEADER}>
            <div style={{ ...CELL, minWidth: 120 }}>Data e hora</div>
            <div style={CELL}>HDC Membro</div>
            <div style={{ ...CELL, ...ACERTOS_CELL }}>Acertos</div>
            <div style={CELL_LAST}>Aliñación presentada</div>
          </div>
          <div role="row" style={T_ROW}>
            <div style={{ ...CELL, minWidth: 120 }}>{dmyShort(new Date().toISOString())}</div>
            <div style={CELL}>{userLabel}</div>
            <div style={{ ...CELL, ...ACERTOS_CELL }}>
              <span style={CELSTE}>{acertosLive}</span>
            </div>
            <div style={CELL_LAST}>{aliNodes}</div>
          </div>
        </div>
        <button type="button" style={onceIs11 ? BTN_CONFIRM_BLINK : BTN_CONFIRM} onClick={() => confirmarMatch(matchId)} disabled={!onceIs11 || confirmSaving}>
          CONFIRMAR
        </button>
      </div>
    );
  }

  function FullResults({ match }) {
    const recs = resultsConfirmed[match.id] || [];
    const pMap = new Map(players.map((p) => [p.id, p]));

    if (!isMobile) {
      /* ===== ESCRITORIO ===== */
      return (
        <section aria-label="Resultados do partido" style={{ marginTop: 6 }}>
          <div style={FULL_TITLE_BAR_DESKTOP}>
            <div style={FULL_TITLE}>
              LISTADO DOS RESULTADOS DO PARTIDO | <span style={{ fontWeight: 900 }}>{match.equipo1} - {match.equipo2}</span> do {dmyFull(match.match_iso)}
            </div>
            <button type="button" style={{ ...XBTN_SMALL }} aria-label="Pechar" title="Pechar" onClick={() => setOpenResultsMatchId(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" style={XSVG}><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <div style={FULL_TABLE}>
            <div style={FULL_HEAD_DESKTOP}>
              <div style={{ ...FULL_CELL, minWidth: 140 }}>Data e hora</div>
              <div style={FULL_CELL}>HDC Membro</div>
              <div style={{ ...FULL_CELL, ...FULL_ACERTOS }}>Acertos</div>
              <div style={FULL_LAST}>Aliñación presentada</div>
            </div>

            {recs.length === 0 ? (
              <div style={{ padding: 10, font: "600 13px/1.2 Montserrat,system-ui,sans-serif", color: "#64748b" }}>Sen confirmacións aínda para este partido.</div>
            ) : (
              recs.map((rec) => {
                const uname = userNames.get(rec.user_id) || rec.user_id;
                const onceSet = new Set(rec.once_ids || []);
                const ali = (rec.plantilla_ids || []).map((pid, idx, arr) => {
                  const p = pMap.get(pid);
                  const label = p ? `${pad2(p.dorsal ?? "")} · ${p.name}` : "—";
                  const mark = onceSet.has(pid) ? <strong style={{ color: "#0ea5e9" }}>{label}</strong> : label;
                  return <span key={`${pid}-${idx}`}>{mark}{idx < arr.length - 1 && <span style={{ opacity: .6 }}>|</span>}</span>;
                });

                return (
                  <div key={`${rec.user_id}`} style={FULL_ROW_DESKTOP}>
                    <div style={{ ...FULL_CELL, minWidth: 140 }}>
                      <button type="button" style={{ ...ICONBTN, width: 28, height: 28, marginRight: 6 }} title="Editar data/hora" aria-label="Editar data/hora" onClick={() => setEditOverlay({ matchId: rec.match_id, userId: rec.user_id, valueLocal: toLocalInput(rec.confirmed_at) })}>
                        <svg width="16" height="16" viewBox="0 0 24 24" style={SVGI}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </button>
                      <span>{dmyShort(rec.confirmed_at)}</span>
                    </div>
                    <div style={FULL_CELL}>{uname}</div>
                    <div style={{ ...FULL_CELL, ...FULL_ACERTOS }}>{rec.acertos}</div>
                    <div style={FULL_LAST}>{ali}</div>
                  </div>
                );
              })
            )}
          </div>

          {editOverlay && (
            <div role="dialog" aria-modal="true" style={EDIT_OVERLAY}>
              <button type="button" style={XBTN_SMALL} aria-label="Pechar" title="Pechar" onClick={() => setEditOverlay(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" style={XSVG}><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
              <input type="datetime-local" style={{ ...DT_INPUT, marginTop: 10 }} value={editOverlay.valueLocal || ""} onInput={(e) => setEditOverlay((s) => ({ ...s, valueLocal: e.currentTarget.value }))} />
              <button type="button" style={SAVE_BTN} title="Gardar" aria-label="Gardar" onClick={() => saveEditedTs(editOverlay.matchId, editOverlay.userId, editOverlay.valueLocal)}>
                <svg width="14" height="14" viewBox="0 0 24 24" style={SAVE_SVG}><path d="M4 4h12l4 4v12H4z" /><path d="M16 4v6H8V4" /><path d="M8 18h8" /></svg>
              </button>
            </div>
          )}
        </section>
      );
    }

    /* ====== MÓBIL ====== */
    return (
      <section aria-label="Resultados do partido" style={{ marginTop: 6 }}>
        <div style={FULL_TITLE_BAR_MOBILE}>
          <div style={{ ...FULL_TITLE_MOBILE, display: "grid", gap: 2 }}>
            <div>LISTADO DAS ALIÑACIÓNS FEITAS POR CADA XOGADOR</div>
            <div><span style={{ fontWeight: 900 }}>{match.equipo1}</span> - <span style={{ fontWeight: 900 }}>{match.equipo2}</span></div>
            <div>{dmyFull(match.match_iso)}</div>
          </div>
          <button
            type="button"
            style={{ ...ICONBTN, width: 32, height: 32, border: "1px solid #fff", background: "linear-gradient(180deg,#fca5a5,#ef4444)" }}
            aria-label="Pechar" title="Pechar" onClick={() => setOpenResultsMatchId(null)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={FULL_TABLE}>
          <div style={FULL_HEAD_MOBILE}>
            <div style={{ ...FULL_CELL_SPLIT, fontWeight: 800 }}>HDC Membro</div>
            <div style={{ ...FULL_CELL_SPLIT_CENTER, fontWeight: 800 }}>Acertos</div>
            <div style={{ ...FULL_CELL_LAST_CENTER, fontWeight: 800 }}>Detalle</div>
          </div>

          {recs.length === 0 ? (
            <div style={{ padding: 10, font: "600 13px/1.2 Montserrat,system-ui,sans-serif", color: "#64748b" }}>Sen confirmacións aínda para este partido.</div>
          ) : (
            recs.map((rec) => {
              const uname = userNames.get(rec.user_id) || rec.user_id;
              const onceSet = new Set(rec.once_ids || []);

              // Grupos POR/DEF/CEN/DEL para popup
              const groups = { POR: [], DEF: [], CEN: [], DEL: [] };
              (rec.plantilla_ids || []).forEach((pid) => {
                const p = pMap.get(pid);
                const label = p ? `${pad2(p.dorsal ?? "")} · ${p.name}` : "—";
                const node = onceSet.has(pid)
                  ? <strong key={`g-${pid}`} style={{ color: "#0ea5e9" }}>{label}</strong>
                  : <span key={`g-${pid}`}>{label}</span>;
                const pos = (p?.pos || "CEN").toUpperCase();
                (groups[pos] || groups.CEN).push(node);
              });

              return (
                <div key={`${rec.user_id}`} style={FULL_ROW_MOBILE}>
                  <div style={{ ...FULL_CELL_SPLIT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {uname}
                  </div>
                  <div style={FULL_CELL_SPLIT_CENTER}>
                    <span style={FULL_ACERTOS_VAL}>{rec.acertos}</span>
                  </div>
                  <div style={FULL_CELL_LAST_CENTER}>
                    <button
                      type="button"
                      style={EYE_BTN_MOBILE_SMALL}
                      title="Ver detalle"
                      aria-label="Ver detalle"
                      onClick={() =>
                        setMobileAlignFor({
                          matchId: rec.match_id,
                          userId: rec.user_id,
                          dateStr: dmyShort(rec.confirmed_at),
                          groups
                        })
                      }
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" style={EYE_SVG_BLUE}>
                        <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {mobileAlignFor && (
          <div role="dialog" aria-modal="true" style={MOBILE_ALIGN_POP}>
            <button
              type="button"
              style={{ ...XBTN_SMALL, position: "absolute", top: 8, right: 8, background: "linear-gradient(180deg,#fca5a5,#ef4444)", border: "1px solid #fff" }}
              aria-label="Pechar" title="Pechar" onClick={() => setMobileAlignFor(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" style={{ fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>

            <div style={{ font: "900 14px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a", marginBottom: 8 }}>Detalle do rexistro</div>
            <div style={{ font: "700 12.5px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a", marginBottom: 4 }}>
              <span style={{ opacity: 0.85 }}>Data e hora:</span> {mobileAlignFor.dateStr}
            </div>
            <div style={{ font: "800 12px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a", marginBottom: 10 }}>
              RESULTADO DA ALIÑACIÓN
            </div>

            {/* Aliñación presentada por posicións */}
            {POS_ORDER.map((k) => {
              const arr = mobileAlignFor.groups?.[k] || [];
              if (!arr.length) return null;
              return (
                <div key={`sec-${k}`} style={{ marginBottom: 8 }}>
                  <div style={{ font: "900 11.5px/1 Montserrat,system-ui,sans-serif", color: "#64748b", marginBottom: 4 }}>{k}</div>
                  <div style={{ font: "800 12.8px/1.35 Montserrat,system-ui,sans-serif", color: "#0f172a", wordBreak: "break-word" }}>
                    {arr.map((node, idx) => (
                      <span key={`n-${k}-${idx}`}>
                        {node}
                        {idx < arr.length - 1 && <span style={{ opacity: 0.6, margin: "0 2px" }}>|</span>}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  return (
    <main style={WRAP}>
      <style>{STYLES}</style>

      <h2 style={PAGE_HEAD}>HISTÓRICO DE RESULTADOS</h2>

      <div style={PAGE_SUB_WRAP}>
        <p style={PAGE_SUB}>Aquí podes consultar os resultados individuais e xerais de cada partido.</p>
        {isMobile && isAdmin && (
          <button type="button" style={INFO_BTN} title="Información" aria-label="Información" onClick={() => setShowMobileInfo(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" style={INFO_SVG}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
          </button>
        )}
      </div>

      {toast?.msg && <div style={toast.ok ? TOAST_OK : TOAST_ERR} aria-live="polite">{toast.msg}</div>}
      {err && <div style={{ ...TOAST_ERR }} role="status">{err}</div>}
      {!err && loading && <div style={TOAST_OK} role="status">Cargando…</div>}
      {!err && !loading && view.length === 0 && <div style={TOAST_OK} role="status">Non hai partidos rematados aínda.</div>}

      {/* Visor completo (ollo) */}
      {!err && !loading && openResultsMatchId && (
        <FullResults match={view.find((m) => m.id === openResultsMatchId) || { id: openResultsMatchId, match_iso: null, equipo1: "", equipo2: "" }} />
      )}

      {/* Lista + Edición */}
      {!err && !loading && !openResultsMatchId && view.length > 0 && (
        <ul style={LIST} aria-label="Lista de partidos rematados">
          {view.map((match) => {
            const isPeopleOpen = openPeopleMatchId === match.id;
            const eyeActive = hasResults.has(match.id);
            const confirmedCount = (confirmedByMatch[match.id]?.size) || 0;

            const itemBg = isMobile
              ? { background: "linear-gradient(180deg,#e0f2fe,#bae6fd)", border: "1px solid #7dd3fc" }
              : {};

            return (
              <li key={match.id} style={{ ...ITEM_BASE, ...itemGrid(isMobile), ...itemBg, marginBottom: isPeopleOpen ? 12 : 8 }}>
                {isMobile ? (
                  <div style={COMPACT_TEXT}>
                    {/* Icono calendario + burbulla de data (2s) */}
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        style={{ ...ICONBTN, width: 26, height: 26, border: "1px solid #0ea5e9", background: "#fff" }}
                        title="Ver data do partido"
                        aria-label="Ver data do partido"
                        onClick={() => {
                          setDateBubbleFor(match.id);
                          setTimeout(() => setDateBubbleFor((id) => (id === match.id ? null : id)), 2000);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" style={{ ...SVGI, stroke: "#0ea5e9" }}>
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                      </button>
                      {dateBubbleFor === match.id && <div style={LOCAL_DATE_BUBBLE}>{dmyFull(match.match_iso)}</div>}
                    </div>

                    <span style={TEAMS(true)}>
                      {match.equipo1} <span style={{ color: "#0f172a" }}>-</span> {match.equipo2}
                    </span>
                  </div>
                ) : (
                  <>
                    <span style={DATE(false)}>{dmyFullTime(match.match_iso)}</span>
                    <span style={TEAMS(false)}>{match.equipo1} <span style={SEP}>-</span> {match.equipo2}</span>
                  </>
                )}

                <div style={ACTIONS}>
                  {isAdmin && !isMobile && (
                    <>
                      {!isPeopleOpen ? (
                        <button type="button" style={ICONBTN} title="Ver usuarias/os" aria-label="Ver usuarias/os" onClick={() => onClickPeople(match.id)}>
                          <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </button>
                      ) : (
                        <button type="button" style={XBTN} title="Pechar etiqueta do partido" aria-label="Pechar etiqueta do partido" onClick={() => { setOpenPeopleMatchId(null); setOpenUserPanel(null); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" style={XSVG}><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    style={isMobile ? EYE_BTN_MOBILE : EYE_BTN_DESKTOP(eyeActive)}
                    title="Ver resultados do partido"
                    aria-label="Ver resultados do partido"
                    onClick={async () => {
                      setOpenPeopleMatchId(null);
                      setOpenUserPanel(null);
                      setOpenResultsMatchId(match.id);
                      await ensurePlayersLoaded();
                      await loadConfirmedForMatch(match.id);
                    }}
                  >
                    <svg width={isMobile ? 18 : 18} height={isMobile ? 18 : 18} viewBox="0 0 24 24" style={isMobile ? EYE_SVG_BLUE : EYE_SVG(eyeActive)}>
                      <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>

                  {!isMobile && <span style={CONF_COUNT}>{confirmedCount}</span>}
                </div>

                {/* Panel persoas — escritorio */}
                {isPeopleOpen && isAdmin && !isMobile && (
                  <section style={PEOPLE_SHELL(!!openUserPanel)} aria-label="Edición por usuaria/o">
                    <div>
                      {users.length === 0 ? (
                        <div style={TOAST_OK}>Cargando usuarias/os…</div>
                      ) : (
                        <ul style={USERS_LIST}>
                          {users.map((u) => {
                            const isOpen = openUserPanel === u.id;
                            const isConfirmed = (confirmedByMatch[match.id]?.has(u.id)) || false;
                            const rowStyle = isOpen ? USER_ROW_BLINK : (isConfirmed ? USER_ROW_CONFIRMED : USER_ROW_BASE);
                            return (
                              <li key={u.id} style={rowStyle} title={u.name}>
                                <span style={USER_BADGE}>{u.code || "—"}</span>
                                <div>
                                  <div style={USER_NAME}>{u.name}</div>
                                  {u.surname && <div style={USER_SUB}>{u.surname}</div>}
                                </div>
                                {!isOpen ? (
                                  <button type="button" style={ICONBTN} title="Abrir táboas desta persoa" aria-label="Abrir táboas desta persoa" onClick={() => onOpenUserEditor(u.id)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" /></svg>
                                  </button>
                                ) : (
                                  <button type="button" style={XBTN} title="Pechar editor desta persoa" aria-label="Pechar editor desta persoa" onClick={() => setOpenUserPanel(null)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" style={XSVG}><path d="M18 6 6 18M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {openUserPanel && (
                      <div style={RIGHT_PAD}>
                        {players.length === 0 ? (
                          <div style={TOAST_OK}>Cargando xogadoras/es…</div>
                        ) : (
                          <>
                            <div style={EDIT_GRID}>
                              {renderPlayersColumn(players, selPlantilla, setSelPlantilla, COL_BG_ALI)}
                              {renderPlayersColumn(players, selOnce, setSelOnce, COL_BG_OFI)}
                            </div>
                            {renderSummaryRight(match.id)}
                          </>
                        )}
                      </div>
                    )}
                  </section>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Info admins móbil */}
      {showMobileInfo && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: "10% 6% auto 6%", background: "linear-gradient(180deg,#e0f2fe,#bae6fd)", border: "1px solid #7dd3fc", borderRadius: 12, padding: 12, zIndex: 80, boxShadow: "0 16px 36px rgba(0,0,0,.25)" }}>
          <button type="button" style={{ ...XBTN_SMALL, position: "absolute", top: 8, right: 8 }} aria-label="Pechar" title="Pechar" onClick={() => setShowMobileInfo(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" style={XSVG}><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <p style={{ font: "900 13px/1.2 Montserrat,system-ui,sans-serif", color: "#0c4a6e", marginBottom: 6 }}>AVISO A ADMINISTRADORES</p>
          <p style={{ font: "600 12.5px/1.25 Montserrat,system-ui,sans-serif", color: "#0c4a6e" }}>
            No caso de ser necesaria algunha corrección, na versión PC de sobremesa existe funcionalidade engadida de
            edición manual de resultados por partido e xogador/a.
          </p>
        </div>
      )}
    </main>
  );
}

