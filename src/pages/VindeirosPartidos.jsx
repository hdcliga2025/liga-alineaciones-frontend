import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Helpers ===== */
const COMP_OPTIONS = ["LaLiga", "Europa League", "Copa do Rei"];
const COMP_MIN_CH = Math.max(...COMP_OPTIONS.map((s) => s.length));
const lcKey = "hdc_vindeiros_cards_v11";

const toISODate = (d) => {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const da = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  } catch { return ""; }
};
const toMidnightISO = (yyyy_mm_dd) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(yyyy_mm_dd || "").trim());
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T00:00:00`;
};
const dateMs = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd) return Infinity;
  const d = new Date(`${yyyy_mm_dd}T00:00:00Z`);
  const ms = d.getTime();
  return Number.isNaN(ms) ? Infinity : ms;
};
const isComplete = (r) => Boolean(r.team1 && r.team2 && r.date_iso && r.competition);

/* ===== Estilos ===== */
const WRAP = { maxWidth: 1080, margin: "0 auto", padding: "16px 12px 24px" };
const H1 = { font: "700 20px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a", margin: "0 0 8px" };
const SUB = { color: "#475569", font: "400 13px/1.3 Montserrat,system-ui,sans-serif", margin: "0 0 14px" };

const CARD_BASE = (saved) => ({
  background: saved ? "linear-gradient(180deg, rgba(14,165,233,.08), rgba(14,165,233,.02))" : "#f8fafc",
  border: `2px solid ${saved ? "#0ea5e9" : "#e5e7eb"}`,
  borderRadius: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: 12,
  marginBottom: 12,
  transition: "border-color .25s ease, background .25s ease",
});

const FIRST_LINE = { marginBottom: 10 };
const MATCH_CELL = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #dbe2f0",
  borderRadius: 12,
  background: "#fff",
  overflow: "hidden",
};
const NUMBOX = (h, f) => ({
  marginLeft: 8,
  marginRight: 6,
  minWidth: h,
  height: h,
  borderRadius: 6,
  background: "#e2e8f0",
  color: "#0f172a",
  display: "grid",
  placeItems: "center",
  font: `800 ${f}px/1 Montserrat,system-ui,sans-serif`,
  padding: "0 8px",
  border: "1px solid transparent",
});
const TEAM_INPUT = (f, pad) => ({
  flex: "1 1 auto",
  minWidth: 40,
  padding: pad,
  border: "none",
  outline: "none",
  font: `700 ${f}px/1.2 Montserrat,system-ui,sans-serif`,
  color: "#0f172a",
  background: "transparent",
  minHeight: 40,
});
const VS = (f) => ({ padding: "0 10px", font: `800 ${f}px/1 Montserrat,system-ui,sans-serif`, color: "#334155" });

const SECOND_LINE = (desktop) => ({
  display: "grid",
  gridTemplateColumns: desktop ? "auto auto 1fr" : "auto auto 1fr",
  gap: desktop ? 40 : 8,
  alignItems: "center",
});

const DATE_WRAP = {
  display: "inline-grid",
  gridTemplateColumns: "auto auto",
  alignItems: "center",
  gap: 6,
  border: "1px solid #dbe2f0",
  borderRadius: 10,
  padding: "8px 10px",
  background: "#fff",
};
const DATE_ICON_GRAY = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ stroke: "#94a3b8", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M7 2.5v4M17 2.5v4M3 9h18" />
  </svg>
);

const CHIP_BASE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid #dbe2f0",
  padding: "8px 10px",
  borderRadius: 10,
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
  font: "700 13px/1.2 Montserrat,system-ui,sans-serif",
  color: "#0f172a",
  cursor: "pointer",
  minWidth: `${COMP_MIN_CH + 6}ch`,
  whiteSpace: "nowrap",
  height: 38,
};
const ICON_TROPHY = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ stroke: "#0ea5e9", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
    <path d="M7 4h10v3a5 5 0 01-10 0V4Z" />
    <path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" />
    <path d="M9 14h6v3H9z" />
  </svg>
);

/* oculta icono nativo date */
const HIDE_NATIVE_DATE = `
  .hdc-date::-webkit-calendar-picker-indicator{ opacity:0; display:none; }
  .hdc-date::-webkit-inner-spin-button{ display:none; }
  .hdc-date{ -webkit-appearance:none; appearance:none; }
`;

/* ===== Página ===== */
export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // {id,date_iso,team1,team2,competition,saved}
  const [loading, setLoading] = useState(true);
  const [menuAt, setMenuAt] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  const saveTimers = useRef({});
  const dbEnabledRef = useRef(true);
  const limit = 10;

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const email = s?.session?.user?.email || "";
      const uid = s?.session?.user?.id || null;
      let admin = false;
      if (email) {
        const e = email.toLowerCase();
        if (e === "hdcliga@gmail.com" || e === "hdcliga2@gmail.com") admin = true;
      }
      if (!admin && uid) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
        if ((prof?.role || "").toLowerCase() === "admin") admin = true;
      }
      if (alive) setIsAdmin(admin);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 560);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  function makePlaceholders(n = limit) {
    return Array.from({ length: n }, () => ({
      id: null, date_iso: "", team1: "", team2: "", competition: "", saved: false
    }));
  }

  async function loadFromDB() {
    try {
      const { data, error } = await supabase
        .from("matches_vindeiros")
        .select("id, match_date, team1, team2, competition, updated_at")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const mapped = (data || []).map((r) => ({
        id: r.id,
        date_iso: r.match_date ? toISODate(r.match_date) : "",
        team1: (r.team1 || "").toUpperCase(),
        team2: (r.team2 || "").toUpperCase(),
        competition: r.competition || "",
        saved: isComplete({
          date_iso: r.match_date ? toISODate(r.match_date) : "",
          team1: r.team1,
          team2: r.team2,
          competition: r.competition,
        }),
      }));
      dbEnabledRef.current = true;
      const base = mapped.length ? mapped : makePlaceholders();
      setRows(sortByDateAsc(base));
    } catch {
      dbEnabledRef.current = false;
      try {
        const raw = localStorage.getItem(lcKey);
        const parsed = raw ? JSON.parse(raw) : [];
        const base = Array.isArray(parsed) && parsed.length ? parsed.slice(0, limit) : makePlaceholders();
        setRows(sortByDateAsc(base));
      } catch { setRows(makePlaceholders()); }
    } finally { setLoading(false); }
  }
  useEffect(() => {
    loadFromDB();
    const onVis = () => !document.hidden && loadFromDB();
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, []);

  function saveToLC(next) { try { localStorage.setItem(lcKey, JSON.stringify(next)); } catch {} }
  const sortByDateAsc = (arr) => { const out = arr.slice(); out.sort((a,b)=>dateMs(a.date_iso)-dateMs(b.date_iso)); return out; };

  function updateRow(idx, patch) {
    if (!isAdmin) return;
    setRows((prev) => {
      const next = prev.slice();
      const updated = { ...(next[idx] || {}), ...patch };
      updated.saved = isComplete(updated) ? updated.saved : false;
      next[idx] = updated;
      if (!dbEnabledRef.current) saveToLC(next);
      clearTimeout(saveTimers.current[idx]);
      saveTimers.current[idx] = setTimeout(() => {
        if (isComplete(updated)) onAutoSave(idx);
      }, 350);
      return next;
    });
  }

  async function onAutoSave(idx) {
    const r = rows[idx];
    if (!isAdmin || !isComplete(r)) return;
    const payload = {
      match_date: toMidnightISO(r.date_iso),
      team1: r.team1 || null,
      team2: r.team2 || null,
      competition: r.competition || null,
      updated_at: new Date().toISOString(),
    };
    try {
      if (dbEnabledRef.current) {
        if (r.id) {
          const { error } = await supabase.from("matches_vindeiros").update(payload).eq("id", r.id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from("matches_vindeiros").insert(payload).select().maybeSingle();
          if (error) throw error;
          setRows((prev) => {
            const next = prev.slice();
            next[idx] = { ...next[idx], id: data?.id || null };
            return next;
          });
        }
      }
      setRows((prev) => {
        const next = prev.slice();
        next[idx] = { ...next[idx], saved: true };
        return sortByDateAsc(next);
      });
      setTimeout(loadFromDB, 200);
    } catch (e) { console.error(e); }
  }

  function addCard() {
    if (!isAdmin) return;
    setRows((prev) => sortByDateAsc([{ id:null,date_iso:"",team1:"",team2:"",competition:"",saved:false }, ...prev]).slice(0, limit));
  }

  async function deleteByRowNumber() {
    if (!isAdmin) return;
    const input = prompt("Indica o número de fila a eliminar (1–10):");
    if (!input) return;
    const n = parseInt(String(input).trim(), 10);
    if (!(n >= 1 && n <= limit)) return;
    const idx = n - 1;
    const r = rows[idx];
    try {
      if (dbEnabledRef.current && r?.id) {
        await supabase.from("matches_vindeiros").delete().eq("id", r.id);
      }
      const next = rows.filter((_, i) => i !== idx);
      setRows(next.length ? next : makePlaceholders());
    } catch (e) { console.error(e); }
  }

  const view = useMemo(() => rows.slice(0, limit), [rows]);

  // móvil/pc
  const fTeam = isMobile ? 13 : 14;
  const fNum = isMobile ? 13 : 14;
  const hNum = isMobile ? 24 : 28;
  const vsF  = isMobile ? 11 : 12;
  const padTeam = isMobile ? "8px 10px" : "10px 12px";
  const dateWidth = isMobile ? "9ch" : "20ch";

  if (loading) {
    return (
      <main style={WRAP}>
        <style>{HIDE_NATIVE_DATE}</style>
        <h2 style={H1}>Vindeiros partidos</h2>
        <p style={SUB}>Axenda dos próximos encontros con data e hora confirmada</p>
      </main>
    );
  }

  return (
    <main style={WRAP}>
      <style>{HIDE_NATIVE_DATE}</style>
      <h2 style={H1}>Vindeiros partidos</h2>
      <p style={SUB}>Axenda dos próximos encontros con data e hora confirmada</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        {isAdmin ? (
          <button
            onClick={addCard}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 18px", borderRadius: 10, border: "1px solid #e5e7eb",
              background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.06)",
              font: "700 14px/1.2 Montserrat,system-ui,sans-serif",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 4v16M4 12h16" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Engadir
          </button>
        ) : <span />}

        {isAdmin && (
          <button
            onClick={deleteByRowNumber}
            title="Borrar por número de fila"
            style={{
              width: 34, height: 34, display: "grid", placeItems: "center",
              borderRadius: 10, border: "1px solid #94d3f6", background: "#fff",
              boxShadow: "0 2px 8px rgba(14,165,233,.25)", cursor: "pointer"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M7 6l1 12h8l1-12" />
            </svg>
          </button>
        )}
      </div>

      {view.map((r, idx) => {
        const key = r.id || `idx-${idx}`;
        const saved = !!r.saved;
        return (
          <section key={key} style={CARD_BASE(saved)}>
            {/* Línea 1: # + equipo1 vs equipo2 */}
            <div style={FIRST_LINE}>
              <div style={MATCH_CELL}>
                <span style={NUMBOX(hNum, fNum)}>{String(idx + 1).padStart(2, "0")}</span>
                <input
                  style={TEAM_INPUT(fTeam, padTeam)}
                  value={r.team1}
                  placeholder="LOCAL"
                  size={(r.team1 || "LOCAL").length}
                  onInput={(e) => updateRow(idx, { team1: e.currentTarget.value.toUpperCase() })}
                  readOnly={!isAdmin}
                />
                <span style={VS(vsF)}>vs</span>
                <input
                  style={TEAM_INPUT(fTeam, padTeam)}
                  value={r.team2}
                  placeholder="VISITANTE"
                  size={(r.team2 || "VISITANTE").length}
                  onInput={(e) => updateRow(idx, { team2: e.currentTarget.value.toUpperCase() })}
                  readOnly={!isAdmin}
                />
              </div>
            </div>

            {/* Línea 2: DATA + competición */}
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "auto auto 1fr" : "auto auto 1fr", gap: isMobile?8:40, alignItems:"center" }}>
              <label style={DATE_WRAP} title="Data">
                {/* icono gris visible */}
                {DATE_ICON_GRAY}
                <input
                  class="hdc-date"
                  type="date"
                  value={r.date_iso || ""}
                  onInput={(e) => updateRow(idx, { date_iso: e.currentTarget.value })}
                  readOnly={!isAdmin}
                  style={{
                    border: "none", outline: "none", background: "transparent",
                    font: `700 ${isMobile ? 12 : 14}px/1.2 Montserrat,system-ui,sans-serif`,
                    color: "#0f172a",
                    width: dateWidth,
                  }}
                />
              </label>

              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  style={CHIP_BASE}
                  onClick={() => setMenuAt(menuAt === idx ? null : idx)}
                  disabled={!isAdmin}
                  aria-haspopup="listbox"
                  title="Competición"
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ stroke: "#0ea5e9", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}>
                      <path d="M7 4h10v3a5 5 0 01-10 0V4Z" />
                      <path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" />
                      <path d="M9 14h6v3H9z" />
                    </svg>
                    <span style={{ font: `700 ${isMobile ? 12 : 14}px/1.2 Montserrat,system-ui,sans-serif` }}>
                      {r.competition || "—"}
                    </span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 10l5 5 5-5" />
                  </svg>
                </button>
                {menuAt === idx && (
                  <div
                    style={{
                      position: "absolute",
                      marginTop: 4,
                      left: 0,
                      background: "#fff",
                      border: "1px solid #dbe2f0",
                      borderRadius: 10,
                      boxShadow: "0 10px 26px rgba(0,0,0,.12)",
                      zIndex: 30,
                    }}
                  >
                    {COMP_OPTIONS.map((opt) => (
                      <div
                        key={opt}
                        style={{
                          padding: "8px 12px",
                          font: "600 13px/1.2 Montserrat,system-ui,sans-serif",
                          cursor: "pointer",
                          background: r.competition === opt ? "#f1f5f9" : "#fff",
                          whiteSpace: "nowrap",
                        }}
                        onClick={() => { updateRow(idx, { competition: opt }); setMenuAt(null); }}
                      >
                        {opt}
                      </div>
                    ))}
                    <div
                      style={{ padding: "8px 12px", font: "600 13px/1.2 Montserrat,system-ui,sans-serif", cursor: "pointer" }}
                      onClick={() => { updateRow(idx, { competition: "" }); setMenuAt(null); }}
                    >
                      —
                    </div>
                  </div>
                )}
              </div>

              <div />
            </div>
          </section>
        );
      })}
    </main>
  );
}

