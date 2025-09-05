import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ========= Helpers ========= */
const tz = "Europe/Madrid";
const toISODate = (d) => {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const da = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  } catch { return ""; }
};
const parseDMYToISO = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||"").trim());
  if (!m) return null;
  // ya viene en formato del input date => ISO-YYYY-MM-DD
  return `${m[1]}-${m[2]}-${m[3]}T00:00:00`;
};
const COMP_OPTIONS = ["LaLiga", "Europa League", "Copa do Rei"];
const COMP_MIN_CH = Math.max(...COMP_OPTIONS.map(s => s.length));
const lcKey = "hdc_vindeiros_cards_v7";

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

/* Fila 1 → nº + “E1 vs E2” en una sola celda (flex dinámico) */
const FIRST_LINE = { marginBottom: 10 };
const MATCH_CELL_BASE = {
  display:"flex",
  alignItems:"center",
  border:"1px solid #dbe2f0",
  borderRadius:12,
  background:"#fff",
  overflow:"hidden"
};
const NUMBOX_BASE = {
  marginLeft: 8, marginRight: 6,
  minWidth: 28, height: 28, borderRadius:6,
  background:"#e2e8f0", color:"#0f172a",
  display:"grid", placeItems:"center",
  font:"800 14px/1 Montserrat,system-ui,sans-serif",
  padding:"0 8px", border:"1px solid transparent"
};
const TEAM_INPUT = {
  flex:"1 1 auto",
  minWidth: 40,
  width:"auto",
  padding:"10px 12px",
  border:"none", outline:"none",
  font:"700 14px/1.2 Montserrat,system-ui,sans-serif",
  color:"#0f172a", background:"transparent",
  minHeight: 40
};
const VS = { padding:"0 10px", font:"800 12px/1 Montserrat,system-ui,sans-serif", color:"#334155" };

/* Fila 2 → centro (DATA + COMP) + botón Guardar a la derecha */
const SECOND_LINE = {
  display:"grid",
  gridTemplateColumns:"1fr auto",
  gap: 8, alignItems:"center"
};
const INPUT_SOFT_BASE = {
  padding:"10px 12px",
  border:"1px solid #dbe2f0",
  borderRadius:10,
  font:"700 13px/1.2 Montserrat,system-ui,sans-serif",
  color:"#0f172a", outline:"none",
  background:"#fff"
};
const MID_WRAP = { display:"grid", gridTemplateColumns:"auto auto", gap:8, alignItems:"center", justifyContent:"start" };

const DATE_WRAP = (accent) => ({
  display:"inline-grid",
  gridTemplateColumns:"auto auto",
  alignItems:"center",
  gap:6,
  border:`1px solid ${accent}`,
  borderRadius:10,
  padding:"8px 10px",
  background:"#fff",
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

/* Toast */
function Toast({ text, kind="ok" }) {
  const bg = kind==="ok" ? "#0ea5e9" : "#b91c1c";
  const Icon = kind==="ok"
    ? () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{stroke:"#fff",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}}><path d="M20 6L9 17l-5-5"/></svg>)
    : () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{stroke:"#fff",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}}><path d="M12 9v5M12 17h.01"/><path d="M10.3 3.5l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.7-2.5l-8-14a2 2 0 0 0-3.4 0Z"/></svg>);
  return (
    <div style={{
      position:"fixed", left:"50%", bottom:16, transform:"translateX(-50%)",
      background:bg, color:"#fff", padding:"6px 10px", borderRadius:10,
      font:"700 12px/1.1 Montserrat,system-ui,sans-serif",
      boxShadow:"0 10px 26px rgba(0,0,0,.18)", zIndex:1000,
      display:"inline-flex", alignItems:"center", gap:8
    }}>
      <Icon /> {text}
    </div>
  );
}

export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // {id,date_iso,team1,team2,competition}
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [menuAt, setMenuAt] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  const dbEnabledRef = useRef(true);
  const limit = 10;

  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 560);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

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

  function showToast(text, kind="ok"){ setToast({text, kind}); setTimeout(()=>setToast(null), 2000); }

  async function loadFromDB() {
    try {
      const { data, error } = await supabase
        .from("matches_vindeiros")
        .select("id, match_date, team1, team2, competition, updated_at")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const mapped = (data||[]).map(r => ({
        id: r.id,
        date_iso: r.match_date ? toISODate(r.match_date) : "", // para input[type=date]
        team1: r.team1 || "",
        team2: r.team2 || "",
        competition: r.competition || "",
      }));
      setRows(mapped);
      dbEnabledRef.current = true;
    } catch {
      dbEnabledRef.current = false;
      try {
        const raw = localStorage.getItem(lcKey);
        const parsed = raw ? JSON.parse(raw) : [];
        setRows(Array.isArray(parsed) ? parsed.slice(0,limit) : []);
      } catch { setRows([]); }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadFromDB(); }, []);

  function saveToLC(next) { try { localStorage.setItem(lcKey, JSON.stringify(next)); } catch {} }
  function updateRow(idx, patch){
    setRows(prev=>{
      const next = prev.slice();
      next[idx] = { ...(next[idx]||{}), ...patch };
      if (!dbEnabledRef.current) saveToLC(next);
      return next;
    });
  }
  function addCard(){
    setRows(prev=>{
      const base = { id:null, date_iso:"", team1:"", team2:"", competition:"" };
      const next = [base, ...prev].slice(0,limit);
      if (!dbEnabledRef.current) saveToLC(next);
      return next;
    });
  }

  async function onSave(idx){
    const r = rows[idx];
    if (!isAdmin){ showToast("Só admin pode gardar","err"); return; }

    let iso = r.date_iso ? parseDMYToISO(r.date_iso) : null; // de YYYY-MM-DD → YYYY-MM-DDT00:00:00
    if (r.date_iso && !iso){ showToast("DATA inválida","err"); return; }

    if (dbEnabledRef.current) {
      if (r.id) {
        const { error } = await supabase.from("matches_vindeiros")
          .update({
            match_date: iso,
            team1: r.team1 || null,
            team2: r.team2 || null,
            competition: r.competition || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", r.id);
        if (error){ showToast("Erro gardando","err"); return; }
      } else {
        const { data, error } = await supabase.from("matches_vindeiros")
          .insert({
            match_date: iso,
            team1: r.team1 || null,
            team2: r.team2 || null,
            competition: r.competition || null,
            updated_at: new Date().toISOString(),
          })
          .select().maybeSingle();
        if (error){ showToast("Erro gardando","err"); return; }
        updateRow(idx, { id: data?.id || null });
      }
    }
    showToast("Gardado!");
  }

  async function deleteByRowNumber() {
    if (!isAdmin) { showToast("Só admin pode borrar","err"); return; }
    const input = prompt("Indica o número de fila a eliminar (1–10):");
    if (!input) return;
    const n = parseInt(String(input).trim(), 10);
    if (!(n >= 1 && n <= limit)) { showToast("Número inválido","err"); return; }
    const idx = n - 1;
    const r = rows[idx];
    if (dbEnabledRef.current && r?.id) {
      const { error } = await supabase.from("matches_vindeiros").delete().eq("id", r.id);
      if (error) { showToast("Erro borrando","err"); return; }
    }
    setRows(prev => prev.filter((_,i)=>i!==idx));
    if (!dbEnabledRef.current){
      const next = rows.filter((_,i)=>i!==idx);
      saveToLC(next);
    }
    showToast("Eliminado");
  }

  const view = useMemo(()=> rows.slice(0,limit), [rows]);

  // tamaños móvil
  const fTeam = isMobile ? 13 : 14;
  const fNum  = isMobile ? 13 : 14;
  const hNum  = isMobile ? 24 : 28;
  const padTeam = isMobile ? "8px 10px" : "10px 12px";

  if (loading) {
    return (
      <main style={WRAP}>
        <h2 style={H1}>Vindeiros partidos</h2>
        <p style={SUB}>Axenda dos próximos encontros con data e hora confirmada</p>
      </main>
    );
  }

  return (
    <main style={WRAP}>
      <h2 style={H1}>Vindeiros partidos</h2>
      <p style={SUB}>Axenda dos próximos encontros con data e hora confirmada</p>

      {/* Barra superior: Engadir + papelera (más bonito y algo más pequeño) */}
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
          <button onClick={deleteByRowNumber}
            style={{ width:34, height:34, display:"grid", placeItems:"center", borderRadius:10, border:"1px solid #94d3f6", background:"#fff", boxShadow:"0 2px 8px rgba(14,165,233,.25)" }}
            title="Borrar por número de fila">
            <svg width="16" height="16" viewBox="0 0 24 24" style={ICON_STROKE("#0ea5e9")}>
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M7 6l1 12h8l1-12" />
            </svg>
          </button>
        )}
      </div>

      {view.map((r, idx)=>{
        const isCeltaHome = (r.team1 || "").toUpperCase().includes("CELTA");
        const accent = isCeltaHome ? "#0ea5e9" : "#dbe2f0";
        const cardStyle = { ...CARD_BASE, border: `1px solid ${isCeltaHome ? "#0ea5e9" : "#e5e7eb"}` };
        const matchCell = { ...MATCH_CELL_BASE, border:`1px solid ${accent}` };

        return (
          <section key={r.id || `v-${idx}`} style={cardStyle}>
            {/* Fila 1 */}
            <div style={FIRST_LINE}>
              <div style={matchCell}>
                <span style={{
                  ...NUMBOX_BASE,
                  height: hNum, minWidth: hNum, border:`1px solid ${accent}`,
                  background:isCeltaHome ? "#e0f2fe" : "#e2e8f0",
                  font:`800 ${fNum}px/1 Montserrat,system-ui,sans-serif`,
                }}>
                  {String(idx+1).padStart(2,"0")}
                </span>
                <input
                  style={{ ...TEAM_INPUT, padding: padTeam, font:`700 ${fTeam}px/1.2 Montserrat,system-ui,sans-serif` }}
                  value={r.team1}
                  placeholder="LOCAL"
                  size={(r.team1||"LOCAL").length}
                  onInput={(e)=>updateRow(idx,{ team1: e.currentTarget.value.toUpperCase() })}
                  readOnly={!isAdmin}
                />
                <span style={{ ...VS, font:`800 ${isMobile?11:12}px/1 Montserrat,system-ui,sans-serif` }}>vs</span>
                <input
                  style={{ ...TEAM_INPUT, padding: padTeam, font:`700 ${fTeam}px/1.2 Montserrat,system-ui,sans-serif` }}
                  value={r.team2}
                  placeholder="VISITANTE"
                  size={(r.team2||"VISITANTE").length}
                  onInput={(e)=>updateRow(idx,{ team2: e.currentTarget.value.toUpperCase() })}
                  readOnly={!isAdmin}
                />
              </div>
            </div>

            {/* Fila 2: DATA + COMP | Guardar */}
            <div style={SECOND_LINE}>
              <div style={MID_WRAP}>
                <label style={DATE_WRAP(accent)}>
                  {DATE_ICON("#0ea5e9")}
                  <input
                    type="date"
                    value={r.date_iso || ""}
                    onInput={(e)=>updateRow(idx,{ date_iso: e.currentTarget.value })}
                    readOnly={!isAdmin}
                    style={{
                      border:"none", outline:"none", background:"transparent",
                      font:"700 13px/1.2 Montserrat,system-ui,sans-serif",
                      color:"#0f172a",
                      width:"14ch", // largo para DD/MM/AA sin corte
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

              <button type="button" style={ICONBTN("#0ea5e9")} title="Gardar" onClick={()=>onSave(idx)} disabled={!isAdmin}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={ICON_STROKE("#0ea5e9")}>
                  <path d="M4 4h12l4 4v12H4V4Z" />
                  <path d="M7 4v6h10V4" />
                  <path d="M8 16h8v4H8z" />
                </svg>
              </button>
            </div>
          </section>
        );
      })}

      {toast && <Toast text={toast.text} kind={toast.kind} />}
    </main>
  );
}

