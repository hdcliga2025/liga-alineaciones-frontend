// src/pages/ResultadosHistoricos.jsx
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos base ===== */
const WRAP = { maxWidth: 1120, margin: "0 auto", padding: "16px" };
const PAGE_HEAD = { margin: "0 0 6px", font: "700 22px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const PAGE_SUB = { margin: "0 0 12px", font: "400 14.5px/1.25 Montserrat,system-ui,sans-serif", color: "#475569" };

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

const ACTIONS = { display: "flex", gap: 8, alignItems: "center", justifySelf: "end" };
const ICONBTN = { width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.06)", cursor: "pointer" };
const SVGI = { fill: "none", stroke: "#0f172a", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
const eyeBtnStyle = (active) =>
  active ? { ...ICONBTN, border: "1px solid #0ea5e9", background: "linear-gradient(180deg,#38bdf8,#0ea5e9)" } : ICONBTN;
const eyeIconStyle = (active) => (active ? { ...SVGI, stroke: "#fff" } : SVGI);

/* Toasts */
const TOAST_OK = { margin: "8px 0 12px", padding: "10px 12px", borderRadius: 10, background: "#ecfeff", border: "1px solid #67e8f9", color: "#0e7490", font: "600 12.5px/1.2 Montserrat,system-ui,sans-serif" };
const TOAST_ERR = { ...TOAST_OK, background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c" };

/* ===== Panel Persoas ===== */
const PEOPLE_SHELL = (twoCols) =>
  twoCols
    ? { marginTop: 8, border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", padding: 12, display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }
    : { marginTop: 8, border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", padding: "10px 12px" };

const USERS_LIST = { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 };
const USER_ROW_BASE = { display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 6, alignItems: "center", padding: "6px 8px", borderRadius: 8, border: "1px solid #eef2f7", background: "#f9fafb" };
const USER_ROW_BLINK = { ...USER_ROW_BASE, animation: "userBlink 1.5s ease-in-out infinite", background: "linear-gradient(180deg,#dff3ff,#eef7ff)" };
const USER_ROW_CONFIRMED = { ...USER_ROW_BASE, background: "linear-gradient(180deg,#eafff3,#f7fff9)", border: "1px solid #22c55e" };
const USER_BADGE = { font: "900 11px/1 Montserrat,system-ui,sans-serif", color: "#0ea5e9", background: "#e0f2fe", padding: "4px 7px", borderRadius: 8, minWidth: 38, textAlign: "center" };
const USER_NAME = { font: "800 13px/1.05 Montserrat,system-ui,sans-serif", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const USER_SUB = { font: "600 11.5px/1.05 Montserrat,system-ui,sans-serif", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

const RIGHT_PAD = { paddingLeft: 16 };
const EDIT_RIGHT = { display: "grid", gridTemplateColumns: "minmax(252px,1fr) minmax(252px,1fr)", gap: 8, alignItems: "start" };
const COL_BASE = { border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", position: "relative" };
const COL_BG_ALI = { background: "#e9f9f2" };
const COL_BG_OFI = { background: "#fff5e7" };
const COL_HEAD = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 6px", background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" };
const COL_TITLE = { font: "900 10.9px/1.02 Montserrat,system-ui,sans-serif", color: "#0f172a", letterSpacing: 0.2, textTransform: "uppercase" };
const COL_TITLE_BLINK = { ...COL_TITLE, animation: "blinkSoft 1.5s ease-in-out infinite" };
const COUNT = { font: "900 10.5px/1.02 Montserrat,system-ui,sans-serif", color: "#22c55e" };

/* Demarcacións */
const GROUP_SCROLL = { maxHeight: 260, overflowY: "auto", background: "inherit" };
const GROUP_WRAP = (bg) => ({ position: "relative", background: "inherit", paddingRight: 20, marginBottom: 3 });
const POS_SIDE = (bg) => ({ position: "absolute", right: 2, top: 2, bottom: 2, writingMode: "vertical-rl", textOrientation: "mixed", font: "900 9.8px/1 Montserrat,system-ui,sans-serif", color: "#64748b", opacity: 0.85, display: "grid", placeItems: "center", background: "transparent", padding: "2px 0" });
const POS_SEP = { height: 1, background: "#e5e7eb" };

/* Filas xogadores — compactas */
const ROW_PLAYER = { display: "grid", gridTemplateColumns: "16px 1fr auto", gap: 6, alignItems: "center", padding: "0 2px", minWidth: 0 };
const CHECKBOX = { width: 14, height: 14, transform: "scale(1.02)", marginRight: 2 };
/* ↑ tamaño un pouco maior sen aumentar a altura, line-height comprimida */
const playerNameStyle = { font: "700 11px/.82 Montserrat,system-ui,sans-serif", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const COUNT_MINI = { font: "900 10px/1 Montserrat,system-ui,sans-serif", color: "#0ea5e9", padding: "0 4px", borderRadius: 6, background: "#e0f2fe" };

/* Resumo / RESULTADOS OBTIDOS (preview) */
const SUMMARY_WRAP = { maxWidth: 540, marginTop: 8, marginLeft: "auto", marginRight: "auto" };
const SUMMARY = { border: "1px solid #fecaca", borderRadius: 12, background: "linear-gradient(180deg,#fff6f6,#ffeaea)", padding: 8, position: "relative" };
const SUMMARY_TITLE_WRAP = { padding: "2px 6px 6px 6px", background: "linear-gradient(180deg,#fff,#fff6f6)", borderTopLeftRadius: 10, borderTopRightRadius: 10 };
const SUMMARY_TITLE = { ...COL_TITLE, textDecoration: "none", margin: "2px 0 4px 0" };
const HR = { height: 1, background: "#e5e7eb", width: "100%" };
const GRID_DEF = "120px 1fr 70px 3fr";
const T_HEADER = { display: "grid", gridTemplateColumns: GRID_DEF, gap: 0, padding: "4px 0", borderBottom: "1px solid #e5e7eb", color: "#0f172a", font: "800 11px/1.02 Montserrat,system-ui,sans-serif" };
const T_ROW = { display: "grid", gridTemplateColumns: GRID_DEF, gap: 0, padding: "3px 0", borderBottom: "1px solid #f1f5f9", font: "600 10.5px/.96 Montserrat,system-ui,sans-serif" };
const CELL = { padding: "0 6px", borderRight: "1px solid #e5e7eb" };
const CELL_LAST = { padding: "0 6px" };
const ACERTOS_CELL = { textAlign: "center" };
const CELSTE = { color: "#0ea5e9", fontWeight: 800 };
const BTN_CONFIRM = { marginTop: 8, width: "100%", borderRadius: 10, padding: "8px 10px", font: "900 12px/1.02 Montserrat,system-ui,sans-serif", background: "linear-gradient(180deg,#38bdf8,#0ea5e9)", color: "#fff", border: "1px solid #0ea5e9", boxShadow: "0 3px 10px rgba(14,165,233,.18)", cursor: "pointer" };
const BTN_CONFIRM_BLINK = { ...BTN_CONFIRM, animation: "pulseSoft 1.5s ease-in-out infinite" };

/* Modal confirm & resultados */
const MODAL_BACK = { position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", display: "grid", placeItems: "center", zIndex: 60 };
const MODAL_CARD = { width: 740, maxWidth: "95vw", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,.25)", padding: 12, position: "relative" };
const MODAL_T = { margin: 0, font: "800 16px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const MODAL_P = { margin: "8px 0 14px", font: "600 13px/1.25 Montserrat,system-ui,sans-serif", color: "#334155" };
const MODAL_ROW = { display: "flex", gap: 10, justifyContent: "flex-end" };
const BTN_LIGHT = { borderRadius: 10, padding: "8px 12px", font: "800 12px/1 Montserrat,system-ui,sans-serif", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a", cursor: "pointer" };
const BTN_MAIN = { ...BTN_CONFIRM, width: "auto", padding: "8px 14px", boxShadow: "none" };

const EMPTY = { marginTop: 8, padding: "8px 10px", borderRadius: 10, background: "#ecfeff", border: "1px solid #67e8f9", color: "#0e7490", font: "600 12px/1.2 Montserrat,system-ui,sans-serif" };
const ERR = { ...EMPTY, background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c" };

const STYLES = `
@keyframes blinkSoft{0%{opacity:1}50%{opacity:.7}100%{opacity:1}}
@keyframes pulseSoft{0%{transform:scale(1)}50%{transform:scale(1.02)}100%{transform:scale(1)}}
@keyframes userBlink{0%{box-shadow:0 0 0 rgba(14,165,233,0)}50%{box-shadow:0 10px 26px rgba(14,165,233,.45)}100%{box-shadow:0 0 0 rgba(14,165,233,0)}}
`;

/* ===== Utils ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const sortDescByDate = (a, b) => (b.match_iso ? new Date(b.match_iso).getTime() : -Infinity) - (a.match_iso ? new Date(a.match_iso).getTime() : -Infinity);
const dmyShort = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}-${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

function inferPosFromFoto(url = "") {
  const m = url.match(/-(POR|DEF|CEN|DEL)\.(?:jpg|jpeg|png|webp)$/i);
  return m ? m[1].toUpperCase() : "CEN";
}
function normalizePlayer(p) {
  let nombre = p.nombre || "";
  let pos = p.pos || null;
  const nlow = nombre.trim().toLowerCase();
  if (nlow === "joel lago") {
    nombre = "Yoel Lago";
    pos = "DEF";
  }
  if (nlow.includes("jones") && nlow.includes("el-abdellaoui")) {
    pos = "DEL";
  }
  return { ...p, nombre, pos };
}
const POS_ORDER = ["POR", "DEF", "CEN", "DEL"];
function groupByPos(players) {
  const b = { POR: [], DEF: [], CEN: [], DEL: [] };
  for (const p of players || []) (b[(p.pos || "CEN").toUpperCase()] || b.CEN).push(p);
  POS_ORDER.forEach((k) => b[k].sort((a, b) => (a.dorsal ?? 999) - (b.dorsal ?? 999)));
  return b;
}

/* Sonidos */
function bipSingle(freq = 880, dur = 0.11) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.01);
    o.start();
    o.stop(ctx.currentTime + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  } catch {}
}
function bipDouble() {
  bipSingle(880, 0.1);
  setTimeout(() => bipSingle(920, 0.1), 160);
}

/* ===== Compo ===== */
export default function ResultadosHistoricos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 560);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const [openPeopleMatchId, setOpenPeopleMatchId] = useState(null);
  const [openResultsMatchId, setOpenResultsMatchId] = useState(null);

  const [openUserPanel, setOpenUserPanel] = useState(null);
  const [users, setUsers] = useState([]);
  const [userNames, setUserNames] = useState(new Map()); // id -> name
  const [players, setPlayers] = useState([]);

  // Sets de selección
  const [selPlantilla, setSelPlantilla] = useState(new Set());
  const [selOnce, setSelOnce] = useState(new Set());

  // Contador efímero por pulsación
  const [flash, setFlash] = useState({ id: null, count: 0, t: 0 });
  const flashTimerRef = useRef(null);
  const showFlash = (id, count) => {
    clearTimeout(flashTimerRef.current);
    setFlash({ id, count, t: Date.now() });
    flashTimerRef.current = setTimeout(() => setFlash({ id: null, count: 0, t: 0 }), 900);
  };

  // Modal confirm
  const [ask, setAsk] = useState({ open: false, matchId: null });

  const [resultsConfirmed, setResultsConfirmed] = useState({});
  const [hasResults, setHasResults] = useState(new Set());
  const [confirmedByMatch, setConfirmedByMatch] = useState({}); // matchId -> Set(userIds)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok, t: Date.now() });
    setTimeout(() => setToast(""), 4200);
  };

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
      setErr("");
      setLoading(true);
      try {
        await resolveAdmin();
        const { data, error } = await supabase.from("matches_finalizados").select("id,equipo1,equipo2,match_iso");
        if (error) throw error;
        const norm = (data || [])
          .map((r) => ({
            id: r.id ?? null,
            equipo1: (r.equipo1 || "").toUpperCase(),
            equipo2: (r.equipo2 || "").toUpperCase(),
            match_iso: r.match_iso || null,
          }))
          .sort(sortDescByDate);
        if (alive) setRows(norm);

        if ((data || []).length) {
          const ids = (data || []).map((r) => r.id).filter(Boolean);
          const { data: rc } = await supabase.from("resultados_confirmados").select("match_id,user_id").in("match_id", ids);
          const map = {};
          (rc || []).forEach((r) => {
            if (!map[r.match_id]) map[r.match_id] = new Set();
            map[r.match_id].add(r.user_id);
          });
          if (alive) setConfirmedByMatch(map);
          const s = new Set((rc || []).map((x) => x.match_id));
          if (alive) setHasResults(s);
        }
      } catch (e) {
        console.error("Historico load:", e);
        if (alive) setErr("Produciuse un erro ao cargar o histórico.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      clearTimeout(flashTimerRef.current);
    };
  }, []);

  async function ensurePlayersLoaded() {
    if (players.length) return;
    try {
      const { data: playersData, error: playersErr } = await supabase.from("jugadores").select("id, nombre, dorsal, foto_url");
      if (playersErr) throw playersErr;
      setPlayers(
        (playersData || []).map((pp) => {
          const p = normalizePlayer(pp);
          const pos = p.pos || inferPosFromFoto(p.foto_url || "");
          return { id: p.id, dorsal: p.dorsal ?? null, pos, label: p.dorsal ? `${p.dorsal} - ${p.nombre}` : p.nombre || "—" };
        })
      );
    } catch (e) {
      console.error("Load players error:", e);
      setPlayers([]);
    }
  }

  async function ensureUserNames(ids) {
    const missing = ids.filter((id) => !userNames.has(id));
    if (!missing.length) return;
    try {
      const { data, error } = await supabase.from("profiles").select("id, first_name, last_name, full_name, email").in("id", missing);
      if (error) throw error;
      const m = new Map(userNames);
      (data || []).forEach((u) => {
        const code = (u.first_name || "").trim();
        const surname = (u.last_name || "").trim();
        const full = (u.full_name || "").trim();
        const email = (u.email || "").trim();
        const displayName = full || `${code} ${surname}`.trim() || email || u.id;
        m.set(u.id, displayName);
      });
      setUserNames(m);
    } catch (e) {
      console.error("ensureUserNames:", e);
    }
  }

  async function loadUsersList() {
    try {
      const { data, error } = await supabase.from("profiles").select("id, first_name, last_name, full_name, email").order("first_name", { ascending: true, nullsFirst: true });
      if (error) throw error;

      const arr = (data || [])
        .map((u) => {
          const code = (u.first_name || "").trim();
          const surname = (u.last_name || "").trim();
          const email = (u.email || "").trim();
          const full = (u.full_name || "").trim();
          const displayName = full || `${code} ${surname}`.trim() || email || u.id;
          const allEmpty = !full && !code && !surname && !email;
          return allEmpty ? null : { id: u.id, code, surname, name: displayName };
        })
        .filter(Boolean)
        .sort((a, b) => {
          const na = /^\d{2}$/.test(a.code || "") ? 0 : 1;
          const nb = /^\d{2}$/.test(b.code || "") ? 0 : 1;
          if (na !== nb) return na - nb;
          return (a.code || "").localeCompare(b.code || "");
        });

      setUsers(arr);
      // cache para nomes
      const m = new Map(userNames);
      arr.forEach((u) => m.set(u.id, u.name));
      setUserNames(m);
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
        .order("confirmed_at", { ascending: false });
      if (error) throw error;

      setResultsConfirmed((prev) => ({ ...prev, [matchId]: data || [] }));
      setHasResults((prev) => new Set([...prev, matchId]));

      // marcar confirmados para as tarxetas (verde degradado)
      const setU = new Set((data || []).map((r) => r.user_id));
      setConfirmedByMatch((prev) => ({ ...prev, [matchId]: setU }));

      // garantir nomes de usuarios
      await ensureUserNames(Array.from(setU));
    } catch (e) {
      console.error("loadConfirmedForMatch error:", e);
      showToast("Erro cargando resultados confirmados.", false);
    }
  }

  async function onClickPeople(matchId) {
    if (!isAdmin) return;
    // abrir/pechar
    const opening = openPeopleMatchId !== matchId;
    // pecha o visor de resultados se está aberto
    setOpenResultsMatchId(null);
    setOpenPeopleMatchId(opening ? matchId : null);
    setOpenUserPanel(null);
    if (opening) {
      await loadUsersList();
      await ensurePlayersLoaded();
      // para colorear en verde as confirmadas
      await loadConfirmedForMatch(matchId);
    }
  }

  async function onOpenUserEditor(userId) {
    if (!isAdmin) return;
    bipSingle();
    setOpenUserPanel(userId);
    setSelPlantilla(new Set());
    setSelOnce(new Set());
    await ensurePlayersLoaded();
  }

  function toggleSelect(id, checkedSet, setSet) {
    const nx = new Set(checkedSet);
    if (nx.has(id)) nx.delete(id);
    else nx.add(id);
    setSet(nx);
    showFlash(id, nx.size); // contador efímero
  }

  async function confirmarMatch(matchId) {
    console.log("[CONFIRMAR] start", { matchId, ali: selPlantilla.size, once: selOnce.size, openUserPanel });
    try {
      if (!matchId) {
        showToast("Falta o identificador do partido.", false);
        return;
      }
      if (!openUserPanel) {
        showToast("Selecciona unha usuaria/o primeiro (teclado).", false);
        return;
      }
      if (selPlantilla.size !== 11) {
        showToast("Aliñación realizada debe ter 11.", false);
        return;
      }
      if (selOnce.size !== 11) {
        showToast("Once oficial debe ter 11.", false);
        return;
      }

      showToast("Gardando…", true);
      bipDouble();

      const plantillaSet = new Set(selPlantilla);
      const onceSet = new Set(selOnce);
      let acertos = 0;
      onceSet.forEach((id) => {
        if (plantillaSet.has(id)) acertos++;
      });

      const nowISO = new Date().toISOString();
      const payload = [
        {
          match_id: matchId,
          user_id: openUserPanel,
          confirmed_at: nowISO,
          acertos,
          plantilla_ids: Array.from(plantillaSet),
          once_ids: Array.from(onceSet),
          updated_at: nowISO,
        },
      ];

      console.log("[CONFIRMAR] upsert payload", payload);
      const { data: upData, error: upErr } = await supabase.from("resultados_confirmados").upsert(payload, { onConflict: "match_id,user_id", ignoreDuplicates: false }).select("*");

      console.log("[CONFIRMAR] response", { upData, upErr });
      if (upErr) {
        showToast(`Erro gardando: ${upErr.message || upErr.code}`, false);
        return;
      }

      // Marca UI, pecha edición
      setHasResults((prev) => new Set([...prev, matchId]));
      setConfirmedByMatch((prev) => {
        const s = new Set([...(prev[matchId] || new Set()), openUserPanel]);
        return { ...prev, [matchId]: s };
      });

      setOpenUserPanel(null);
      setOpenPeopleMatchId(null);
      setSelPlantilla(new Set());
      setSelOnce(new Set());

      await loadConfirmedForMatch(matchId);
      showToast("Aliñación gardada.", true);
    } catch (e) {
      console.error("confirmarMatch error:", e);
      showToast("Erro inesperado ao confirmar.", false);
    }
  }

  const view = useMemo(() => rows, [rows]);
  const aliIs11 = selPlantilla.size === 11;
  const onceIs11 = selOnce.size === 11;

  function renderPlayersColumn(list, checkedSet, setSet, bg) {
    const buckets = groupByPos(list);
    return (
      <div style={{ ...COL_BASE, ...(bg || {}) }}>
        <div style={COL_HEAD}>
          <span style={bg === COL_BG_OFI ? (aliIs11 ? COL_TITLE_BLINK : COL_TITLE) : COL_TITLE}>{bg === COL_BG_OFI ? "ONCE OFICIAL" : "ALIÑACIÓN REALIZADA"}</span>
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
                    <label key={p.id} style={ROW_PLAYER} title={p.label}>
                      <input type="checkbox" style={CHECKBOX} checked={isChecked} onChange={() => toggleSelect(p.id, checkedSet, setSet)} />
                      <span style={playerNameStyle}>{p.label}</span>
                      {flash.id === p.id && <span style={COUNT_MINI}>{flash.count}/11</span>}
                    </label>
                  );
                })}
              </div>
              <div aria-hidden="true" style={POS_SIDE(bgcol)}>
                {k}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderSummary(matchId) {
    const uMap = new Map(users.map((u) => [u.id, u]));
    const userLabel = uMap.get(openUserPanel)?.name || "—";

    const playersById = new Map(players.map((p) => [p.id, p]));
    const acertosLive = Array.from(selOnce).filter((id) => selPlantilla.has(id)).length;
    const aliLabels = Array.from(selPlantilla).map((pid) => {
      const p = playersById.get(pid);
      const ok = selOnce.has(pid);
      const label = p ? p.label : "—";
      return ok ? <strong style={CELSTE}>{label}</strong> : <span>{label}</span>;
    });
    const out = [];
    aliLabels.forEach((node, i) => {
      out.push(node);
      if (i < aliLabels.length - 1) out.push(<span style={{ opacity: 0.6 }}> {" | "} </span>);
    });

    return (
      <div style={SUMMARY_WRAP}>
        <div style={SUMMARY}>
          <div style={SUMMARY_TITLE_WRAP}>
            <div style={SUMMARY_TITLE}>RESULTADOS OBTIDOS</div>
            <div style={HR} />
          </div>
          <div role="table" style={{ width: "100%" }}>
            <div role="row" style={T_HEADER}>
              <div style={CELL}>Data e hora</div>
              <div style={CELL}>HDC Membro</div>
              <div style={{ ...CELL, textAlign: "center" }}>Acertos</div>
              <div style={CELL_LAST}>Aliñación presentada</div>
            </div>
            <div role="row" style={T_ROW}>
              <div style={CELL}>{dmyShort(new Date().toISOString())}</div>
              <div style={CELL}>{userLabel}</div>
              <div style={{ ...CELL, ...ACERTOS_CELL }}>
                <span style={CELSTE}>{acertosLive}</span>
              </div>
              <div style={CELL_LAST}>{out}</div>
            </div>
          </div>

          <button type="button" style={onceIs11 ? BTN_CONFIRM_BLINK : BTN_CONFIRM} onClick={() => setAsk({ open: true, matchId })} disabled={!onceIs11}>
            CONFIRMAR
          </button>
        </div>
      </div>
    );
  }

  // Modal de resultados confirmados (centrado pantalla)
  function ResultsModal({ matchId, onClose }) {
    const recs = resultsConfirmed[matchId] || [];
    const playersMap = new Map(players.map((p) => [p.id, p.label]));
    return (
      <div role="dialog" aria-modal="true" style={MODAL_BACK}>
        <div style={MODAL_CARD}>
          <button type="button" title="Pechar" aria-label="Pechar" onClick={onClose} style={{ position: "absolute", top: 8, right: 8, ...ICONBTN, width: 28, height: 28 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" style={SVGI}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <div style={{ ...SUMMARY_TITLE_WRAP, borderRadius: 8 }}>
            <div style={SUMMARY_TITLE}>RESULTADOS OBTIDOS (confirmados)</div>
            <div style={HR} />
          </div>

          <div role="table" style={{ width: "100%" }}>
            <div role="row" style={T_HEADER}>
              <div style={CELL}>Data e hora</div>
              <div style={CELL}>HDC Membro</div>
              <div style={{ ...CELL, textAlign: "center" }}>Acertos</div>
              <div style={CELL_LAST}>Aliñación presentada</div>
            </div>
            {recs.length === 0 ? (
              <div style={{ padding: "8px 6px", font: "600 12px/1.2 Montserrat,system-ui,sans-serif", color: "#64748b" }}>Sen confirmacións aínda.</div>
            ) : (
              recs.map((rec, idx) => {
                const uname = userNames.get(rec.user_id) || rec.user_id;
                const onceSet = new Set(rec.once_ids || []);
                const labels = (rec.plantilla_ids || []).map((pid, j, arr) => {
                  const txt = playersMap.get(pid) || String(pid);
                  const ok = onceSet.has(pid);
                  return (
                    <span key={`${pid}-${j}`}>
                      {ok ? <strong style={CELSTE}>{txt}</strong> : txt}
                      {j < arr.length - 1 && <span style={{ opacity: 0.6 }}> {" | "} </span>}
                    </span>
                  );
                });
                return (
                  <div key={`${rec.user_id}-${idx}`} role="row" style={T_ROW}>
                    <div style={CELL}>{dmyShort(rec.confirmed_at)}</div>
                    <div style={CELL}>{uname}</div>
                    <div style={{ ...CELL, ...ACERTOS_CELL }}>
                      <span style={CELSTE}>{rec.acertos}</span>
                    </div>
                    <div style={CELL_LAST}>{labels}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main style={WRAP}>
      <style>{STYLES}</style>

      <h2 style={PAGE_HEAD}>HISTÓRICO DE RESULTADOS</h2>
      <p style={PAGE_SUB}>Aquí podes consultar os resultados individuais e xerais de cada partido.</p>

      {toast?.msg && <div style={toast.ok ? TOAST_OK : TOAST_ERR} aria-live="polite">{toast.msg}</div>}
      {err && <div style={ERR} role="status" aria-live="polite">{err}</div>}
      {!err && loading && <div style={EMPTY} role="status" aria-live="polite">Cargando…</div>}
      {!err && !loading && view.length === 0 && (<div style={EMPTY} role="status" aria-live="polite">Non hai partidos rematados aínda.</div>)}

      {!err && !loading && view.length > 0 && (
        <ul style={LIST} aria-label="Lista de partidos rematados">
          {view.map((match, i) => {
            const isPeopleOpen = openPeopleMatchId === match.id;
            const isResultsOpen = openResultsMatchId === match.id;
            const eyeActive = isResultsOpen || hasResults.has(match.id);

            return (
              <li key={`${match.id ?? match.match_iso ?? "noid"}-${i}`} style={{ ...ITEM, marginBottom: (isPeopleOpen || isResultsOpen) ? 12 : 8 }}>
                <span style={DATE}>{dmyShort(match.match_iso)}</span>
                <span style={TEAMS}>{match.equipo1 || "—"} <span style={SEP}>-</span> {match.equipo2 || "—"}</span>

                <div style={ACTIONS}>
                  {isAdmin && !isMobile && (
                    <>
                      {!isPeopleOpen ? (
                        <button type="button" style={ICONBTN} title="Ver usuarias/os" aria-label="Ver usuarias/os" onClick={() => onClickPeople(match.id)}>
                          <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </button>
                      ) : (
                        <button type="button" style={ICONBTN} title="Pechar etiqueta do partido" aria-label="Pechar etiqueta do partido" onClick={() => { setOpenPeopleMatchId(null); setOpenUserPanel(null); }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" style={SVGI}><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    style={eyeBtnStyle(eyeActive)}
                    title={isResultsOpen ? "Pechar resultados" : "Ver resultados do partido"}
                    aria-label={isResultsOpen ? "Pechar resultados" : "Ver resultados do partido"}
                    onClick={async ()=>{
                      const opening = openResultsMatchId !== match.id;
                      // siempre cerrar ediciones abiertas
                      setOpenPeopleMatchId(null);
                      setOpenUserPanel(null);
                      setOpenResultsMatchId(opening ? match.id : null);
                      if (opening) { await ensurePlayersLoaded(); await loadConfirmedForMatch(match.id); }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" style={eyeIconStyle(eyeActive)}>
                      <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>

                {isPeopleOpen && isAdmin && !isMobile && (
                  <section style={PEOPLE_SHELL(!!openUserPanel)} aria-label="Edición por usuaria/o">
                    <div>
                      {users.length === 0 ? (
                        <div style={EMPTY}>Cargando usuarias/os…</div>
                      ) : (
                        <ul style={USERS_LIST}>
                          {users.map(u => {
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
                                  <button type="button" style={ICONBTN} title="Abrir táboas desta persoa" aria-label="Abrir táboas desta persoa" onClick={()=> onOpenUserEditor(u.id)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" /></svg>
                                  </button>
                                ) : (
                                  <button type="button" style={ICONBTN} title="Pechar editor desta persoa" aria-label="Pechar editor desta persoa" onClick={()=> setOpenUserPanel(null)}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" style={SVGI}><path d="M18 6 6 18M6 6l12 12" /></svg>
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
                          <div style={EMPTY}>Cargando xogadoras/es…</div>
                        ) : (
                          <>
                            <div style={EDIT_RIGHT}>
                              {renderPlayersColumn(players, selPlantilla, setSelPlantilla, COL_BG_ALI)}
                              {renderPlayersColumn(players, selOnce, setSelOnce, COL_BG_OFI)}
                            </div>
                            {renderSummary(match.id)}
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

      {/* Modal Confirmación */}
      {ask.open && (
        <div role="dialog" aria-modal="true" style={MODAL_BACK}>
          <div style={{ ...MODAL_CARD, width: 440 }}>
            <h3 style={MODAL_T}>Confirmar aliñación</h3>
            <p style={MODAL_P}>¿Seguro que queres gardar esta aliñación?</p>
            <div style={MODAL_ROW}>
              <button type="button" style={BTN_LIGHT} onClick={() => setAsk({ open: false, matchId: null })}>Cancelar</button>
              <button
                type="button"
                style={BTN_MAIN}
                onClick={async () => {
                  const m = ask.matchId;
                  setAsk({ open: false, matchId: null });
                  await confirmarMatch(m);
                }}
              >Gardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resultados confirmados */}
      {openResultsMatchId && (
        <ResultsModal
          matchId={openResultsMatchId}
          onClose={() => setOpenResultsMatchId(null)}
        />
      )}
    </main>
  );
}

