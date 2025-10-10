// src/pages/ResultadosHistoricos.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
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
const TEAMS = {
  font: "600 15px/1.2 Montserrat,system-ui,sans-serif",
  textTransform: "uppercase",
  color: "#111827",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const SEP = { margin: "0 6px", fontWeight: 600, color: "#0f172a" };

const ACTIONS = { display:"flex", gap:8, alignItems:"center", justifySelf:"end" };
const ICONBTN = { width:34, height:34, display:"grid", placeItems:"center", borderRadius:10, border:"1px solid #e2e8f0", background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)", cursor:"pointer" };
const SVGI = { fill:"none", stroke:"#0f172a", strokeWidth:1.9, strokeLinecap:"round", strokeLinejoin:"round" };

/* Panel edición por partido — full-bleed */
const EDIT_WRAP = {
  marginTop: 8,
  border: "1px solid #dbe2f0",
  borderRadius: 12,
  background:"#f8fafc",
  padding: 12,
  marginLeft: -12,
  marginRight: -12,
};

const USERS_LIST = { listStyle:"none", margin:0, padding:0, display:"grid", gap:8 };
const USER_ROW = {
  display:"grid",
  gridTemplateColumns:"1fr auto",
  alignItems:"center",
  gap:10,
  padding:"8px 10px",
  borderRadius:10,
  background:"#fff",
  border:"1px solid #e5e7eb",
  boxShadow:"0 1px 4px rgba(0,0,0,.04)"
};
const USER_NAME = { font:"600 14px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a" };
const USER_SUB = { font:"400 12px/1.2 Montserrat,system-ui,sans-serif", color:"#64748b" };
const ROW_RIGHT = { display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" };

/* Botóns inline na etiqueta do usuario */
const BTN_SMALL = { borderRadius:10, padding:"7px 12px", font:"700 12px/1.05 Montserrat,system-ui,sans-serif", cursor:"pointer", border:"1px solid transparent" };
const BTN_SMALL_SEC = { ...BTN_SMALL, background:"#fff", border:"1px solid #e2e8f0", color:"#0f172a" };
const BTN_SMALL_PRI = { ...BTN_SMALL, background:"linear-gradient(180deg,#38bdf8,#0ea5e9)", color:"#fff", border:"1px solid #0ea5e9", boxShadow:"0 3px 10px rgba(14,165,233,.20)" };
const BTN_SMALL_PRI_DISABLED = { ...BTN_SMALL_PRI, opacity:.5, cursor:"not-allowed", boxShadow:"none" };

/* Panel cruce por usuario */
const CROSS_WRAP = { marginTop: 8, border:"1px solid #e2e8f0", borderRadius:12, background:"#ffffff", padding:10 };

/* Layout columnas (desktop 3 columnas; móbil apiladas) */
const threeColStyle = (minPx, isMobile) =>
  isMobile
    ? { display:"grid", gridTemplateColumns:"1fr", gap:10, alignItems:"start" }
    : { display:"grid", gridTemplateColumns:`repeat(3, minmax(${minPx}px, 1fr))`, gap:12, alignItems:"start" };

/* Columnas opacas */
const COL_BASE = { border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden" };
const COL_BG_ALI = { background:"#e9f9f2" }; // verde
const COL_BG_OFI = { background:"#fff5e7" }; // ámbar
const COL_BG_ACE = { background:"#ffe9e9" }; // vermello

const COL_HEAD = { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", background:"#f1f5f9", borderBottom:"1px solid #e2e8f0" };
const COL_TITLE = { font:"700 12px/1.05 Montserrat,system-ui,sans-serif", color:"#0f172a" };
const COUNT = { font:"700 11.5px/1.05 Montserrat,system-ui,sans-serif", color:"#22c55e" };
const COUNT_RED = { ...COUNT, color:"#ef4444" };
const scrollStyle = () => ({ maxHeight: "none", overflow:"visible", background:"inherit" });

/* Filas ultra compactas */
const ROW_PLAYER = { display:"grid", gridTemplateColumns:"16px 1fr", gap:3, alignItems:"center", padding:"2px 6px", borderBottom:"1px solid #f1f5f9", minWidth:0 };
const ROW_PLAYER_NOCHK = { display:"grid", gridTemplateColumns:"1fr", gap:3, alignItems:"center", padding:"2px 6px", borderBottom:"1px solid #f1f5f9", minWidth:0 };
const playerNameStyle = () => ({ font:"500 11.5px/1.02 Montserrat,system-ui,sans-serif", color:"#0f172a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" });

/* Separador + sticky */
const POS_SEP = { height:1, background:"#e5e7eb", margin:"3px 6px" };
const POS_TAG_BASE = { font:"700 10px/1 Montserrat,system-ui,sans-serif", color:"#64748b", padding:"5px 8px" };
const POS_TAG_STICKY = (bg) => ({ ...POS_TAG_BASE, position:"sticky", top:0, zIndex:2, background:bg, borderBottom:"1px solid #e2e8f0" });

/* Mensaxes */
const EMPTY = { marginTop:8, padding:"10px 12px", borderRadius:10, background:"#ecfeff", border:"1px solid #67e8f9", color:"#0e7490", font:"600 13px/1.2 Montserrat,system-ui,sans-serif" };
const ERR = { ...EMPTY, background:"#fee2e2", border:"1px solid #fecaca", color:"#b91c1c" };

/* ===== Utils ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const sortDescByDate = (a, b) => (b.match_iso ? new Date(b.match_iso).getTime() : -Infinity) - (a.match_iso ? new Date(a.match_iso).getTime() : -Infinity);
const dmy = (iso) => { if (!iso) return "—"; const d = new Date(iso); return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`; };

/* Corrección xogador Joel→Yoel DEF */
function normalizePlayer(p) {
  let nombre = p.nombre || "";
  let pos = p.pos || null;
  if (nombre.trim().toLowerCase() === "joel lago") {
    nombre = "Yoel Lago";
    pos = "DEF";
  }
  return { ...p, nombre, pos };
}

/* Demarcación desde foto_url */
function inferPosFromFoto(url = "") {
  const m = url.match(/-(POR|DEF|CEN|DEL)\.(?:jpg|jpeg|png|webp)$/i);
  return m ? m[1].toUpperCase() : "CEN";
}

/* Medición ancho etiqueta */
function measureLongestLabelPx(players) {
  if (typeof document === "undefined") return 260;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = "500 11.5px Montserrat,system-ui,sans-serif";
  let max = 0;
  for (const p of players || []) {
    const w = ctx.measureText(p?.label || "").width;
    if (w > max) max = w;
  }
  return Math.ceil(max + 16 + 6 + 16);
}

/* Agrupación POR→DEF→CEN→DEL */
const POS_ORDER = ["POR", "DEF", "CEN", "DEL"];
function groupByPos(players) {
  const buckets = { POR: [], DEF: [], CEN: [], DEL: [] };
  for (const p of players || []) {
    const k = (p.pos || "CEN").toUpperCase();
    if (buckets[k]) buckets[k].push(p); else buckets.CEN.push(p);
  }
  POS_ORDER.forEach(k => buckets[k].sort((a,b) => (a.dorsal ?? 999) - (b.dorsal ?? 999)));
  return buckets;
}

/* Bip curto */
function bip() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    o.start(); o.stop(ctx.currentTime + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
  } catch {}
}

export default function ResultadosHistoricos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 560);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // edición por partido
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [users, setUsers] = useState([]);
  const [players, setPlayers] = useState([]);

  // borradores (por matchId -> userId -> rec) e confirmados (para o ollo)
  const [resultsDraft, setResultsDraft] = useState({});
  const [resultsConfirmed, setResultsConfirmed] = useState({});

  const [openUserPanel, setOpenUserPanel] = useState(null);
  const [selPlantilla, setSelPlantilla] = useState(new Set());
  const [selOnce, setSelOnce] = useState(new Set());

  // visor de resultados (ollo) e info móbil
  const [openResultsMatchId, setOpenResultsMatchId] = useState(null);
  const [openInfoMatchId, setOpenInfoMatchId] = useState(null);

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

  // carga lista de partidos e deixa listo
  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(""); setLoading(true);
      try {
        await resolveAdmin();

        const { data, error } = await supabase
          .from("matches_finalizados")
          .select("id,equipo1,equipo2,match_iso");
        if (error) throw error;

        const norm = (data||[]).map(r => ({
          id: r.id ?? null,
          equipo1: (r.equipo1 || "").toUpperCase(),
          equipo2: (r.equipo2 || "").toUpperCase(),
          match_iso: r.match_iso || null,
        })).sort(sortDescByDate);

        if (alive) setRows(norm);
      } catch (e) {
        console.error("Historico load:", e);
        if (alive) setErr("Produciuse un erro ao cargar o histórico.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // carga usuarios e xogadores ao abrir edición
  async function onOpenEdit(matchId) {
    if (!isAdmin) return;
    setEditingMatchId(cur => (cur === matchId ? null : matchId));
    setOpenUserPanel(null);
    setSelPlantilla(new Set());
    setSelOnce(new Set());
    setOpenInfoMatchId(null);

    try {
      const { data: usersData, error: usersErr } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true, nullsFirst: false });
      if (usersErr) throw usersErr;
      setUsers((usersData||[]).map(u => ({
        id: u.id,
        name: (u.full_name || u.email || "").trim() || u.id,
        email: u.email || "",
      })));
    } catch (e) {
      console.error("Load users error:", e);
      setUsers([]);
    }

    if (!players.length) {
      try {
        const { data: playersData, error: playersErr } = await supabase
          .from("jugadores")
          .select("id, nombre, dorsal, foto_url");
        if (playersErr) throw playersErr;
        setPlayers((playersData||[]).map(pp => {
          const p = normalizePlayer(pp);
          const pos = p.pos || inferPosFromFoto(p.foto_url || "");
          return {
            id: p.id,
            dorsal: p.dorsal ?? null,
            pos,
            label: p.dorsal ? `${p.dorsal} - ${p.nombre}` : (p.nombre || "—"),
          };
        }));
      } catch (e) {
        console.error("Load players error:", e);
        setPlayers([]);
      }
    }

    // carga confirmados xa existentes para o ollo deste partido
    await loadConfirmedForMatch(matchId);
  }

  async function loadConfirmedForMatch(matchId) {
    try {
      const { data, error } = await supabase
        .from("resultados_confirmados")
        .select("user_id, confirmed_at, acertos, plantilla_ids, once_ids")
        .eq("match_id", matchId)
        .order("confirmed_at", { ascending: false });
      if (error) throw error;

      const arr = (data||[]).map(rec => {
        const u = users.find(x => x.id === rec.user_id);
        return {
          whenISO: rec.confirmed_at,
          userId: rec.user_id,
          userName: u?.name || rec.user_id,
          acertos: rec.acertos,
          plantillaIds: rec.plantilla_ids || [],
          onceIds: rec.once_ids || [],
        };
      });
      setResultsConfirmed(prev => ({ ...prev, [matchId]: arr }));
    } catch (e) {
      console.error("loadConfirmedForMatch error:", e);
    }
  }

  function toggleSel(which, pid) {
    if (which === "plantilla") {
      const next = new Set(selPlantilla);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      setSelPlantilla(next);
    } else {
      const next = new Set(selOnce);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      setSelOnce(next);
    }
  }

  function cruzarNow(matchId, userId, userName) {
    if (selPlantilla.size !== 11 || selOnce.size !== 11) return;
    bip();
    const onceSet = new Set(selOnce);
    const plantillaSet = new Set(selPlantilla);
    let acertos = 0;
    onceSet.forEach(id => { if (plantillaSet.has(id)) acertos++; });

    setResultsDraft(prev => {
      const nxt = { ...prev };
      if (!nxt[matchId]) nxt[matchId] = {};
      nxt[matchId][userId] = {
        userId, userName, acertos,
        plantillaIds: Array.from(plantillaSet),
        onceIds: Array.from(onceSet),
      };
      return nxt;
    });
  }

  async function confirmarMatch(matchId) {
    const draft = resultsDraft[matchId] || {};
    const userIds = Object.keys(draft);
    if (userIds.length === 0) return;

    const confirmedAtISO = new Date().toISOString();

    try {
      // upsert por (match_id,user_id) → última confirmación vence
      const payload = userIds.map(uid => ({
        match_id: matchId,
        user_id: draft[uid].userId,
        confirmed_at: confirmedAtISO,
        acertos: draft[uid].acertos,
        plantilla_ids: draft[uid].plantillaIds,
        once_ids: draft[uid].onceIds,
        updated_at: confirmedAtISO,
      }));

      const { error } = await supabase
        .from("resultados_confirmados")
        .upsert(payload, { onConflict: "match_id,user_id" });
      if (error) throw error;

      // refresca confirmados dende DB para o ollo
      await loadConfirmedForMatch(matchId);

      // pecha edición e limpa borrador local
      setEditingMatchId(null);
      setOpenUserPanel(null);
      setSelPlantilla(new Set());
      setSelOnce(new Set());
      setResultsDraft(prev => ({ ...prev, [matchId]: {} }));
      alert("Resultados confirmados e gardados.");
    } catch (e) {
      console.error("confirmarMatch error:", e);
      alert("Erro gardando resultados confirmados.");
    }
  }

  const colMinPx = useMemo(() => {
    if (!players || players.length === 0) return 240;
    return Math.max(220, measureLongestLabelPx(players));
  }, [players]);

  const view = useMemo(() => rows, [rows]);

  /* ===== Render agrupado por demarcación ===== */
  function renderGroupedList(opts) {
    const {
      list,
      withCheckbox = true,
      checkedSet = new Set(),
      onToggle = () => {},
      onlyIds = null,
      aciertosBaseSet = null,
      stickyBg = "#fff"
    } = opts;

    const buckets = groupByPos(list);

    const makeRow = (p) => {
      const isOK = aciertosBaseSet ? aciertosBaseSet.has(p.id) : false;
      const nameStyle = {
        ...playerNameStyle(),
        fontWeight: isOK ? 700 : 500,
        color: isOK ? "#0ea5e9" : "#0f172a"
      };
      if (withCheckbox) {
        const isChecked = checkedSet.has(p.id);
        return (
          <label key={p.id} style={ROW_PLAYER}>
            <input type="checkbox" checked={isChecked} onChange={()=> onToggle(p.id)} aria-label={`Seleccionar ${p.label}`} />
            <span style={playerNameStyle()}>{p.label}</span>
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
      if (onlyIds) {
        const only = new Set(onlyIds);
        group = group.filter(p => only.has(p.id));
      }
      if (group.length === 0) return;

      sections.push(<div key={`tag-${k}`} style={POS_TAG_STICKY(stickyBg)}>{k}</div>);
      sections.push(<div key={`sep-${k}`} style={POS_SEP} />);
      group.forEach(p => sections.push(makeRow(p)));
    });
    return sections.length ? sections : (
      <div style={{ ...ROW_PLAYER_NOCHK }}>
        <span style={playerNameStyle()}>Sen elementos</span>
      </div>
    );
  }

  /* ===== Visor de resultados (OLL0) — confirmados ===== */
  function renderResultsViewer(matchId) {
    const rowsC = resultsConfirmed[matchId] || [];
    if (rowsC.length === 0) {
      return <div style={EMPTY}>Aínda non hai resultados confirmados para este partido.</div>;
    }

    const playersById = new Map(players.map(p => [p.id, p]));
    const renderLineaPresentada = (rec) => {
      const labels = (rec.plantillaIds || []).map(pid => {
        const p = playersById.get(pid);
        const label = p ? p.label : "—";
        const isOK = (rec.onceIds || []).includes(pid);
        return isOK ? <strong style={{ color:"#0ea5e9" }}>{label}</strong> : <span>{label}</span>;
      });
      const out = [];
      labels.forEach((node, idx) => { out.push(node); if (idx < labels.length - 1) out.push(<span style={{ opacity:.6 }}> {" | "} </span>); });
      return out;
    };

    return (
      <div style={{ marginTop:8, border:"1px solid #e5e7eb", borderRadius:12, background:"#fff", padding:10 }}>
        <div style={{ font:"700 13.5px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", marginBottom:8 }}>
          ACERTOS POR USUARIA/O (confirmados)
        </div>
        <div role="table" style={{ width:"100%", font:"500 12.5px/1.3 Montserrat,system-ui,sans-serif" }}>
          <div role="row" style={{ display:"grid", gridTemplateColumns:"160px 1fr 70px 2fr", gap:10, padding:"6px 8px", borderBottom:"1px solid #e5e7eb", color:"#0f172a", fontWeight:700 }}>
            <div>Data e hora</div><div>HDC Peñista</div><div>Acertos</div><div>Aliñación presentada</div>
          </div>
          {rowsC.map((rec, idx) => (
            <div key={`${rec.userId}-${idx}`} role="row" style={{ display:"grid", gridTemplateColumns:"160px 1fr 70px 2fr", gap:10, padding:"6px 8px", borderBottom:"1px solid #f1f5f9" }}>
              <div>{dmy(rec.whenISO)} {new Date(rec.whenISO).toLocaleTimeString("gl-ES", {hour:"2-digit", minute:"2-digit", hour12:false})}</div>
              <div>{rec.userName}</div>
              <div><strong style={{ color:"#0ea5e9" }}>{rec.acertos}</strong></div>
              <div>{renderLineaPresentada(rec)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const MOBILE_INFO_TEXT = "A función de edición destas táboas é exclusiva das persoas administradoras da App, e só é operativa mediante a icona de teclado que verás na versión de ordenador de sobremesa.";

  return (
    <main style={WRAP}>
      <h2 style={PAGE_HEAD}>HISTÓRICO DE RESULTADOS</h2>
      <p style={PAGE_SUB}>Índice dos partidos rematados (máis recente → máis antigo).</p>

      {err && <div style={ERR} role="status" aria-live="polite">{err}</div>}
      {!err && loading && <div style={EMPTY} role="status" aria-live="polite">Cargando…</div>}
      {!err && !loading && view.length === 0 && (
        <div style={EMPTY} role="status" aria-live="polite">Non hai partidos rematados aínda.</div>
      )}

      {!err && !loading && view.length > 0 && (
        <ul style={LIST} aria-label="Lista de partidos rematados">
          {view.map((r, i) => {
            const isEditing = editingMatchId === r.id;
            const isResultsOpen = openResultsMatchId === r.id;
            const isInfoOpen = openInfoMatchId === r.id;

            const draftForMatch = resultsDraft[r.id] || {};
            const canConfirm = Object.keys(draftForMatch).length > 0;

            return (
              <li key={`${r.id ?? r.match_iso ?? "noid"}-${i}`} style={{ ...ITEM, marginBottom: (isEditing || isResultsOpen || isInfoOpen) ? 12 : 8 }}>
                <span style={DATE}>{dmy(r.match_iso)}</span>
                <span style={TEAMS}>{r.equipo1 || "—"} <span style={SEP}>-</span> {r.equipo2 || "—"}</span>
                <div style={ACTIONS}>
                  {isAdmin && !isMobile && (
                    <button type="button" style={ICONBTN} title={isEditing ? "Pechar edición" : "Editar partido"} aria-label={isEditing ? "Pechar edición" : "Editar partido"} onClick={()=> onOpenEdit(r.id)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
                    </button>
                  )}
                  {isAdmin && isMobile && (
                    <button type="button" style={ICONBTN} title={isInfoOpen ? "Pechar info" : "Información de edición"} aria-label={isInfoOpen ? "Pechar info" : "Información de edición"} onClick={()=> setOpenInfoMatchId(cur => cur === r.id ? null : r.id)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><circle cx="12" cy="12" r="10" /><path d="M12 8h.01M11 12h2v4h-2z" /></svg>
                    </button>
                  )}
                  <button type="button" style={ICONBTN} title={isResultsOpen ? "Pechar resultados" : "Ver resultados do partido"} aria-label={isResultsOpen ? "Pechar resultados" : "Ver resultados do partido"} onClick={async ()=>{
                    setOpenResultsMatchId(cur => cur === r.id ? null : r.id);
                    await loadConfirmedForMatch(r.id);
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}><path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  </button>
                </div>

                {isInfoOpen && (
                  <div style={{ marginTop:8, border:"1px solid #e2e8f0", borderRadius:10, background:"#fff", padding:"10px 12px", position:"relative" }}>
                    <button type="button" aria-label="Pechar" onClick={()=> setOpenInfoMatchId(null)} style={{ position:"absolute", top:6, right:6, width:28, height:28, borderRadius:8, border:"1px solid #e2e8f0", background:"#fff", display:"grid", placeItems:"center", cursor:"pointer" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" style={SVGI}><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                    <p style={{ margin:0, paddingRight:32, font:"500 13px/1.25 Montserrat,system-ui,sans-serif", color:"#0f172a" }}>
                      A función de edición destas táboas é exclusiva das persoas administradoras da App, e só é operativa mediante a icona de teclado que verás na versión de ordenador de sobremesa.
                    </p>
                  </div>
                )}

                {isResultsOpen && renderResultsViewer(r.id)}

                {isEditing && isAdmin && !isMobile && (
                  <section style={EDIT_WRAP} aria-label="Edición do partido: selección de usuarias/os">
                    {users.length === 0 ? (
                      <div style={EMPTY}>Cargando usuarias/os…</div>
                    ) : (
                      <ul style={USERS_LIST}>
                        {users.map(u => {
                          const isOpenUser = openUserPanel === u.id;
                          const canCruzar = selPlantilla.size === 11 && selOnce.size === 11;
                          const draftUser = (resultsDraft[r.id]||{})[u.id] || null;

                          return (
                            <li key={u.id} style={USER_ROW}>
                              <div>
                                <div style={USER_NAME}>{u.name}</div>
                                <div style={USER_SUB}>{u.email}</div>
                              </div>
                              <div style={ROW_RIGHT}>
                                <button type="button" style={{ ...ICONBTN, borderColor: isOpenUser ? "#fecaca" : "#bae6fd", background:"#fff" }} title={isOpenUser ? "Pechar cruce" : "Editar / cruzar"} aria-label={isOpenUser ? "Pechar cruce" : "Editar / cruzar"} onClick={()=>{
                                  const opening = openUserPanel !== u.id;
                                  setOpenUserPanel(opening ? u.id : null);
                                  setSelPlantilla(new Set()); setSelOnce(new Set());
                                }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ ...SVGI, stroke: isOpenUser ? "#ef4444" : "#0ea5e9" }}>
                                    <rect x="3" y="5" width="18" height="14" rx="2" />
                                    <path d="M7 9h2M11 9h2M15 9h2M7 13h10M7 17h6" />
                                  </svg>
                                </button>

                                <button type="button" style={BTN_SMALL_SEC} onClick={()=>{
                                  if (openUserPanel === u.id) setOpenUserPanel(null);
                                  setSelPlantilla(new Set()); setSelOnce(new Set());
                                }}>Pechar</button>

                                <button type="button" style={canCruzar ? BTN_SMALL_PRI : BTN_SMALL_PRI_DISABLED} disabled={!canCruzar} onClick={()=>{
                                  cruzarNow(r.id, u.id, u.name);
                                }}>CRUZAR</button>
                              </div>

                              {isOpenUser && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <div style={CROSS_WRAP} role="region" aria-label={`Cruce para ${u.name}`}>
                                    {players.length === 0 ? (
                                      <div style={EMPTY}>Cargando xogadoras/es…</div>
                                    ) : (
                                      <>
                                        <div style={threeColStyle(colMinPx, false)}>
                                          <div style={{ ...COL_BASE, ...COL_BG_ALI, minWidth: `${colMinPx}px` }}>
                                            <div style={COL_HEAD}><span style={COL_TITLE}>ALIÑACIÓN REALIZADA</span><span style={COUNT}>{selPlantilla.size}/11</span></div>
                                            <div style={scrollStyle()}>
                                              {renderGroupedList({ list: players, withCheckbox: true, checkedSet: selPlantilla, onToggle: (id)=> toggleSel("plantilla", id), stickyBg: "#e9f9f2" })}
                                            </div>
                                          </div>

                                          <div style={{ ...COL_BASE, ...COL_BG_OFI, minWidth: `${colMinPx}px` }}>
                                            <div style={COL_HEAD}><span style={COL_TITLE}>ONCE OFICIAL</span><span style={COUNT}>{selOnce.size}/11</span></div>
                                            <div style={scrollStyle()}>
                                              {renderGroupedList({ list: players, withCheckbox: true, checkedSet: selOnce, onToggle: (id)=> toggleSel("once", id), stickyBg: "#fff5e7" })}
                                            </div>
                                          </div>

                                          <div style={{ ...COL_BASE, ...COL_BG_ACE, minWidth: `${colMinPx}px` }}>
                                            <div style={COL_HEAD}><span style={COL_TITLE}>ACERTOS DO PARTIDO</span><span style={COUNT_RED}>{Array.from(selOnce).filter(id => selPlantilla.has(id)).length}/11</span></div>
                                            <div style={scrollStyle()}>
                                              {renderGroupedList({
                                                list: players,
                                                withCheckbox: false,
                                                onlyIds: selOnce,
                                                aciertosBaseSet: new Set(Array.from(selOnce).filter(id => selPlantilla.has(id))),
                                                stickyBg: "#ffe9e9"
                                              })}
                                            </div>
                                            <div style={{ padding:10 }}>
                                              <button type="button" style={{ width:"100%", ...BTN_SMALL_PRI }} onClick={()=> confirmarMatch(r.id)} disabled={!canConfirm}>CONFIRMAR</button>
                                            </div>
                                          </div>
                                        </div>

                                        {draftUser && (
                                          <div style={{ marginTop:8, font:"600 12px/1.2 Montserrat,system-ui,sans-serif", color:"#0ea5e9" }}>
                                            Borrador cruzado para {u.name}: {draftUser.acertos}/11
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
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
