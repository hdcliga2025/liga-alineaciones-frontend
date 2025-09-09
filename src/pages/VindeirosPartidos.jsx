// src/pages/VindeirosPartidos.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos (inspirados en el TOP_BOX de ProximoPartido) ===== */
const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };
const PAGE_HEAD = { margin: "0 0 10px", font: "700 22px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const PAGE_SUB  = { margin: "0 0 16px", font: "400 14px/1.4 Montserrat,system-ui,sans-serif", color: "#475569" };

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
const TEAMS = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  gap: 8,
  alignItems: "center",
};
const VS = { font: "700 14px/1 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const LUGAR = { font: "700 13px/1 Montserrat,system-ui,sans-serif", color: "#0f172a", textTransform: "uppercase" };

const BTM = {
  marginTop: 8,
  display: "grid",
  gridTemplateColumns: "1fr 1fr auto",
  gap: 8,
  alignItems: "center",
};

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
const DATEWRAP = { position: "relative" };
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

const BADGE_SAVED = { border: "2px solid #0ea5e9", background: "#f1fafe" }; // contorno celeste + fondo gris muy suave
const ERRBAR = { margin: "10px 0", padding: "10px 12px", borderRadius: 10, background: "#fee2e2", color: "#991b1b", font: "600 13px/1.3 Montserrat,sans-serif" };
const ADDWRAP = { display: "flex", alignItems: "center", gap: 10, margin: "10px 0 16px" };
const ADDBTN = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid #22c55e",
  background: "linear-gradient(180deg,#34d399,#22c55e)",
  color: "#fff",
  font: "800 13px/1 Montserrat,system-ui,sans-serif",
  letterSpacing: ".2px",
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(34,197,94,.30)",
};

const SVGI = { fill: "none", stroke: "#0f172a", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
const SVG_GREEN = { ...SVGI, stroke: "#16a34a" };

/* ===== Utils ===== */
const pad2 = (n) => String(n).padStart(2, "0");

function toISOFromParts(dateStr /* yyyy-mm-dd */, timeStr /* HH:MM */, tz = "Europe/Madrid") {
  if (!dateStr || !timeStr) return null;
  const iso = `${dateStr}T${timeStr}:00`;
  try {
    const dt = new Date(iso);
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  } catch {
    return null;
  }
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

function sortAscByDate(a, b) {
  const ta = a.match_iso ? new Date(a.match_iso).getTime() : Infinity;
  const tb = b.match_iso ? new Date(b.match_iso).getTime() : Infinity;
  return ta - tb;
}

/* ===== Página ===== */
export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [editSet, setEditSet] = useState(() => new Set()); // ids en edición
  const [local, setLocal] = useState({}); // id -> draft

  useEffect(() => {
    (async () => {
      // Admin?
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
      const { data, error } = await supabase.from("matches_vindeiros").select("*");
      if (error) throw error;
      const m = (data || []).map(mapRow).sort(sortAscByDate);
      setRows(m);
      setLocal({});
      setEditSet(new Set());
    } catch (e) {
      console.error(e);
      setErr("Erro cargando Vindeiros.");
    }
  }

  const view = useMemo(() => rows, [rows]);

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

  async function onAdd() {
    if (!isAdmin) return;
    setErr("");
    try {
      const tempId = `tmp_${Date.now()}`;
      setRows(prev => [{ id: tempId, equipo1:"", equipo2:"", lugar:"", competition:"", match_iso:null }, ...prev]);
      setEditSet(s => new Set([...s, tempId]));
      setLocal(prev => ({ ...prev, [tempId]: { equipo1:"", equipo2:"", lugar:"", competition:"", dateStr:"", timeStr:"" } }));
    } catch (e) {
      setErr("Erro engadindo.");
    }
  }

  async function onSave(id) {
    if (!isAdmin) return;
    const d = local[id] || {};
    const eq1 = ((d?.equipo1 ?? rows.find(x=>x.id===id)?.equipo1) || "").trim().toUpperCase();
    const eq2 = ((d?.equipo2 ?? rows.find(x=>x.id===id)?.equipo2) || "").trim().toUpperCase();
    const lugar = ((d?.lugar ?? rows.find(x=>x.id===id)?.lugar) || "").trim().toUpperCase();
    const comp = ((d?.competition ?? rows.find(x=>x.id===id)?.competition) || "").trim();
    const iso = (d?.dateStr && d?.timeStr) ? toISOFromParts(d.dateStr, d.timeStr) : (rows.find(x=>x.id===id)?.match_iso || null);

    if (!eq1 || !eq2 || !lugar || !comp || !iso) {
      if (!confirm("Faltan campos. ¿Gardar igualmente?")) return;
    } else {
      if (!confirm("Gardar cambios desta tarxeta?")) return;
    }
    setSavingId(id);
    setErr("");
    try {
      const payload = {
        equipo1: eq1 || null,
        equipo2: eq2 || null,
        lugar:   lugar || null,
        competition: comp || null,
        match_iso: iso || null,
        updated_at: new Date().toISOString(),
      };

      if (String(id).startsWith("tmp_") || id == null) {
        const { data, error } = await supabase.from("matches_vindeiros").insert(payload).select("*").single();
        if (error) throw error;
        setRows(prev => {
          const others = prev.filter(x => x.id !== id);
          return [mapRow(data), ...others].sort(sortAscByDate);
        });
        setLocal(prev => { const c = { ...prev }; delete c[id]; c[data.id] = { ...d }; return c; });
        toggleEdit(id);
        toggleEdit(data.id);
      } else {
        const { error } = await supabase.from("matches_vindeiros").update(payload).eq("id", id);
        if (error) throw error;
        await loadList();
      }
    } catch (e) {
      console.error(e);
      setErr("Erro gardando cambios.");
    } finally {
      setSavingId(null);
    }
  }

  async function onPromote(id) {
    if (!isAdmin) return;
    const d = local[id] || {};
    const base = rows.find(x => x.id === id) || {};
    const eq1 = ((d?.equipo1 ?? base.equipo1) || "").trim().toUpperCase();
    const eq2 = ((d?.equipo2 ?? base.equipo2) || "").trim().toUpperCase();
    const lugar = ((d?.lugar ?? base.lugar) || "").trim().toUpperCase();
    const comp  = ((d?.competition ?? base.competition) || "").trim();
    const iso   = (d?.dateStr && d?.timeStr) ? toISOFromParts(d.dateStr, d.timeStr) : (base.match_iso || null);

    if (!eq1 || !eq2 || !lugar || !comp || !iso) {
      alert("Completa Equipo 1, Equipo 2, Lugar, Data e Competición antes de subir a Próximo Partido.");
      return;
    }
    if (!confirm("Subir este partido a 'Próximo Partido'? Isto borrará a tarxeta de Vindeiros.")) return;

    setSavingId(id);
    setErr("");
    try {
      const payload = {
        id: 1,
        equipo1: eq1,
        equipo2: eq2,
        lugar,
        competition: comp || null,
        match_iso: iso,
        tz: "Europe/Madrid",
        updated_at: new Date().toISOString(),
      };
      const { error: upErr } = await supabase.from("next_match").upsert(payload, { onConflict: "id" });
      if (upErr) throw upErr;

      const { error: delErr } = await supabase.from("matches_vindeiros").delete().eq("id", id);
      if (delErr) throw delErr;

      await loadList();
    } catch (e) {
      console.error(e);
      setErr("Erro subindo a Próximo Partido.");
    } finally {
      setSavingId(null);
    }
  }

  function hasAllFields(r, d) {
    const eq1   = (((d?.equipo1 ?? r.equipo1) || "")).trim();
    const eq2   = (((d?.equipo2 ?? r.equipo2) || "")).trim();
    const lugar = (((d?.lugar   ?? r.lugar)   || "")).trim();
    const comp  = (((d?.competition ?? r.competition) || "")).trim();
    const iso   = d?.dateStr && d?.timeStr ? toISOFromParts(d.dateStr, d.timeStr) : (r.match_iso || "");
    return !!(eq1 && eq2 && lugar && comp && iso);
  }

  return (
    <main style={WRAP}>
      <h2 style={PAGE_HEAD}>Vindeiros partidos</h2>
      <p style={PAGE_SUB}>Próximos partidos a xogar polo Celta con data programada.</p>

      {isAdmin && (
        <div style={ADDWRAP}>
          <button type="button" style={ADDBTN} onClick={onAdd}>
            Engadir outro partido
          </button>
        </div>
      )}

      {err && <div style={ERRBAR}>{err}</div>}

      {view.map((r, idx) => {
        const inEdit = editSet.has(r.id);
        const d = local[r.id] || {};
        const showSavedStyle = hasAllFields(r, d);
        const n = String(idx + 1).padStart(2, "0");

        const isoShow = d.dateStr && d.timeStr ? toISOFromParts(d.dateStr, d.timeStr) : r.match_iso;
        const niceDate = isoShow ? dmyWithWeekday(isoShow) : "—";

        return (
          <article key={r.id ?? `k-${idx}`} style={{ ...CARD, ...(showSavedStyle ? BADGE_SAVED : {}) }}>
            <div style={ROW}>
              <div style={NUMBOX}>{n}</div>

              <div style={TOPFIELDS}>
                {/* Equipos */}
                <div style={TEAMS}>
                  {inEdit ? (
                    <>
                      <input
                        style={INPUT}
                        placeholder="EQUIPO 1"
                        value={d.equipo1 ?? r.equipo1 ?? ""}
                        onInput={(e)=> setDraft(r.id, { equipo1: e.currentTarget.value })}
                      />
                      <span style={VS}>vs</span>
                      <input
                        style={INPUT}
                        placeholder="EQUIPO 2"
                        value={d.equipo2 ?? r.equipo2 ?? ""}
                        onInput={(e)=> setDraft(r.id, { equipo2: e.currentTarget.value })}
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

                {/* Lugar */}
                {inEdit ? (
                  <input
                    style={{ ...INPUT, width: 180 }}
                    placeholder="LUGAR"
                    value={(d.lugar ?? r.lugar ?? "").toUpperCase()}
                    onInput={(e)=> setDraft(r.id, { lugar: e.currentTarget.value })}
                  />
                ) : (
                  <div style={LUGAR}>{(r.lugar||"").toUpperCase() || "—"}</div>
                )}
              </div>
            </div>

            {/* Fila inferior: Data + Competición + acciones */}
            <div style={BTM}>
              {/* Data */}
              {inEdit ? (
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8 }}>
                  <div style={DATEWRAP}>
                    <input
                      type="date"
                      style={DATEBOX}
                      value={d.dateStr ?? ""}
                      onInput={(e)=> setDraft(r.id, { dateStr: e.currentTarget.value })}
                    />
                  </div>
                  <input
                    type="time"
                    style={TIMEBOX}
                    value={d.timeStr ?? ""}
                    onInput={(e)=> setDraft(r.id, { timeStr: e.currentTarget.value })}
                  />
                </div>
              ) : (
                <div style={{ ...DATEBOX, border:"none", background:"transparent", padding:0, fontWeight:800 }}>
                  {niceDate}
                </div>
              )}

              {/* Competición */}
              {inEdit ? (
                <select
                  style={SELECT}
                  value={d.competition ?? r.competition ?? ""}
                  onChange={(e)=> setDraft(r.id, { competition: e.currentTarget.value })}
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

              {/* Acciones */}
              <div style={ACTIONS}>
                {/* Editar (admin) */}
                {isAdmin && (
                  <button type="button" style={ICONBTN} title={inEdit ? "Pechar edición" : "Editar"} onClick={()=>toggleEdit(r.id)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" style={SVGI} aria-hidden="true">
                      {inEdit ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />}
                    </svg>
                  </button>
                )}

                {/* Guardar (admin, confirm) */}
                {isAdmin && inEdit && (
                  <button type="button" style={ICONBTN} title="Gardar cambios" onClick={()=>onSave(r.id)} disabled={savingId===r.id}>
                    <svg width="22" height="22" viewBox="0 0 24 24" style={SVGI} aria-hidden="true">
                      <path d="M4 4h12l4 4v12H4z" />
                      <path d="M8 4v6h8V4" />
                      <path d="M8 20v-6h8v6" />
                    </svg>
                  </button>
                )}

                {/* Flecha (promote a Próximo Partido) */}
                {isAdmin && (
                  <button type="button" style={ICONBTN} title="Subir a Próximo Partido" onClick={()=>onPromote(r.id)} disabled={savingId===r.id}>
                    <svg width="22" height="22" viewBox="0 0 24 24" style={SVG_GREEN} aria-hidden="true">
                      <path d="M12 19V5" />
                      <path d="M5 12l7-7 7 7" />
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
