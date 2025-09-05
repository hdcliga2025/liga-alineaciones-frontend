import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* ========= Helpers ========= */
const tz = "Europe/Madrid";
const toDMY2 = (d) => {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    const dd = new Intl.DateTimeFormat("es-ES", { day: "2-digit", timeZone: tz }).format(dt);
    const mm = new Intl.DateTimeFormat("es-ES", { month: "2-digit", timeZone: tz }).format(dt);
    const yy = new Intl.DateTimeFormat("es-ES", { year: "2-digit", timeZone: tz }).format(dt);
    return `${dd}/${mm}/${yy}`;
  } catch { return ""; }
};
const parseDMYToISO = (s) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/.exec(String(s||"").trim());
  if (!m) return null;
  let [_, dd, mm, yy] = m;
  if (yy.length === 2) yy = String(2000 + parseInt(yy, 10));
  const iso = `${yy}-${mm}-${dd}T00:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : iso;
};
const COMP_OPTIONS = ["LaLiga", "Europa League", "Copa do Rei"];
const COMP_MIN_CH = Math.max(...COMP_OPTIONS.map(s => s.length));

/* ========= Estilos ========= */
const WRAP = { maxWidth: 980, margin: "0 auto", padding: "16px 12px 24px" };
const H1   = { font: "700 20px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a", margin: "0 0 8px" };
const SUB  = { color: "#475569", font: "400 13px/1.3 Montserrat,system-ui,sans-serif", margin: "0 0 14px" };

const CARD_BASE = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: 12,
  marginBottom: 10,
};

const FIRST_LINE = { display:"grid", gridTemplateColumns:"1fr", gap:0, marginBottom:10 };
const MATCH_CELL_BASE = {
  display:"grid",
  gridTemplateColumns:"auto 1fr auto 1fr",
  alignItems:"center",
  gap: 0,
  border:"1px solid #dbe2f0",
  borderRadius:12,
  background:"#fff",
  overflow:"hidden"
};
const NUMBOX_BASE = {
  marginLeft: 8, marginRight: 6, minWidth: 28, height: 28,
  borderRadius: 6, background: "#e2e8f0", color:"#0f172a",
  display:"grid", placeItems:"center",
  font:"800 14px/1 Montserrat,system-ui,sans-serif",
  padding:"0 8px"
};
const MATCH_INPUT = {
  width:"100%", padding:"10px 12px", border:"none", outline:"none",
  font:"700 14px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", background:"transparent"
};
const VS = { padding:"0 10px", font:"800 12px/1 Montserrat,system-ui,sans-serif", color:"#334155" };

const SECOND_LINE = { display:"grid", gridTemplateColumns:"auto 1fr auto", gap: 8, alignItems:"center" };
const INPUT_SOFT_BASE = {
  padding:"10px 12px",
  border:"1px solid #dbe2f0",
  borderRadius:10,
  font:"700 13px/1.2 Montserrat,system-ui,sans-serif",
  color:"#0f172a", outline:"none", background:"#fff"
};
const MID_WRAP = { display:"grid", gridTemplateColumns:"auto auto", gap:8, alignItems:"center", justifyContent:"start" };
const CHIP_BASE = {
  display:"inline-flex", alignItems:"center", gap:6,
  border:"1px solid #e5e7eb", padding:"8px 10px", borderRadius:10,
  background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)",
  font:"700 13px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", cursor:"pointer",
  minWidth: `${COMP_MIN_CH + 2}ch`, justifyContent:"space-between"
};

const ICONBTN = (accent="#0ea5e9") => ({
  width:36, height:36, display:"grid", placeItems:"center",
  borderRadius:10, border:`1px solid ${accent}`,
  background:"#fff", boxShadow:`0 2px 8px ${accent}40`,
  cursor:"pointer"
});
const ICON_STROKE = (accent="#0ea5e9") => ({
  fill:"none", stroke:accent, strokeWidth:1.8, strokeLinecap:"round", strokeLinejoin:"round"
});

/* ========= Compo ========= */
export default function PartidosFinalizados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // {id, match_date, team1, team2, competition}
  const [loading, setLoading] = useState(true);
  const [menuAt, setMenuAt] = useState(null);
  const limit = 60;

  // admin?
  useEffect(() => {
    let alive = true;
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
      if (alive) setIsAdmin(admin);
    })();
    return () => { alive = false; };
  }, []);

  async function loadList() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("matches_finalizados")
        .select("id, match_date, partido, competition, updated_at")
        .order("match_date", { ascending: false })
        .limit(limit);
      const mapped = (data||[]).map(r => {
        const teams = String(r.partido || "").split(/\s+vs\s+/i);
        return {
          id: r.id,
          match_date: r.match_date || null,
          team1: (teams[0] || "").toUpperCase(),
          team2: (teams[1] || "").toUpperCase(),
          competition: r.competition || "",
          updated_at: r.updated_at || null
        };
      });
      setRows(mapped);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadList(); }, []);

  async function onSave(idx){
    const r = rows[idx];
    if (!isAdmin) return;

    let iso = r.match_date;
    if (typeof iso === "string" && /\d{2}\/\d{2}\/(\d{2}|\d{4})/.test(iso)) {
      const p = parseDMYToISO(iso);
      if (!p) return;
      iso = p;
    }
    const partido = `${(r.team1||"").toUpperCase()} vs ${(r.team2||"").toUpperCase()}`.trim();

    if (r.id) {
      await supabase.from("matches_finalizados")
        .update({
          match_date: iso,
          partido,
          competition: r.competition || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", r.id);
    } else {
      const { data } = await supabase.from("matches_finalizados")
        .insert({
          match_date: iso,
          partido,
          competition: r.competition || null,
          updated_at: new Date().toISOString(),
        })
        .select().maybeSingle();
      setRows(prev=>{
        const next = prev.slice();
        next[idx] = { ...(next[idx]||{}), id: data?.id || null };
        return next;
      });
    }
  }

  function updateRow(idx, patch){
    setRows(prev=>{
      const next = prev.slice();
      next[idx] = { ...(next[idx]||{}), ...patch };
      return next;
    });
  }
  function addCard(){
    setRows(prev=>{
      const base = { id:null, match_date:null, team1:"", team2:"", competition:"" };
      return [base, ...prev].slice(0,60);
    });
  }

  const view = useMemo(()=> rows.slice(0,60), [rows]);

  if (loading) {
    return (
      <main style={WRAP}>
        <h2 style={H1}>Partidos finalizados</h2>
        <p style={SUB}>Histórico dos encontros do Celta na tempada 2025/2026</p>
      </main>
    );
  }

  return (
    <main style={WRAP}>
      <h2 style={H1}>Partidos finalizados</h2>
      <p style={SUB}>Histórico dos encontros do Celta na tempada 2025/2026</p>

      {isAdmin && (
        <div style={{ marginBottom: 10 }}>
          <button onClick={addCard} style={{display:"inline-flex",alignItems:"center",gap:6, padding:"8px 10px", borderRadius:10, border:"1px solid #e5e7eb", background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)", font:"700 14px/1.2 Montserrat,system-ui,sans-serif"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M4 12h16" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/></svg>
            Engadir
          </button>
        </div>
      )}

      {view.map((r, idx)=>{
        const dmy2 = r.match_date ? (/\d{4}-\d{2}-\d{2}/.test(r.match_date) ? toDMY2(r.match_date) : r.match_date) : "";
        const isCeltaHome = (r.team1 || "").toUpperCase().includes("CELTA");
        const accent = isCeltaHome ? "#0ea5e9" : "#dbe2f0";
        const cardStyle = { ...CARD_BASE, border: `1px solid ${isCeltaHome ? "#0ea5e9" : "#e5e7eb"}` };
        const matchCell = { ...MATCH_CELL_BASE, border:`1px solid ${accent}` };
        const inputSoft = { ...INPUT_SOFT_BASE, border:`1px solid ${accent}` };
        const chip = { ...CHIP_BASE, border:`1px solid ${accent}` };

        return (
          <section key={r.id || `f-${idx}`} style={cardStyle}>
            {/* Fila 1: nº + “E1 vs E2” */}
            <div style={FIRST_LINE}>
              <div style={matchCell}>
                <span style={{ ...NUMBOX_BASE, background:isCeltaHome ? "#e0f2fe" : "#e2e8f0", border:`1px solid ${accent}` }}>
                  {String(idx+1).padStart(2,"0")}
                </span>
                <input
                  style={MATCH_INPUT}
                  value={r.team1}
                  placeholder="LOCAL"
                  onInput={(e)=>updateRow(idx,{ team1: e.currentTarget.value.toUpperCase() })}
                  readOnly={!isAdmin}
                />
                <span style={VS}>vs</span>
                <input
                  style={MATCH_INPUT}
                  value={r.team2}
                  placeholder="VISITANTE"
                  onInput={(e)=>updateRow(idx,{ team2: e.currentTarget.value.toUpperCase() })}
                  readOnly={!isAdmin}
                />
              </div>
            </div>

            {/* Fila 2: [Gardar] | [DATA + Competición] | [Ver] */}
            <div style={SECOND_LINE}>
              {/* Gardar (esquerda) */}
              <button type="button" style={ICONBTN("#0ea5e9")} title="Gardar" onClick={()=>onSave(idx)} disabled={!isAdmin}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={ICON_STROKE("#0ea5e9")}>
                  <path d="M4 4h12l4 4v12H4V4Z" />
                  <path d="M7 4v6h10V4" />
                  <path d="M8 16h8v4H8z" />
                </svg>
              </button>

              {/* Centro */}
              <div style={MID_WRAP}>
                <input
                  style={{ ...inputSoft, width: `${Math.max(8, (dmy2||"").length || 8)}ch` }}
                  size={Math.max(8, (dmy2||"").length || 8)}
                  value={dmy2}
                  placeholder="dd/mm/aa"
                  onInput={(e)=>updateRow(idx,{ match_date: e.currentTarget.value })}
                  readOnly={!isAdmin}
                />

                <div style={{ position:"relative" }}>
                  <button
                    type="button"
                    style={chip}
                    onClick={()=> setMenuAt(menuAt===idx ? null : idx)}
                    disabled={!isAdmin}
                    aria-haspopup="listbox"
                    title="Competición"
                  >
                    <span>{r.competition || "—"}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" style={ICON_STROKE("#0ea5e9")}><path d="M7 10l5 5 5-5" /></svg>
                  </button>
                  {menuAt===idx && (
                    <div style={{ position:"absolute", marginTop:4, left:0, background:"#fff", border:`1px solid ${accent}`, borderRadius:10, boxShadow:"0 10px 26px rgba(0,0,0,.12)", zIndex:30 }}>
                      {COMP_OPTIONS.map(opt=>(
                        <div key={opt}
                          style={{ padding:"8px 12px", font:"600 13px/1.2 Montserrat,system-ui,sans-serif", cursor:"pointer", background: r.competition===opt ? "#f1f5f9" : "#fff", whiteSpace:"nowrap" }}
                          onClick={()=>{ updateRow(idx,{ competition: opt }); setMenuAt(null); }}
                        >
                          {opt}
                        </div>
                      ))}
                      <div style={{ padding:"8px 12px", font:"600 13px/1.2 Montserrat,system-ui,sans-serif", cursor:"pointer" }} onClick={()=>{ updateRow(idx,{ competition: "" }); setMenuAt(null); }}>—</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ver (dereita) */}
              <button
                type="button"
                style={ICONBTN("#0ea5e9")}
                title="Revisar ranking do partido"
                onClick={()=> route(`/resultados-ultima-alineacion${r.id?`?match_id=${r.id}`:""}`)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" style={ICON_STROKE("#0ea5e9")}>
                  <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </section>
        );
      })}
    </main>
  );
}
