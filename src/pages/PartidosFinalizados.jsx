import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* ========= Helpers ========= */
const toISODate = (d) => {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const da = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  } catch { return ""; }
};
const parseISOFromInput = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||"").trim());
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T00:00:00`;
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
const MATCH_CELL_BASE = {
  display:"flex", alignItems:"center",
  border:"1px solid #dbe2f0", borderRadius:12, background:"#fff", overflow:"hidden"
};
const NUMBOX_BASE = {
  marginLeft: 8, marginRight: 6, minWidth: 28, height: 28, borderRadius:6,
  background:"#e2e8f0", color:"#0f172a", display:"grid", placeItems:"center",
  font:"800 14px/1 Montserrat,system-ui,sans-serif", padding:"0 8px", border:"1px solid transparent"
};
const TEAM_INPUT = {
  flex:"1 1 auto", minWidth:40, width:"auto",
  padding:"10px 12px", border:"none", outline:"none",
  font:"700 14px/1.2 Montserrat,system-ui,sans-serif",
  color:"#0f172a", background:"transparent", minHeight:40
};
const VS = { padding:"0 10px", font:"800 12px/1 Montserrat,system-ui,sans-serif", color:"#334155" };
const SECOND_LINE = { display:"grid", gridTemplateColumns:"auto 1fr auto", gap:8, alignItems:"center" };

const DATE_WRAP = (accent) => ({
  display:"inline-grid", gridTemplateColumns:"auto auto", alignItems:"center",
  gap:6, border:`1px solid ${accent}`, borderRadius:10, padding:"8px 10px", background:"#fff"
});
const DATE_ICON = (accent="#0ea5e9") => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    style={{ stroke:accent, strokeWidth:1.8, strokeLinecap:"round", strokeLinejoin:"round" }}>
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M7 2.5v4M17 2.5v4M3 9h18" />
  </svg>
);
const CHIP_BASE = (accent) => ({
  display:"inline-flex", alignItems:"center", gap:8,
  border:`1px solid ${accent}`, padding:"10px 12px", borderRadius:10,
  background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)",
  font:"700 13px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", cursor:"pointer",
  minWidth: `${COMP_MIN_CH + 6}ch`, justifyContent:"space-between"
});
const ICON_TROPHY = (c="#0ea5e9") => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    style={{ stroke:c, strokeWidth:1.8, strokeLinecap:"round", strokeLinejoin:"round" }}>
    <path d="M7 4h10v3a5 5 0 01-10 0V4Z" />
    <path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" />
    <path d="M9 14h6v3H9z" />
  </svg>
);
const ICONBTN = (accent="#0ea5e9") => ({
  width:36, height:36, display:"grid", placeItems:"center",
  borderRadius:10, border:`1px solid ${accent}`,
  background:"#fff", boxShadow:`0 2px 8px ${accent}40`,
  cursor:"pointer"
});
const ICON_STROKE = (accent="#0ea5e9") => ({
  fill:"none", stroke:accent, strokeWidth:1.8, strokeLinecap:"round", strokeLinejoin:"round"
});

export default function PartidosFinalizados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // {id, match_date(ISO-date), team1, team2, competition}
  const [menuAt, setMenuAt] = useState(null);

  // admin?
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
      .select("id, match_date, partido, competition, updated_at")
      .order("match_date", { ascending: false })
      .limit(60);
    const mapped = (data||[]).map(r => {
      const teams = String(r.partido || "").split(/\s+vs\s+/i);
      return {
        id: r.id,
        match_date: r.match_date ? toISODate(r.match_date) : "",
        team1: (teams[0] || "").toUpperCase(),
        team2: (teams[1] || "").toUpperCase(),
        competition: r.competition || "",
      };
    });
    setRows(mapped);
  }
  useEffect(() => { loadList(); }, []);

  async function onSave(idx){
    const r = rows[idx];
    if (!isAdmin) return;
    const iso = r.match_date ? parseISOFromInput(r.match_date) : null;
    const partido = `${(r.team1||"").toUpperCase()} vs ${(r.team2||"").toUpperCase()}`.trim();
    if (r.id) {
      await supabase.from("matches_finalizados")
        .update({ match_date: iso, partido, competition: r.competition || null, updated_at: new Date().toISOString() })
        .eq("id", r.id);
    } else {
      const { data } = await supabase.from("matches_finalizados")
        .insert({ match_date: iso, partido, competition: r.competition || null, updated_at: new Date().toISOString() })
        .select().maybeSingle();
      setRows(prev=>{ const next=prev.slice(); next[idx]={...next[idx], id:data?.id||null}; return next; });
    }
  }

  function updateRow(idx, patch){
    setRows(prev=>{ const n=prev.slice(); n[idx]={...(n[idx]||{}), ...patch}; return n; });
  }

  function addCard(){
    setRows(prev=>[{ id:null, match_date:"", team1:"", team2:"", competition:"" }, ...prev].slice(0,60));
  }

  return (
    <main style={WRAP}>
      <h2 style={H1}>Partidos finalizados</h2>
      <p style={SUB}>Histórico dos encontros do Celta na tempada 2025/2026</p>

      {/* Barra superior: Engadir + guardar masivo por números (derecha) */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 10 }}>
        {isAdmin ? (
          <button
            onClick={addCard}
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"8px 14px", borderRadius:10, border:"1px solid #e5e7eb",
              background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)",
              font:"700 14px/1.2 Montserrat,system-ui,sans-serif"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M4 12h16" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/></svg>
            Engadir
          </button>
        ) : <span />}

        {isAdmin && (
          <button
            onClick={async ()=>{
              const input = prompt("Indica os números de fila a gardar (ex.: 1,3,5):");
              if (!input) return;
              const list = String(input).split(",").map(s=>parseInt(s.trim(),10)).filter(n=>!isNaN(n) && n>=1 && n<=rows.length);
              for (const n of list) await onSave(n-1);
              await loadList();
            }}
            style={{ width:34, height:34, display:"grid", placeItems:"center", borderRadius:10, border:"1px solid #94d3f6", background:"#fff", boxShadow:"0 2px 8px rgba(14,165,233,.25)" }}
            title="Gardar filas por número"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" style={ICON_STROKE("#0ea5e9")}><path d="M4 4h12l4 4v12H4V4Z"/><path d="M7 4v6h10V4"/><path d="M8 16h8v4H8z"/></svg>
          </button>
        )}
      </div>

      {rows.map((r, idx)=>{
        const isCeltaHome = (r.team1 || "").toUpperCase().includes("CELTA");
        const accent = isCeltaHome ? "#0ea5e9" : "#dbe2f0";
        const cardStyle = { ...CARD_BASE, border: `1px solid ${isCeltaHome ? "#0ea5e9" : "#e5e7eb"}` };
        const matchCell = { ...MATCH_CELL_BASE, border:`1px solid ${accent}` };

        return (
          <section key={r.id || `f-${idx}`} style={cardStyle}>
            {/* Fila 1 */}
            <div style={{ marginBottom:10 }}>
              <div style={matchCell}>
                <span style={{ ...NUMBOX_BASE, height:28, minWidth:28, border:`1px solid ${accent}`, background:isCeltaHome ? "#e0f2fe" : "#e2e8f0" }}>
                  {String(idx+1).padStart(2,"0")}
                </span>
                <input
                  style={TEAM_INPUT}
                  value={r.team1}
                  placeholder="LOCAL"
                  size={(r.team1||"LOCAL").length}
                  onInput={(e)=>updateRow(idx,{ team1: e.currentTarget.value.toUpperCase() })}
                  readOnly={!isAdmin}
                />
                <span style={VS}>vs</span>
                <input
                  style={TEAM_INPUT}
                  value={r.team2}
                  placeholder="VISITANTE"
                  size={(r.team2||"VISITANTE").length}
                  onInput={(e)=>updateRow(idx,{ team2: e.currentTarget.value.toUpperCase() })}
                  readOnly={!isAdmin}
                />
              </div>
            </div>

            {/* Fila 2: Guardar | DATA + COMP | Ojo */}
            <div style={SECOND_LINE}>
              <button type="button" style={ICONBTN("#0ea5e9")} title="Gardar" onClick={()=>onSave(idx)} disabled={!isAdmin}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={ICON_STROKE("#0ea5e9")}><path d="M4 4h12l4 4v12H4V4Z"/><path d="M7 4v6h10V4"/><path d="M8 16h8v4H8z"/></svg>
              </button>

              <div style={{ display:"grid", gridTemplateColumns:"auto auto", gap:8, alignItems:"center", justifyContent:"start" }}>
                <label style={DATE_WRAP(accent)}>
                  {DATE_ICON("#0ea5e9")}
                  <input
                    type="date"
                    value={r.match_date || ""}
                    onInput={(e)=>updateRow(idx,{ match_date: e.currentTarget.value })}
                    readOnly={!isAdmin}
                    style={{
                      border:"none", outline:"none", background:"transparent",
                      font:"700 13px/1.2 Montserrat,system-ui,sans-serif",
                      color:"#0f172a", width:"14ch"
                    }}
                  />
                </label>

                <div style={{ position:"relative" }}>
                  <button
                    type="button"
                    style={CHIP_BASE(accent)}
                    onClick={()=> setMenuAt(menuAt===idx ? null : idx)}
                    disabled={!isAdmin}
                    aria-haspopup="listbox"
                    title="Competición"
                  >
                    <span style={{display:"inline-flex", alignItems:"center", gap:8}}>
                      {ICON_TROPHY("#0ea5e9")}
                      <span>{r.competition || "—"}</span>
                    </span>
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
