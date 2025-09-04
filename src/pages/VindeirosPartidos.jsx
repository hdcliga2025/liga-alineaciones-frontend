import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const WRAP = { maxWidth: 980, margin: "0 auto", padding: "16px 12px 24px" };
const CARD = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:18, boxShadow:"0 6px 18px rgba(0,0,0,.06)", padding:"16px 12px" };
const H1  = { font:"700 22px/1.2 Montserrat,system-ui,sans-serif", margin:"0 0 4px", color:"#0f172a" };
const SUB = { font:"400 14px/1.25 Montserrat,system-ui,sans-serif", margin:"0 0 14px", color:"#64748b" };

/* Tabla (desktop) */
const GRID = { display:"grid", gridTemplateColumns:"72px 160px 1fr 220px 88px 120px", alignItems:"center", gap:0 };
const HEAD = { font:"700 13px/1.15 Montserrat,system-ui,sans-serif", color:"#fff", padding:"10px 12px", textTransform:"uppercase", minHeight:58, display:"flex", alignItems:"center" };
const ROW  = { ...GRID, minHeight:54, borderTop:"1px solid #cbd5e1" };
const CELL = { padding:"10px 12px", font:"400 14px/1.25 Montserrat,system-ui,sans-serif", color:"#0f172a" };
const NUM  = { width:40, textAlign:"right", color:"#64748b", marginRight:8, fontWeight:600 };
const COL_BORDER = "1px solid #cbd5e1";
const HEAD_BG = "#0ea5e9";

/* Inputs */
const BTN_CIRCLE = { display:"inline-grid", placeItems:"center", width:40, height:40, border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)", cursor:"pointer" };
const inputBase  = { width:"100%", padding:"10px 12px", border:"1px solid #dbe2f0", borderRadius:10, outline:"none", font:"inherit", color:"#0f172a", background:"#fff", fontWeight:700 };
const inputTeam  = { ...inputBase, textTransform:"uppercase" };
const selectBase = { ...inputBase, appearance:"auto", cursor:"pointer", fontWeight:800, fontSize:16 };

/* Móvil (cards) */
const CARD_ROW_M = { border:"1px solid #e5e7eb", borderRadius:14, padding:"12px", margin:"10px 0", boxShadow:"0 2px 10px rgba(0,0,0,.05)" };
const TOP_M = { display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:8 };
const TAG = { display:"inline-block", padding:"2px 8px", borderRadius:999, background:"#e0f2fe", color:"#0369a1", font:"700 11px/1 Montserrat,system-ui,sans-serif", textTransform:"uppercase", letterSpacing:".3px" };
const LABEL = (t)=> <span style={TAG}>{t}</span>;
const ROW_M = { display:"grid", gap:8, marginTop:6 };

const maskDMY = (v) => {
  const s = String(v || "").replace(/[^\d]/g, "").slice(0, 8);
  const p1 = s.slice(0,2), p2 = s.slice(2,4), p3 = s.slice(4,8);
  return p1 + (p2?"/"+p2:"") + (p3?"/"+p3:"");
};
const toISODate = (dmy) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(dmy||""));
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
};
const fromISODate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yy = String(d.getFullYear());
  return `${dd}/${mm}/${yy}`;
};

export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState(Array.from({length:10}, ()=>({ id:null, date:"", home:"", away:"", comp:"" })));
  const [busyRow, setBusyRow] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);

  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 560);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id || null;
      let admin = false;
      if (uid) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
        if ((prof?.role||"").toLowerCase()==="admin") admin = true;
      }
      setIsAdmin(admin);

      const { data } = await supabase
        .from("matches_vindeiros")
        .select("id, match_date, home, away, competition")
        .order("match_date", { ascending: true, nullsFirst: true })
        .limit(10);

      const list = Array.from({length:10}, (_,i)=> {
        const r = data?.[i];
        return r ? {
          id: r.id,
          date: fromISODate(r.match_date),
          home: r.home || "",
          away: r.away || "",
          comp: r.competition || ""
        } : { id:null, date:"", home:"", away:"", comp:"" };
      });
      setRows(list);
    })();
  }, []);

  const headCell = (children, center=false) => (
    <div style={{ ...HEAD, background: HEAD_BG, justifyContent: center ? "center" : "flex-start" }}>{children}</div>
  );
  const bodyCell = (children, colIdx, isLastRow=false) => (
    <div style={{ ...CELL, borderRight: COL_BORDER, borderLeft: colIdx===0 ? COL_BORDER : "none", borderBottom: isLastRow ? COL_BORDER : "none" }}>
      {children}
    </div>
  );

  const saveRow = async (i) => {
    if (!isAdmin) return;
    const r = rows[i];
    const iso = toISODate(r.date);
    if (!iso) return;

    setBusyRow(i);
    try {
      const payload = {
        match_date: iso,
        home: (r.home||"").toUpperCase().trim() || null,
        away: (r.away||"").toUpperCase().trim() || null,
        partido: (r.home && r.away) ? `${r.home.toUpperCase()} vs ${r.away.toUpperCase()}` : null,
        competition: r.comp || null,
        updated_at: new Date().toISOString(),
      };

      if (r.id) {
        await supabase.from("matches_vindeiros").update(payload).eq("id", r.id);
      } else {
        const { data, error } = await supabase.from("matches_vindeiros").insert([payload]).select("id").maybeSingle();
        if (!error && data?.id) {
          setRows(prev => { const nx=prev.slice(); nx[i].id = data.id; return nx; });
        }
      }
    } finally {
      setBusyRow(null);
    }
  };

  return (
    <main style={WRAP}>
      <section style={CARD}>
        <h2 style={H1}>Vindeiros partidos</h2>
        <p style={SUB}>Axenda dos próximos encontros con data e hora confirmadas.</p>

        {/** ======= Escritorio: TABLA ======= */}
        {!isMobile && (
          <>
            <div style={{ ...GRID, borderTop:"1px solid #0ea5e9", borderBottom:"1px solid #0ea5e9" }}>
              {headCell(<span style={{ paddingLeft:12 }}>#</span>)}
              {headCell(<span>DATA</span>)}
              {headCell(<div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.6"/><path d="M12 7l3 2-1 4H10L9 9l3-2Z" stroke="#fff" strokeWidth="1.2" fill="none"/></svg>
                <span>PARTIDO</span>
              </div>)}
              {headCell(<div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke="#fff" strokeWidth="1.6"/><path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" stroke="#fff" strokeWidth="1.6"/><path d="M9 14h6v3H9z" stroke="#fff" strokeWidth="1.6"/></svg>
                <span>COMPETICIÓN</span>
              </div>)}
              {headCell(<span>GARDAR</span>, true)}
              {headCell(<span>REVISAR</span>, true)}
            </div>

            {rows.map((r, i) => {
              const last = i === rows.length - 1;
              return (
                <div key={i} style={ROW}>
                  {bodyCell(<span style={{ ...NUM, paddingLeft:12 }}>{String(i+1).padStart(2,"0")}</span>, 0, last)}
                  {bodyCell(<input type="text" inputMode="numeric" placeholder="dd/mm/aaaa" style={inputBase} value={r.date} onInput={(e)=>{const v=maskDMY(e.currentTarget.value); setRows(p=>{const nx=p.slice(); nx[i].date=v; return nx;});}} readOnly={!isAdmin} />, 1, last)}
                  {bodyCell(<div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center" }}>
                    <input style={inputTeam} placeholder="EQUIPO 1" value={r.home} onInput={(e)=>setRows(p=>{const nx=p.slice(); nx[i].home=e.currentTarget.value.toUpperCase(); return nx;})} readOnly={!isAdmin}/>
                    <span style={{ fontWeight:800, color:"#0f172a" }}>vs</span>
                    <input style={inputTeam} placeholder="EQUIPO 2" value={r.away} onInput={(e)=>setRows(p=>{const nx=p.slice(); nx[i].away=e.currentTarget.value.toUpperCase(); return nx;})} readOnly={!isAdmin}/>
                  </div>, 2, last)}
                  {bodyCell(<select style={selectBase} value={r.comp} onInput={(e)=>setRows(p=>{const nx=p.slice(); nx[i].comp=e.currentTarget.value; return nx;})} disabled={!isAdmin}>
                    <option value=""></option>
                    <option value="LaLiga">LaLiga</option>
                    <option value="Europa League">Europa League</option>
                    <option value="Copa do Rei">Copa do Rei</option>
                  </select>, 3, last)}
                  {bodyCell(<div style={{ display:"flex", justifyContent:"center" }}>
                    <button type="button" style={{ ...BTN_CIRCLE, opacity: isAdmin ? 1 : .5, cursor: isAdmin ? "pointer" : "not-allowed" }} disabled={!isAdmin || busyRow===i} title="Gardar esta fila" onClick={()=>saveRow(i)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4h12l4 4v12H4V4Z" stroke="#0f172a" strokeWidth="1.8"/><path d="M7 4h8v6H7V4Z" stroke="#0f172a" strokeWidth="1.8"/><path d="M7 20v-6h10v6H7Z" stroke="#0f172a" strokeWidth="1.8"/></svg>
                    </button>
                  </div>, 4, last)}
                  {bodyCell(<div style={{ display:"flex", justifyContent:"center" }}>
                    <button type="button" style={BTN_CIRCLE} title="Revisar" disabled>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" strokeWidth="1.8"/><circle cx="12" cy="12" r="3.2" stroke="#0f172a" strokeWidth="1.8"/></svg>
                    </button>
                  </div>, 5, last)}
                </div>
              );
            })}
          </>
        )}

        {/** ======= Móvil: TARJETAS ======= */}
        {isMobile && rows.map((r, i) => (
          <div key={i} style={CARD_ROW_M}>
            <div style={TOP_M}>
              <span style={{ ...NUM, margin:0 }}>{String(i+1).padStart(2,"0")}</span>
              <div style={{ flex:1, textAlign:"right" }}>{LABEL("Data")}</div>
            </div>
            <div style={ROW_M}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                style={inputBase}
                value={r.date}
                onInput={(e)=>{const v=maskDMY(e.currentTarget.value); setRows(p=>{const nx=p.slice(); nx[i].date=v; return nx;});}}
                readOnly={!isAdmin}
              />

              <div>{LABEL("Partido")}</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center" }}>
                <input style={inputTeam} placeholder="EQUIPO 1" value={r.home} onInput={(e)=>setRows(p=>{const nx=p.slice(); nx[i].home=e.currentTarget.value.toUpperCase(); return nx;})} readOnly={!isAdmin}/>
                <span style={{ fontWeight:800, color:"#0f172a" }}>vs</span>
                <input style={inputTeam} placeholder="EQUIPO 2" value={r.away} onInput={(e)=>setRows(p=>{const nx=p.slice(); nx[i].away=e.currentTarget.value.toUpperCase(); return nx;})} readOnly={!isAdmin}/>
              </div>

              <div>{LABEL("Competición")}</div>
              <select style={selectBase} value={r.comp} onInput={(e)=>setRows(p=>{const nx=p.slice(); nx[i].comp=e.currentTarget.value; return nx;})} disabled={!isAdmin}>
                <option value=""></option>
                <option value="LaLiga">LaLiga</option>
                <option value="Europa League">Europa League</option>
                <option value="Copa do Rei">Copa do Rei</option>
              </select>

              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:6 }}>
                <button type="button" style={{ ...BTN_CIRCLE, opacity: isAdmin ? 1 : .5, cursor: isAdmin ? "pointer" : "not-allowed" }} disabled={!isAdmin || busyRow===i} title="Gardar" onClick={()=>saveRow(i)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4h12l4 4v12H4V4Z" stroke="#0f172a" strokeWidth="1.8"/><path d="M7 4h8v6H7V4Z" stroke="#0f172a" strokeWidth="1.8"/><path d="M7 20v-6h10v6H7Z" stroke="#0f172a" strokeWidth="1.8"/></svg>
                </button>
                <button type="button" style={BTN_CIRCLE} title="Revisar" disabled>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" strokeWidth="1.8"/><circle cx="12" cy="12" r="3.2" stroke="#0f172a" strokeWidth="1.8"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

