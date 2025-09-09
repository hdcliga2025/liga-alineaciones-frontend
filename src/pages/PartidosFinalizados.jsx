// src/pages/PartidosFinalizados.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos compartidos con Vindeiros ===== */
const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };
const PAGE_HEAD = { margin: "0 0 6px", font: "700 22px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const PAGE_SUB  = { margin: "0 0 16px", font: "400 13px/1.4 Montserrat,system-ui,sans-serif", color: "#475569" };
const CARD = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  background: "#f8fafc",
  padding: 12,
  boxShadow: "0 6px 18px rgba(0,0,0,.05)",
  marginBottom: 12,
};
const ROW = { display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, alignItems: "center" };
const NUMBOX = {
  minWidth: 34,
  height: 34,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  display: "grid",
  placeItems: "center",
  font: "700 14px/1 Montserrat,system-ui,sans-serif",
  color: "#0f172a",
};
const TOPFIELDS = { display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" };
const TEAMS = { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" };
const VS = { font: "700 14px/1 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const LUGAR = { font: "700 13px/1 Montserrat,system-ui,sans-serif", color: "#0f172a", textTransform: "uppercase" };
const BTM = { marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center" };
const INPUT = {
  width: "100%",
  borderRadius: 10,
  border: "1px solid #dbe2f0",
  background: "#fff",
  padding: "10px 12px",
  font: "800 14px/1.1 Montserrat,system-ui,sans-serif",
  color: "#0f172a",
  textTransform: "uppercase",
  outline: "none",
};
const INPUT_SOFT = { ...INPUT, fontWeight: 700, textTransform: "none" };
const SELECT = {
  ...INPUT,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  paddingRight: 36,
  cursor: "pointer",
};
const DATEBOX = { ...INPUT_SOFT, textTransform: "none" };
const TIMEBOX = { ...INPUT_SOFT, textTransform: "none" };
const ACTIONS = { display: "flex", gap: 8, justifySelf: "end" };
const ICONBTN = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};
const BADGE_SAVED = { border: "2px solid #0ea5e9", background: "#f1fafe" };
const ERRBAR = { margin: "10px 0", padding: "10px 12px", borderRadius: 10, background: "#fee2e2", color: "#991b1b", font: "600 13px/1.3 Montserrat,sans-serif" };

const SVGI = { fill: "none", stroke: "#0f172a", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };

const pad2 = (n) => String(n).padStart(2, "0");
function mapRow(raw) {
  const r = raw || {};
  const equipo1 = r.equipo1 || r.team1 || r.home || "";
  const equipo2 = r.equipo2 || r.team2 || r.away || "";
  const lugar   = r.lugar   || r.location || "";
  const comp    = r.competition || r.torneo || "";
  const match_iso = r.match_iso || r.match_datetime || (r.match_date ? new Date(r.match_date).toISOString() : null);
  return {
    id: r.id ?? null,
    equipo1, equipo2, lugar,
    competition: comp,
    match_iso,
    updated_at: r.updated_at || null,
  };
}
function sortDescByDate(a, b) {
  const ta = a.match_iso ? new Date(a.match_iso).getTime() : -Infinity;
  const tb = b.match_iso ? new Date(b.match_iso).getTime() : -Infinity;
  return tb - ta;
}
function dmyWithWeekday(isoLike, tz = "Europe/Madrid") {
  if (!isoLike) return "";
  const d = new Date(isoLike);
  try {
    const w = new Intl.DateTimeFormat("gl-ES", { weekday: "long", timeZone: tz }).format(d);
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    return `${w}, ${dd}/${mm}/${yyyy}`;
  } catch {
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}

export default function PartidosFinalizados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [editSet, setEditSet] = useState(() => new Set());
  const [local, setLocal] = useState({});

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const email = s?.session?.user?.email || "";
      const uid   = s?.session?.user?.id || null;
      let admin = false;
      if (email) {
        const e = email.toLowerCase();
        if (e === "hdcliga@gmail.com" || e === "hdcliga2@gmail.com") admin = true;
      }
      if (!admin && uid) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
        if ((prof?.role||"").toLowerCase() === "admin") admin = true;
      }
      setIsAdmin(admin);
      await loadList();
    })();
  }, []);

  async function loadList() {
    setErr("");
    try {
      const { data, error } = await supabase.from("matches_finalizados").select("*");
      if (error) throw error;
      const m = (data || []).map(mapRow).sort(sortDescByDate);
      setRows(m);
      setLocal({});
      setEditSet(new Set());
    } catch (e) {
      console.error(e);
      setErr("Erro cargando Finalizados.");
    }
  }

  function toggleEdit(id) {
    if (!isAdmin) return;
    const next = new Set(editSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setEditSet(next);
    if (id != null && !local[id]) {
      const r = rows.find(x => x.id === id) || {};
      const dt = r.match_iso ? new Date(r.match_iso) : null;
      const dateStr = dt ? `${dt.getFullYear()}-${pad2(dt.getMonth()+1)}-${pad2(dt.getDate())}` : "";
      const timeStr = dt ? `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}` : "";
      setLocal(prev => ({ ...prev, [id]: {
        equipo1: r.equipo1 || "", equipo2: r.equipo2 || "",
        lugar: r.lugar || "", competition: r.competition || "",
        dateStr, timeStr
      }}));
    }
  }

  function setDraft(id, patch) {
    setLocal(prev => ({ ...prev, [id]: { ...(prev[id]||{}), ...patch } }));
  }

  async function onBlurSave(id) {
    if (!isAdmin) return;
    const d = local[id]; if (!d) return;
    const eq1 = (d.equipo1||"").trim().toUpperCase();
    const eq2 = (d.equipo2||"").trim().toUpperCase();
    const lugar = (d.lugar||"").trim().toUpperCase();
    const comp = (d.competition||"").trim();
    const iso = (d.dateStr && d.timeStr) ? new Date(`${d.dateStr}T${d.timeStr}:00`).toISOString() : null;
    const patch = {
      equipo1: eq1 || null,
      equipo2: eq2 || null,
      lugar: lugar || null,
      competition: comp || null,
      ...(iso ? { match_iso: iso } : {}),
      updated_at: new Date().toISOString(),
    };
    try {
      const { error } = await supabase.from("matches_finalizados").update(patch).eq("id", id);
      if (error) throw error;
      await loadList();
    } catch (e) {
      console.error(e);
      setErr("Erro gardando cambios.");
    }
  }

  const view = useMemo(() => rows, [rows]);

  return (
    <main style={WRAP}>
      <h2 style={PAGE_HEAD}>PARTIDOS FINALIZADOS</h2>
      <p style={PAGE_SUB}>Listado dos encontros xa xogados polo Celta na tempada 2025/2026.</p>

      {err && <div style={ERRBAR}>{err}</div>}

      {view.map((r, idx) => {
        const inEdit = editSet.has(r.id);
        const d = local[r.id] || {};
        const n = String(idx + 1).padStart(2, "0");

        const isoShow = d.dateStr && d.timeStr ? new Date(`${d.dateStr}T${d.timeStr}:00`).toISOString() : r.match_iso;
        const niceDate = isoShow ? dmyWithWeekday(isoShow) : "—";

        const allDone = !!(r.equipo1 && r.equipo2 && r.lugar && r.competition && r.match_iso);

        return (
          <article key={r.id ?? `k-${idx}`} style={{ ...CARD, ...(allDone ? BADGE_SAVED : {}) }}>
            <div style={ROW}>
              <div style={NUMBOX}>{n}</div>

              <div style={TOPFIELDS}>
                <div style={TEAMS}>
                  {inEdit ? (
                    <>
                      <input
                        style={INPUT}
                        placeholder="EQUIPO 1"
                        value={d.equipo1 ?? r.equipo1 ?? ""}
                        onInput={(e)=> setDraft(r.id, { equipo1: e.currentTarget.value })}
                        onBlur={()=>onBlurSave(r.id)}
                      />
                      <span style={VS}>vs</span>
                      <input
                        style={INPUT}
                        placeholder="EQUIPO 2"
                        value={d.equipo2 ?? r.equipo2 ?? ""}
                        onInput={(e)=> setDraft(r.id, { equipo2: e.currentTarget.value })}
                        onBlur={()=>onBlurSave(r.id)}
                      />
                    </>
                  ) : (
                    <>
                      <div style={{ ...INPUT, border:"none", background:"transparent", padding:0 }}>{(r.equipo1||"").toUpperCase() || "—"}</div>
                      <span style={VS}>vs</span>
                      <div style={{ ...INPUT, border:"none", background:"transparent", padding:0 }}>{(r.equipo2||"").toUpperCase() || "—"}</div>
                    </>
                  )}
                </div>

                {inEdit ? (
                  <input
                    style={{ ...INPUT, width: 180 }}
                    placeholder="LUGAR"
                    value={(d.lugar ?? r.lugar ?? "").toUpperCase()}
                    onInput={(e)=> setDraft(r.id, { lugar: e.currentTarget.value })}
                    onBlur={()=>onBlurSave(r.id)}
                  />
                ) : (
                  <div style={LUGAR}>{(r.lugar||"").toUpperCase() || "—"}</div>
                )}
              </div>
            </div>

            <div style={BTM}>
              {inEdit ? (
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8 }}>
                  <input
                    type="date"
                    style={DATEBOX}
                    value={d.dateStr ?? ""}
                    onInput={(e)=> setDraft(r.id, { dateStr: e.currentTarget.value })}
                    onBlur={()=>onBlurSave(r.id)}
                  />
                  <input
                    type="time"
                    style={TIMEBOX}
                    value={d.timeStr ?? ""}
                    onInput={(e)=> setDraft(r.id, { timeStr: e.currentTarget.value })}
                    onBlur={()=>onBlurSave(r.id)}
                  />
                </div>
              ) : (
                <div style={{ ...DATEBOX, border:"none", background:"transparent", padding:0, fontWeight:800 }}>
                  {niceDate}
                </div>
              )}

              {inEdit ? (
                <select
                  style={SELECT}
                  value={d.competition ?? r.competition ?? ""}
                  onChange={(e)=> setDraft(r.id, { competition: e.currentTarget.value })}
                  onBlur={()=>onBlurSave(r.id)}
                >
                  <option value="">(selecciona)</option>
                  <option value="LaLiga">LaLiga</option>
                  <option value="Europa League">Europa League</option>
                  <option value="Copa do Rei">Copa do Rei</option>
                </select>
              ) : (
                <div style={{ ...INPUT, border:"none", background:"transparent", padding:0 }}>
                  {r.competition || "—"}
                </div>
              )}

              <div style={ACTIONS}>
                {/* Ojo */}
                <button
                  type="button"
                  style={ICONBTN}
                  title="Ver resultados da última aliñación"
                  onClick={()=> route("/resultados-ultima-alineacion")}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" style={SVGI} aria-hidden="true">
                    <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>

                {/* Editar (admin) */}
                {isAdmin && (
                  <button type="button" style={ICONBTN} title={inEdit ? "Pechar edición" : "Editar"} onClick={()=>toggleEdit(r.id)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" style={SVGI} aria-hidden="true">
                      {inEdit ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />}
                    </svg>
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
