// src/pages/VindeirosPartidos.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

const WRAP = { maxWidth: 820, margin: "0 auto", padding: "16px 12px 24px" };
const H1 = { font: "700 20px/1.2 Montserrat,system-ui,sans-serif", margin: "0 0 12px", color: "#0f172a", textAlign:"center" };

const CARD = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, boxShadow:"0 6px 18px rgba(0,0,0,.06)", padding:"12px", margin:"10px 0" };
const ROW = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, alignItems:"center" };
const LABEL = { font:"700 12px/1.1 Montserrat,system-ui,sans-serif", color:"#0369a1", letterSpacing:".3px" };
const INPUT = { width:"100%", padding:"10px 12px", borderRadius:12, border:"1px solid #cbd5e1", font:"700 14px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a" };
const SELECT = { ...INPUT };
const BAR = { display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, marginBottom:8 };
const TAG = { font:"700 13px/1.1 Montserrat,system-ui,sans-serif", color:"#0ea5e9" };
const BTN_ICON = { width:36, height:36, display:"grid", placeItems:"center", border:"1px solid #e5e7eb", borderRadius:10, background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)", cursor:"pointer" };

export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const email = s?.session?.user?.email?.toLowerCase() || "";
      const uid   = s?.session?.user?.id || null;
      let admin = false;
      if (email === "hdcliga@gmail.com" || email === "hdcliga2@gmail.com") admin = true;
      if (!admin && uid) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
        if ((prof?.role || "").toLowerCase() === "admin") admin = true;
      }
      setIsAdmin(admin);
    })();
  }, []);

  const [rows, setRows] = useState([]);
  async function loadRows() {
    const { data } = await supabase
      .from("matches_vindeiros")
      .select("id, match_date, home, away, competition")
      .order("id", { ascending: true })
      .limit(10);
    const base = data || [];
    for (let i = base.length; i < 10; i++) base.push({ id: null, match_date: "", home: "", away: "", competition: "" });
    setRows(base);
  }
  useEffect(() => { loadRows(); }, []);

  function setField(i, field, value) {
    setRows(prev => { const nxt = prev.slice(); nxt[i] = { ...nxt[i], [field]: value }; return nxt; });
  }

  async function saveRow(i) {
    if (!isAdmin) return;
    const r = rows[i];
    const payload = {
      match_date: (r.match_date || "").trim(),
      home: (r.home || "").toUpperCase().trim(),
      away: (r.away || "").toUpperCase().trim(),
      competition: r.competition || null,
      updated_at: new Date().toISOString(),
    };
    if (r.id) {
      await supabase.from("matches_vindeiros").update(payload).eq("id", r.id);
    } else {
      const { data, error } = await supabase.from("matches_vindeiros").insert(payload).select("id").maybeSingle();
      if (!error && data?.id) {
        setRows(prev => { const nxt = prev.slice(); nxt[i] = { ...nxt[i], id: data.id }; return nxt; });
      }
    }
  }

  async function deleteRow(i) {
    if (!isAdmin) return;
    const r = rows[i];
    if (r.id) await supabase.from("matches_vindeiros").delete().eq("id", r.id);
    setRows(prev => { const nxt = prev.slice(); nxt[i] = { id:null, match_date:"", home:"", away:"", competition:"" }; return nxt; });
  }

  const view = useMemo(() => rows, [rows]);

  return (
    <main style={WRAP}>
      <h2 style={H1}>Axenda dos próximos encontros con data e hora confirmada</h2>

      {view.map((r, i) => (
        <section key={r.id || `p-${i}`} style={CARD}>
          <div style={BAR}>
            <span style={TAG}>Fila {String(i+1).padStart(2, "0")}</span>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button title="Revisar" style={BTN_ICON} onClick={()=>route("/proximo-partido")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#0f172a" strokeWidth="1.6"/></svg>
              </button>
              <button title="Gardar" style={BTN_ICON} disabled={!isAdmin} onClick={()=>saveRow(i)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="16" rx="2" stroke="#0f172a" strokeWidth="1.6"/><path d="M7 4v6h10V4" stroke="#0f172a" strokeWidth="1.6"/></svg>
              </button>
              <button title="Borrar" style={BTN_ICON} disabled={!isAdmin} onClick={()=>deleteRow(i)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M9 7V5h6v2M8 7l1 12h6l1-12" stroke="#991b1b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>

          <div style={ROW}>
            <div>
              <label style={LABEL}>DATA</label>
              <input style={INPUT} disabled={!isAdmin} value={r.match_date||""} onInput={(e)=>setField(i,"match_date",e.currentTarget.value)} placeholder="ex.: 09/12/2025 21:00" />
            </div>
            <div>
              <label style={LABEL}>COMPETICIÓN</label>
              <select style={SELECT} disabled={!isAdmin} value={r.competition||""} onChange={(e)=>setField(i,"competition",e.currentTarget.value)}>
                <option value=""></option>
                <option value="LaLiga">LaLiga</option>
                <option value="Europa League">Europa League</option>
                <option value="Copa do Rei">Copa do Rei</option>
              </select>
            </div>
          </div>

          <div style={{ ...ROW, marginTop:8 }}>
            <div>
              <label style={LABEL}>EQUIPO 1</label>
              <input style={INPUT} disabled={!isAdmin} value={r.home||""} onInput={(e)=>setField(i,"home",e.currentTarget.value)} placeholder="RC CELTA" />
            </div>
            <div>
              <label style={LABEL}>EQUIPO 2</label>
              <input style={INPUT} disabled={!isAdmin} value={r.away||""} onInput={(e)=>setField(i,"away",e.currentTarget.value)} placeholder="GIRONA" />
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}


