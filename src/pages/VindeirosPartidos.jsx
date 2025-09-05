import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
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
const lcKey = "hdc_vindeiros_cards_v6";

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

const CHIP_BASE = {
  display:"inline-flex", alignItems:"center", gap:8,
  border:"1px solid #e5e7eb", padding:"8px 10px", borderRadius:10,
  background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)",
  font:"700 13px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", cursor:"pointer",
  minWidth: `${COMP_MIN_CH + 4}ch`, justifyContent:"space-between"
};
const ICON_TROPHY = (c="#0ea5e9") => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
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

export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // {id,date_iso,team1,team2,competition}
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
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
        date_iso: r.match_date || null,
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
  function toast2(msg){ setToast(msg); setTimeout(()=>setToast(""), 2000); }
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
      const base = { id:null, date_iso:null, team1:"", team2:"", competition:"" };
      const next = [base, ...prev].slice(0,limit);
      if (!dbEnabledRef.current) saveToLC(next);
      return next;
    });
  }

  async function onSave(idx){
    const r = rows[idx];
    if (!isAdmin){ toast2("Só admin pode gardar"); return; }

    let iso = r.date_iso;
    if (typeof iso === "string" && /\d{2}\/\d{2}\/(\d{2}|\d{4})/.test(iso)) {
      const p = parseDMYToISO(iso);
      if (!p){ toast2("DATA inválida"); return; }
      iso = p;
    }
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
        if (error){ toast2("Erro gardando"); return; }
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
        if (error){ toast2("Erro gardando"); return; }
        updateRow(idx, { id: data?.id || null });
      }
    }
    toast2("Gardado!");
  }

  async function deleteByRowNumber() {
    if (!isAdmin) { toast2("Só admin pode borrar"); return; }
    const input = prompt("Indica o número de fila a eliminar (1–10):");
    if (!input) return;
    const n = parseInt(String(input).trim(), 10);
    if (!(n >= 1 && n <= limit)) { toast2("Número de fila inválido"); return; }
    const idx = n - 1;
    const r = rows[idx];
    if (dbEnabledRef.current && r?.id) {
      const { error } = await supabase.from("matches_vindeiros").delete().eq("id", r.id);
      if (error) { toast2("Erro borrando"); return; }
    }
    setRows(prev => prev.filter((_,i)=>i!==idx));
    if (!dbEnabledRef.current){
      const next = rows.filter((_,i)=>i!==idx);
      saveToLC(next);
    }
    toast2("Eliminado");
  }

  const view = useMemo(()=> rows.slice(0,limit), [rows]);

  // tamaños móvil
  const fTeam = isMobile ? 13 : 14;
  const fNum  = isMobile ? 13 : 14;
  const hNum  = isMobile ? 24 : 28;
  const padTeam = isMobile ? "8px 10px" : "10px 12px";
  const fData = isMobile ? 12 : 13;

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

      {/* Barra superior: Engadir (ajustado al texto) + Borrar por nº (derecha) */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 10 }}>
        {isAdmin ? (
          <button
            onClick={addCard}
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"8px 10px", borderRadius:10, border:"1px solid #e5e7eb",
              background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)",
              font:"700 14px/1.2 Montserrat,system-ui,sans-serif"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M4 12h16" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/></svg>
            Engadir
          </button>
        ) : <span />}

        {isAdmin && (
          <button onClick={deleteByRowNumber} style={{ width:38, height:38, display:"grid", placeItems:"center", borderRadius:10, border:"1px solid #0ea5e9", background:"#fff", boxShadow:"0 2px 8px rgba(14,165,233,.35)" }} title="Borrar por número de fila">
            <svg width="18" height="18" viewBox="0 0 24 24" style={ICON_STROKE("#0ea5e9")}>
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M7 6l1 14h8l1-14" />
            </svg>
          </button>
        )}
      </div>

      {view.map((r, idx)=>{
        const dmy2 = r.date_iso ? (/\d{4}-\d{2}-\d{2}/.test(r.date_iso) ? toDMY2(r.date_iso) : r.date_iso) : "";
        const isCeltaHome = (r.team1 || "").toUpperCase().includes("CELTA");
        const accent = isCeltaHome ? "#0ea5e9" : "#dbe2f0";
        const cardStyle = { ...CARD_BASE, border: `1px solid ${isCeltaHome ? "#0ea5e9" : "#e5e7eb"}` };
        const matchCell = { ...MATCH_CELL_BASE, border:`1px solid ${accent}` };
        const inputSoft = { ...INPUT_SOFT_BASE, border:`1px solid ${accent}` };
        const chip = { ...CHIP_BASE, border:`1px solid ${accent}` };

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

            {/* Fila 2: centro (DATA + COMP) | guardar derecha */}
            <div style={SECOND_LINE}>
              <div style={MID_WRAP}>
                <input
                  style={{ ...inputSoft, font:`700 ${fData}px/1.2 Montserrat,system-ui,sans-serif`, width: "10ch", textTransform:"uppercase" }}
                  size={Math.max(10, (dmy2||"DD/MM/AA").length)}
                  value={dmy2}
                  placeholder="DD/MM/AA"
                  onInput={(e)=>updateRow(idx,{ date_iso: e.currentTarget.value })}
                  readOnly={!isAdmin}
                />

                <div style={{ position:"relative" }}>
                  <button
                    type="button"
                    style={{ ...chip, font:`700 ${isMobile?12:13}px/1.2 Montserrat,system-ui,sans-serif` }}
                    onClick={()=> setMenuAt(menuAt===idx ? null : idx)}
                    disabled={!isAdmin}
                    aria-haspopup="listbox"
                    title="Competición"
                  >
                    <span style={{display:"inline-flex", alignItems:"center", gap:6}}>
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

      {toast && (
        <div style={{
          position:"fixed", left:"50%", bottom:18, transform:"translateX(-50%)",
          background:"#0ea5e9", color:"#fff", padding:"8px 12px", borderRadius:10,
          font:"700 13px/1.2 Montserrat,system-ui,sans-serif", boxShadow:"0 10px 26px rgba(14,165,233,.4)", zIndex:1000
        }}>
          {toast}
        </div>
      )}
    </main>
  );
}

