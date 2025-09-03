// src/pages/PartidosFinalizados.jsx
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* Layout/estilos idénticos a Vindeiros */
const WRAP = { maxWidth: 980, margin: "0 auto", padding: "16px 12px 24px" };
const CARD = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:18, boxShadow:"0 6px 18px rgba(0,0,0,.06)", padding:"16px 12px" };
const H1  = { font:"700 22px/1.2 Montserrat,system-ui,sans-serif", margin:"0 0 4px", color:"#0f172a" };
const SUB = { font:"400 14px/1.25 Montserrat,system-ui,sans-serif", margin:"0 0 14px", color:"#64748b" };

const GRID = { display:"grid", gridTemplateColumns:"72px 160px 1fr 220px 120px", alignItems:"center", gap:0 };
const HEAD = { font:"700 13px/1.15 Montserrat,system-ui,sans-serif", color:"#fff", padding:"10px 12px", textTransform:"uppercase", minHeight:58, display:"flex", alignItems:"center" };
const ROW  = { ...GRID, minHeight:54, borderTop:"1px solid #e5e7eb" };
const CELL = { padding:"10px 12px", font:"400 14px/1.25 Montserrat,system-ui,sans-serif", color:"#0f172a" };
const NUM  = { width:40, textAlign:"right", color:"#64748b", marginRight:8, fontWeight:600 };
const COL_BORDER = "1px solid rgba(15,23,42,.22)";
const HEAD_BG = "#0ea5e9";

const BTN_ICON = { display:"inline-grid", placeItems:"center", width:40, height:40, border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)", cursor:"pointer" };

const inputBase  = { width:"100%", padding:"10px 12px", border:"1px solid #dbe2f0", borderRadius:10, outline:"none", font:"inherit" };
const inputTeam  = { ...inputBase, textTransform:"uppercase", fontWeight:700 };
const selectBase = { ...inputBase, appearance:"auto", fontWeight:700, cursor:"pointer" };

/* Helpers */
const ymdFromISO = (d, tz="Europe/Madrid") => {
  try {
    const dt = (d instanceof Date) ? d : new Date(d);
    const y = new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, year:"numeric"}).format(dt);
    const m = new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, month:"2-digit"}).format(dt);
    const da= new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, day:"2-digit"}).format(dt);
    return `${y}-${m}-${da}`;
  } catch { return ""; }
};
const parsePartido = (s="") => {
  const m = String(s).split(/vs/i);
  return { home:(m[0]||"").trim().toUpperCase(), away:(m[1]||"").trim().toUpperCase() };
};

/* Ocultar dd/mm/aa cando está baleiro (Chrome/WebKit) */
const DATE_CSS = `
  .hdc-date:not(.has-value)::-webkit-datetime-edit { color: transparent; }
  .hdc-date:focus::-webkit-datetime-edit,
  .hdc-date:hover::-webkit-datetime-edit,
  .hdc-date.has-value::-webkit-datetime-edit { color: inherit; }
`;

export default function PartidosFinalizados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const insertedRef = useRef(false);

  // Admin?
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
        if ((prof?.role || "").toLowerCase() === "admin") admin = true;
      }
      setIsAdmin(admin);
    })();
  }, []);

  async function loadList() {
    const { data } = await supabase
      .from("matches_finalizados")
      .select("id, match_iso, match_date, partido, competition, created_at")
      .order("match_date", { ascending: false })
      .limit(60);
    setRows(data || []);
  }
  useEffect(() => { loadList(); }, []);

  // Auto-archivado cando o peche chega a 0 (mantido)
  useEffect(() => {
    let t = null;
    async function checkAndArchive() {
      if (!isAdmin || insertedRef.current) return;
      const { data: nm } = await supabase
        .from("next_match")
        .select("equipo1,equipo2,competition,match_iso,tz")
        .eq("id", 1)
        .maybeSingle();
      if (!nm?.match_iso) return;

      const matchDt = new Date(nm.match_iso);
      const closeAt = new Date(matchDt.getTime() - 2 * 3600 * 1000);
      if (Date.now() >= closeAt.getTime()) {
        const partido = `${(nm.equipo1||"").toUpperCase()} vs ${(nm.equipo2||"").toUpperCase()}`.trim();
        await supabase.from("matches_finalizados").upsert({
          match_iso: nm.match_iso,
          match_date: matchDt.toISOString(),
          partido,
          competition: nm.competition || null,
        }, { onConflict: "match_iso" });
        insertedRef.current = true;
        await loadList();
      }
    }
    checkAndArchive();
    t = setInterval(checkAndArchive, 1000);
    return () => clearInterval(t);
  }, [isAdmin]);

  const viewRows = useMemo(() => {
    const out = [...(rows || [])];
    for (let i = out.length; i < 60; i++) out.push({ id: null });
    return out;
  }, [rows]);

  /* === Insert/Update helpers para edición manual === */
  async function upsertRow(row, patch) {
    // patch pode conter: ymd, comp, home, away
    const payload = {};
    if (patch.ymd) {
      payload.match_date = `${patch.ymd}T00:00:00`;
      payload.match_iso  = `${patch.ymd}T00:00:00`; // chave natural sin hora real
    }
    if (patch.comp !== undefined) payload.competition = patch.comp || null;
    if (patch.home !== undefined || patch.away !== undefined) {
      const home = (patch.home || "").trim().toUpperCase();
      const away = (patch.away || "").trim().toUpperCase();
      const txt = [home, home && away ? "vs" : "", away].filter(Boolean).join(" ");
      payload.partido = txt || null;
    }
    payload.updated_at = new Date().toISOString();

    if (row?.id) {
      await supabase.from("matches_finalizados").update(payload).eq("id", row.id);
    } else {
      await supabase.from("matches_finalizados").insert(payload);
    }
    await loadList();
  }

  /* === Handlers campos (permitimos edición tamén en filas novas) === */
  function onDateInput(row, e) {
    if (!isAdmin) return;
    const ymd = e.currentTarget.value;
    e.currentTarget.classList.toggle("has-value", !!ymd);
    if (!ymd) return;
    upsertRow(row, { ymd });
  }
  function onCompChange(row, e) {
    if (!isAdmin) return;
    upsertRow(row, { comp: e.currentTarget.value });
  }
  function onHomeBlur(row, e, other) {
    if (!isAdmin) return;
    upsertRow(row, { home: e.currentTarget.value, away: other });
  }
  function onAwayBlur(row, e, other) {
    if (!isAdmin) return;
    upsertRow(row, { home: other, away: e.currentTarget.value });
  }

  const headCell = (children, isLast = false, center = false) => (
    <div
      style={{
        ...HEAD,
        background: HEAD_BG,
        justifyContent: center ? "center" : "flex-start",
        borderRight: "none" /* sen raias na cabeceira */,
      }}
    >
      {children}
    </div>
  );
  const bodyCell = (children, isLast = false) => (
    <div style={{ ...CELL, borderRight: isLast ? "none" : COL_BORDER }}>{children}</div>
  );

  return (
    <main style={WRAP}>
      <style>{DATE_CSS}</style>
      <section style={CARD}>
        <h2 style={H1}>Partidos finalizados</h2>
        <p style={SUB}>Histórico dos encontros do Celta na tempada 2025/2026.</p>

        {/* Cabeceira (sen liñas internas) */}
        <div style={{ ...GRID, borderTop:"1px solid #0ea5e9", borderBottom:"1px solid #0ea5e9" }}>
          {headCell(<span style={{ paddingLeft:12 }}>#</span>)}
          {headCell(<span>DATA</span>)}
          {headCell(
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.6"/>
                <path d="M12 7l3 2-1 4H10L9 9l3-2Z" stroke="#fff" strokeWidth="1.2" fill="none"/>
                <path d="M9 9l-3 2 2 3 2-1M15 9l3 2-2 3-2-1" stroke="#fff" strokeWidth="1.2" fill="none"/>
              </svg>
              <span>PARTIDO</span>
            </div>
          )}
          {headCell(
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke="#fff" strokeWidth="1.6"/>
                <path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" stroke="#fff" strokeWidth="1.6"/>
                <path d="M9 14h6v3H9z" stroke="#fff" strokeWidth="1.6"/>
              </svg>
              <span>COMPETICIÓN</span>
            </div>
          )}
          {headCell(<span>REVISAR</span>, true, true)}
        </div>

        {/* Filas (60) */}
        {viewRows.map((r, i) => {
          const ymd = r?.match_date ? ymdFromISO(r.match_date) : "";
          const { home, away } = r?.partido ? parsePartido(r.partido) : { home:"", away:"" };

          return (
            <div key={r?.id || `p-${i}`} style={ROW}>
              {/* # */}
              {bodyCell(<span style={{ ...NUM, paddingLeft:12 }}>{String(i + 1).padStart(2, "0")}</span>)}

              {/* DATA (datepicker nativo; oculta dd/mm/aa cando baleiro) */}
              {bodyCell(
                <input
                  type="date"
                  class={`hdc-date ${ymd ? "has-value" : ""}`}
                  style={inputBase}
                  value={ymd}
                  onInput={(e) => onDateInput(r, e)}
                  disabled={!isAdmin}
                />
              )}

              {/* PARTIDO (edición en blur) */}
              {bodyCell(
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center" }}>
                  <input
                    style={inputTeam}
                    defaultValue={home}
                    placeholder="EQUIPO 1"
                    disabled={!isAdmin}
                    onBlur={(e) => onHomeBlur(r, e, away)}
                  />
                  <span style={{ fontWeight:800, color:"#0f172a" }}>vs</span>
                  <input
                    style={inputTeam}
                    defaultValue={away}
                    placeholder="EQUIPO 2"
                    disabled={!isAdmin}
                    onBlur={(e) => onAwayBlur(r, e, home)}
                  />
                </div>
              )}

              {/* COMPETICIÓN */}
              {bodyCell(
                <select
                  style={selectBase}
                  value={r?.competition || ""}
                  onInput={(e) => onCompChange(r, e)}
                  disabled={!isAdmin}
                >
                <option value=""></option>
                <option value="LaLiga">LaLiga</option>
                <option value="Europa League">Europa League</option>
                <option value="Copa do Rei">Copa do Rei</option>
                </select>
              )}

              {/* REVISAR (centrado) */}
              {bodyCell(
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <button
                    type="button"
                    style={BTN_ICON}
                    title="Ver detalle"
                    onClick={() => route("/proximo-partido")}
                    disabled={!r?.id}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3.2" stroke="#0f172a" strokeWidth="1.8"/>
                    </svg>
                  </button>
                </div>,
                true
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
