import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos ===== */
const WRAP = { maxWidth: 1080, margin: "0 auto", padding: "16px 12px 24px" };
const CARD = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:18, boxShadow:"0 6px 18px rgba(0,0,0,.06)", padding:"16px 12px" };
const H1  = { font:"700 22px/1.2 Montserrat,system-ui,sans-serif", margin:"0 0 4px", color:"#0f172a" };
const SUB = { font:"400 14px/1.25 Montserrat,system-ui,sans-serif", margin:"0 0 14px", color:"#64748b" };

const GRID = { display:"grid", gridTemplateColumns:"72px 160px 1fr 220px 120px", alignItems:"center", gap:0 };
const HEAD = { font:"700 13px/1.15 Montserrat,system-ui,sans-serif", color:"#fff", padding:"10px 12px", textTransform:"uppercase", minHeight:58, display:"flex", alignItems:"center" };
const ROW  = { ...GRID, minHeight:54, borderTop:"1px solid #cbd5e1" };
const CELL = { padding:"10px 12px", font:"400 14px/1.25 Montserrat,system-ui,sans-serif", color:"#0f172a" };
const NUM  = { width:40, textAlign:"right", color:"#64748b", marginRight:8, fontWeight:600 };
const COL_BORDER = "1px solid #cbd5e1";
const HEAD_BG = "#0ea5e9";

const BTN_ICON = { display:"inline-grid", placeItems:"center", width:40, height:40, border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)", cursor:"pointer" };

const inputBase  = { width:"100%", padding:"10px 12px", border:"1px solid #dbe2f0", borderRadius:10, outline:"none", font:"inherit" };
const inputTeam  = { ...inputBase, textTransform:"uppercase", fontWeight:700 };
const selectBase = { ...inputBase, appearance:"auto", fontWeight:700, cursor:"pointer" };

/* ===== Utils ===== */
const toDMY = (d, tz="Europe/Madrid") => {
  try {
    const dt = (d instanceof Date) ? d : new Date(d);
    const y = new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, year:"numeric"}).format(dt);
    const m = new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, month:"2-digit"}).format(dt);
    const da= new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, day:"2-digit"}).format(dt);
    return `${da}/${m}/${y}`;
  } catch { return ""; }
};

const parseDMY = (s) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s||"").trim());
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm}-${dd}T00:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : iso;
};

export default function PartidosFinalizados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // {id,match_iso,match_date,partido,competition}
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
        if ((prof?.role||"").toLowerCase() === "admin") admin = true;
      }
      setIsAdmin(admin);
    })();
  }, []);

  async function loadList() {
    const { data } = await supabase
      .from("matches_finalizados")
      .select("id, match_iso, match_date, partido, competition")
      .order("match_date", { ascending: false })
      .limit(60);
    setRows(data || []);
  }

  useEffect(() => { loadList(); }, []);

  // Auto-archive cando o peche chegou (close_at = match_iso - 2h)
  useEffect(() => {
    const t = setInterval(async () => {
      if (insertedRef.current) return;
      const { data: nm } = await supabase
        .from("next_match")
        .select("equipo1,equipo2,competition,match_iso,tz")
        .eq("id", 1).maybeSingle();

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
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const viewRows = useMemo(() => {
    const out = [...(rows||[])];
    for (let i = out.length; i < 60; i++) out.push({ id:null, match_date:null, partido:"", competition:"" });
    return out;
  }, [rows]);

  async function handleCellEdit(idx, field, value) {
    const row = viewRows[idx];
    if (!row?.id || !isAdmin) return;
    const patch = {};
    if (field === "match_date") {
      const iso = parseDMY(value);
      if (!iso) return;
      patch.match_date = iso;
    } else if (field === "partido") {
      patch.partido = value || null;
    } else if (field === "competition") {
      patch.competition = value || null;
    }
    if (!Object.keys(patch).length) return;
    patch.updated_at = new Date().toISOString();
    await supabase.from("matches_finalizados").update(patch).eq("id", row.id);
    await loadList();
  }

  const headCell = (children, center=false) => (
    <div style={{ ...HEAD, background: HEAD_BG, justifyContent: center ? "center" : "flex-start", borderRight:"1px solid rgba(255,255,255,.0)" }}>
      {children}
    </div>
  );
  const bodyCell = (children, colIdx, isLastRow=false) => (
    <div style={{
      ...CELL,
      borderRight: COL_BORDER,
      borderLeft: colIdx===0 ? COL_BORDER : "none",
      borderBottom: isLastRow ? COL_BORDER : "none"
    }}>
      {children}
    </div>
  );

  return (
    <main style={WRAP}>
      <section style={CARD}>
        <h2 style={H1}>Partidos finalizados</h2>
        <p style={SUB}>Histórico dos encontros do Celta na tempada 2025/2026.</p>

        {/* Cabeceira */}
        <div style={{ ...GRID, borderTop:"1px solid #0ea5e9", borderBottom:"1px solid #0ea5e9" }}>
          {headCell(<span style={{ paddingLeft:12 }}>#</span>)}
          {headCell(<span>DATA</span>)}
          {headCell(
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.6"/>
                <path d="M12 7l3 2-1 4H10L9 9l3-2Z" stroke="#fff" strokeWidth="1.2" fill="none"/>
              </svg>
              <span>PARTIDO</span>
            </div>
          )}
          {headCell(
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke="#fff" strokeWidth="1.6"/>
                <path d="M7 7H5a 3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" stroke="#fff" strokeWidth="1.6"/>
                <path d="M9 14h6v3H9z" stroke="#fff" strokeWidth="1.6"/>
              </svg>
              <span>COMPETICIÓN</span>
            </div>
          )}
          {headCell(<span>REVISAR</span>, true)}
        </div>

        {/* Filas */}
        {viewRows.map((r, i) => {
          const last = i === viewRows.length - 1;
          const dmy  = r?.match_date ? toDMY(r.match_date) : "";
          return (
            <div key={r?.id || `p-${i}`} style={ROW}>
              {/* # */}
              {bodyCell(<span style={{ ...NUM, paddingLeft:12 }}>{String(i+1).padStart(2,"0")}</span>, 0, last)}

              {/* DATA: entrada manual (texto) */}
              {bodyCell(
                <input
                  type="text"
                  inputMode="numeric"
                  defaultValue={dmy}
                  onBlur={(e)=>handleCellEdit(i, "match_date", e.currentTarget.value)}
                  style={inputBase}
                  disabled={!isAdmin || !r?.id}
                  aria-label="Data (dd/mm/aaaa)"
                />, 1, last
              )}

              {/* PARTIDO */}
              {bodyCell(
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center" }}>
                  <input
                    style={inputTeam}
                    defaultValue={(r?.partido || "").split(" vs ")[0] || ""}
                    onBlur={(e)=> {
                      const left = e.currentTarget.value.toUpperCase();
                      const right = (document.getElementById(`pf-away-${i}`)?.value || "").toUpperCase();
                      handleCellEdit(i, "partido", left && right ? `${left} vs ${right}` : (left || right));
                    }}
                    disabled={!isAdmin || !r?.id}
                  />
                  <span style={{ fontWeight:800, color:"#0f172a" }}>vs</span>
                  <input
                    id={`pf-away-${i}`}
                    style={inputTeam}
                    defaultValue={(r?.partido || "").split(" vs ")[1] || ""}
                    onBlur={(e)=> {
                      const right = e.currentTarget.value.toUpperCase();
                      const left  = (e.currentTarget.parentElement?.querySelector("input")?.value || "").toUpperCase();
                      handleCellEdit(i, "partido", left && right ? `${left} vs ${right}` : (left || right));
                    }}
                    disabled={!isAdmin || !r?.id}
                  />
                </div>, 2, last
              )}

              {/* COMPETICIÓN */}
              {bodyCell(
                <select
                  defaultValue={r?.competition || ""}
                  onBlur={(e)=>handleCellEdit(i, "competition", e.currentTarget.value)}
                  style={selectBase}
                  disabled={!isAdmin || !r?.id}
                >
                  <option value=""></option>
                  <option value="LaLiga">LaLiga</option>
                  <option value="Europa League">Europa League</option>
                  <option value="Copa do Rei">Copa do Rei</option>
                </select>, 3, last
              )}

              {/* REVISAR */}
              {bodyCell(
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <button type="button" style={BTN_ICON} title="Revisar" onClick={()=>route("/proximo-partido")} disabled={!r?.id}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3.2" stroke="#0f172a" strokeWidth="1.8"/>
                    </svg>
                  </button>
                </div>, 4, last
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
