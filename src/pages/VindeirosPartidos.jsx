// src/pages/VindeirosPartidos.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const WRAP = { maxWidth: 980, margin: "0 auto", padding: "16px 12px 24px" };
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

const inputBase = { width:"100%", padding:"10px 12px", border:"1px solid #dbe2f0", borderRadius:10, outline:"none", font:"inherit" };
const inputTeam = { ...inputBase, textTransform:"uppercase", fontWeight:700 };
const selectBase = { ...inputBase, appearance:"auto", fontWeight:700, cursor:"pointer" };

/* Oculta 'dd/mm/aa' cando baleiro (webkit) */
const DATE_CSS = `
  .hdc-date:not(.has-value)::-webkit-datetime-edit { color: transparent; }
  .hdc-date:focus::-webkit-datetime-edit,
  .hdc-date:hover::-webkit-datetime-edit,
  .hdc-date.has-value::-webkit-datetime-edit { color: inherit; }
`;

export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
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

  // 10 filas locais
  const [rows, setRows] = useState(Array.from({length:10}, ()=>({ date:"", home:"", away:"", comp:"" })));
  const onChange = (i, field, value) => setRows(prev => { const nx = prev.slice(); nx[i] = { ...nx[i], [field]: value }; return nx; });

  const headCell = (children, center=false) => (
    <div style={{ ...HEAD, background: HEAD_BG, justifyContent: center ? "center" : "flex-start", borderRight:"1px solid rgba(255,255,255,.0)" }}>{children}</div>
  );
  const bodyCell = (children, colIdx, isLastRow=false) => (
    <div style={{
      ...CELL,
      borderRight: COL_BORDER,
      borderLeft: colIdx===0 ? COL_BORDER : "none",
      borderBottom: isLastRow ? COL_BORDER : "none"
    }}>{children}</div>
  );

  return (
    <main style={WRAP}>
      <style>{DATE_CSS}</style>
      <section style={CARD}>
        <h2 style={H1}>Vindeiros partidos</h2>
        <p style={SUB}>Axenda dos próximos encontros con data e hora confirmadas.</p>

        {/* Cabeceira */}
        <div style={{ ...GRID, borderTop:"1px solid #0ea5e9", borderBottom:"1px solid #0ea5e9" }}>
          {headCell(<span style={{ paddingLeft:12 }}>#</span>)}
          {headCell(<span>DATA</span>)}
          {headCell(
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.6"/><path d="M12 7l3 2-1 4H10L9 9l3-2Z" stroke="#fff" strokeWidth="1.2" fill="none"/></svg>
              <span>PARTIDO</span>
            </div>
          )}
          {headCell(
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke="#fff" strokeWidth="1.6"/><path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" stroke="#fff" strokeWidth="1.6"/><path d="M9 14h6v3H9z" stroke="#fff" strokeWidth="1.6"/></svg>
              <span>COMPETICIÓN</span>
            </div>
          )}
          {headCell(<span>REVISAR</span>, true)}
        </div>

        {/* Filas */}
        {rows.map((r, i) => {
          const last = i === rows.length - 1;
          return (
            <div key={i} style={ROW}>
              {bodyCell(<span style={{ ...NUM, paddingLeft:12 }}>{String(i+1).padStart(2,"0")}</span>, 0, last)}

              {bodyCell(
                <input
                  type="date"
                  class={`hdc-date ${r.date ? "has-value" : ""}`}
                  style={inputBase}
                  value={r.date}
                  onInput={(e)=>onChange(i,"date",e.currentTarget.value)}
                  disabled={!isAdmin}
                />, 1, last
              )}

              {bodyCell(
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center" }}>
                  <input style={inputTeam} placeholder="EQUIPO 1" value={r.home} onInput={(e)=>onChange(i,"home",e.currentTarget.value.toUpperCase())} disabled={!isAdmin}/>
                  <span style={{ fontWeight:800, color:"#0f172a" }}>vs</span>
                  <input style={inputTeam} placeholder="EQUIPO 2" value={r.away} onInput={(e)=>onChange(i,"away",e.currentTarget.value.toUpperCase())} disabled={!isAdmin}/>
                </div>, 2, last
              )}

              {bodyCell(
                <select style={selectBase} value={r.comp} onInput={(e)=>onChange(i,"comp",e.currentTarget.value)} disabled={!isAdmin}>
                  <option value=""></option>
                  <option value="LaLiga">LaLiga</option>
                  <option value="Europa League">Europa League</option>
                  <option value="Copa do Rei">Copa do Rei</option>
                </select>, 3, last
              )}

              {bodyCell(
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <button type="button" style={BTN_ICON} title="Revisar" disabled>
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


