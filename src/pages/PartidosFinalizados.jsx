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
  if (yy.length === 2) yy = String(2000 + parseInt(yy, 10)); // aa -> 20aa
  const iso = `${yy}-${mm}-${dd}T00:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : iso;
};
const COMP_OPTIONS = ["LaLiga", "Europa League", "Copa do Rei"];

/* ========= Estilos (compartidos coa outra páxina) ========= */
const WRAP = { maxWidth: 980, margin: "0 auto", padding: "16px 12px 24px" };
const H1   = { font: "700 20px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a", margin: "0 0 8px" };
const SUB  = { color: "#475569", font: "400 13px/1.3 Montserrat,system-ui,sans-serif", margin: "0 0 14px" };

const CARD = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: 12,
  marginBottom: 10,
};

const FIRST_LINE = { display:"grid", gridTemplateColumns:"1fr", gap:0, marginBottom:10 };
const MATCH_CELL = {
  display:"grid",
  gridTemplateColumns:"auto 1fr auto 1fr",
  alignItems:"center",
  gap: 0,
  border:"1px solid #dbe2f0",
  borderRadius:12,
  background:"#fff",
  overflow:"hidden"
};
const PILL = {
  marginLeft: 8, marginRight: 6, minWidth: 28, height: 24, borderRadius: 999,
  background: "#f1f5f9", color:"#0f172a",
  display:"grid", placeItems:"center",
  font:"800 11px/1 Montserrat,system-ui,sans-serif", padding: "0 8px"
};
const MATCH_INPUT = {
  width:"100%", padding:"10px 12px", border:"none", outline:"none",
  font:"700 14px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", background:"transparent"
};
const VS = { padding:"0 10px", font:"800 12px/1 Montserrat,system-ui,sans-serif", color:"#334155" };

const SECOND_LINE = { display:"grid", gridTemplateColumns:"1fr auto auto auto", gap: 8, alignItems:"center" };
const INPUT_SOFT = {
  width:"100%", padding:"10px 12px",
  border:"1px solid #dbe2f0", borderRadius:10,
  font:"700 13px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", outline:"none",
};
const CHIP = {
  display:"inline-flex", alignItems:"center", gap:6,
  border:"1px solid #e5e7eb", padding:"8px 10px", borderRadius:10,
  background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)",
  font:"700 13px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", cursor:"pointer"
};
const MENU = {
  position:"absolute", marginTop:4, right:0, background:"#fff",
  border:"1px solid #e5e7eb", borderRadius:10,
  boxShadow:"0 10px 26px rgba(0,0,0,.12)", zIndex:30
};
const MENU_ITEM = { padding:"8px 12px", font:"600 13px/1.2 Montserrat,system-ui,sans-serif", cursor:"pointer", whiteSpace:"nowrap" };

const ICONBTN = {
  width:36, height:36, display:"grid", placeItems:"center",
  borderRadius:10, border:"1px solid #0ea5e9",
  background:"#fff", boxShadow:"0 2px 8px rgba(14,165,233,.25)",
  cursor:"pointer"
};
const ICON_STROKE = { fill:"none", stroke:"#0ea5e9", strokeWidth:1.8, strokeLinecap:"round", strokeLinejoin:"round" };
const TOAST = {
  position:"fixed", left:"50%", bottom:18, transform:"translateX(-50%)",
  background:"#0ea5e9", color:"#fff", padding:"8px 12px", borderRadius:10,
  font:"700 13px/1.2 Montserrat,system-ui,sans-serif", boxShadow:"0 10px 26px rgba(14,165,233,.4)", zIndex:1000
};

/* ========= Compo ========= */
export default function PartidosFinalizados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // {id, match_date, team1, team2, competition}
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
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

  function toast2(msg){ setToast(msg); setTimeout(()=>setToast(""), 2000); }
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

  async function onSave(idx){
    const r = rows[idx];
    if (!isAdmin){ toast2("Só admin pode gardar"); return; }

    let iso = r.match_date;
    if (typeof iso === "string" && /\d{2}\/\d{2}\/(\d{2}|\d{4})/.test(iso)) {
      const p = parseDMYToISO(iso);
      if (!p){ toast2("DATA inválida"); return; }
      iso = p;
    }
    const partido = `${(r.team1||"").toUpperCase()} vs ${(r.team2||"").toUpperCase()}`.trim();

    if (r.id) {
      const { error } = await supabase.from("matches_finalizados")
        .update({
          match_date: iso,
          partido,
          competition: r.competition || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", r.id);
      if (error){ toast2("Erro gardando"); return; }
    } else {
      const { data, error } = await supabase.from("matches_finalizados")
        .insert({
          match_date: iso,
          partido,
          competition: r.competition || null,
          updated_at: new Date().toISOString(),
        })
        .select().maybeSingle();
      if (error){ toast2("Erro gardando"); return; }
      updateRow(idx, { id: data?.id || null });
    }
    toast2("Gardado!");
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
        return (
          <section key={r.id || `f-${idx}`} style={CARD}>
            {/* Fila 1: nº + “E1 vs E2” unha única cela */}
            <div style={FIRST_LINE}>
              <div style={MATCH_CELL}>
                <span style={PILL}>{String(idx+1).padStart(2,"0")}</span>
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

            {/* Fila 2: Data + icono competición + Gardar + Ollo */}
            <div style={SECOND_LINE}>
              <input
                style={INPUT_SOFT}
                value={dmy2}
                placeholder="dd/mm/aa"
                onInput={(e)=>updateRow(idx,{ match_date: e.currentTarget.value })}
                readOnly={!isAdmin}
              />

              <div style={{ position:"relative" }}>
                <button
                  type="button"
                  style={CHIP}
                  onClick={()=> setMenuAt(menuAt===idx ? null : idx)}
                  disabled={!isAdmin}
                  aria-haspopup="listbox"
                  title="Competición"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" style={ICON_STROKE}>
                    <path d="M7 4h10v3a5 5 0 01-10 0V4Z"/>
                    <path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3"/>
                    <path d="M9 14h6v3H9z"/>
                  </svg>
                  <span>{r.competition || "—"}</span>
                </button>
                {menuAt===idx && (
                  <div style={MENU} role="listbox">
                    {COMP_OPTIONS.map(opt=>(
                      <div key={opt} style={{...MENU_ITEM, background: r.competition===opt ? "#f1f5f9" : "#fff"}} onClick={()=>{ updateRow(idx,{ competition: opt }); setMenuAt(null); }}>
                        {opt}
                      </div>
                    ))}
                    <div style={MENU_ITEM} onClick={()=>{ updateRow(idx,{ competition: "" }); setMenuAt(null); }}>—</div>
                  </div>
                )}
              </div>

              <button type="button" style={ICONBTN} title="Gardar" onClick={()=>onSave(idx)} disabled={!isAdmin}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={ICON_STROKE}>
                  <path d="M4 4h12l4 4v12H4V4Z" />
                  <path d="M7 4v6h10V4" />
                  <path d="M8 16h8v4H8z" />
                </svg>
              </button>

              <button
                type="button"
                style={ICONBTN}
                title="Revisar ranking do partido"
                onClick={()=> route(`/resultados-ultima-alineacion${r.id?`?match_id=${r.id}`:""}`)}
              >
                {/* Ollo */}
                <svg width="20" height="20" viewBox="0 0 24 24" style={ICON_STROKE}>
                  <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </section>
        );
      })}

      {toast && <div style={TOAST}>{toast}</div>}
    </main>
  );
}
