import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* ========= Helpers ========= */
const toDMY = (d) => {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    const y = new Intl.DateTimeFormat("sv-SE",{ year:"numeric", timeZone:"Europe/Madrid" }).format(dt);
    const m = new Intl.DateTimeFormat("sv-SE",{ month:"2-digit", timeZone:"Europe/Madrid" }).format(dt);
    const da= new Intl.DateTimeFormat("sv-SE",{ day:"2-digit", timeZone:"Europe/Madrid" }).format(dt);
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
const COMP_OPTIONS = ["LaLiga","Europa League","Copa do Rei"];
const lcKey = "hdc_vindeiros_cards_v1";

/* ========= Estilos ========= */
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
const BAR = { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 };
const PILL = { minWidth: 26, height: 22, borderRadius: 999, background: "#f1f5f9", color:"#0f172a", display:"grid", placeItems:"center", font:"700 12px/1 Montserrat,system-ui,sans-serif", padding: "0 8px" };

const FIELD_ROW = { display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 8 };
const ROW_2COL  = { display:"grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 };
const LABEL = { font:"700 11px/1.1 Montserrat,system-ui,sans-serif", color:"#334155", letterSpacing:".3px" };

const INPUT = {
  width:"100%", padding:"10px 12px", border:"1px solid #dbe2f0", borderRadius:10,
  font:"700 14px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", outline:"none",
};
const INPUT_SOFT = { ...INPUT, font:"700 13px/1.2 Montserrat,system-ui,sans-serif" };

const CHIP = {
  display:"inline-flex", alignItems:"center", gap:6, border:"1px solid #e5e7eb",
  padding:"8px 10px", borderRadius:10, background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)",
  font:"700 14px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", cursor:"pointer"
};
const MENU = {
  position:"absolute", marginTop:4, background:"#fff", border:"1px solid #e5e7eb",
  borderRadius:10, boxShadow:"0 10px 26px rgba(0,0,0,.12)", zIndex:30
};
const MENU_ITEM = {
  padding:"8px 12px", font:"600 13px/1.2 Montserrat,system-ui,sans-serif", cursor:"pointer", whiteSpace:"nowrap"
};

const ACTIONS = { display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, marginTop:4 };
const ICONBTN = {
  width:36, height:36, display:"grid", placeItems:"center", borderRadius:10, border:"1px solid #e5e7eb",
  background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.08)", cursor:"pointer"
};
const DANGER = { borderColor:"#fecaca", background:"#fff5f5" };

const TOAST = {
  position:"fixed", left:"50%", bottom:18, transform:"translateX(-50%)",
  background:"#0ea5e9", color:"#fff", padding:"8px 12px", borderRadius:10,
  font:"700 13px/1.2 Montserrat,system-ui,sans-serif", boxShadow:"0 10px 26px rgba(14,165,233,.4)", zIndex:1000
};

/* ========= Componente ========= */
export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // [{id, date_iso, team1, team2, competition, updated_at}]
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [menuAt, setMenuAt] = useState(null); // index da fila co menú aberto
  const dbEnabledRef = useRef(true); // si NON existe a táboa, cae en localStorage
  const limit = 10;

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

  // carga inicial: intenta BBDD; se falla → localStorage
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
        updated_at: r.updated_at || null
      }));
      setRows(mapped);
      dbEnabledRef.current = true;
    } catch {
      // fallback localStorage
      dbEnabledRef.current = false;
      try {
        const raw = localStorage.getItem(lcKey);
        const parsed = raw ? JSON.parse(raw) : [];
        setRows(Array.isArray(parsed) ? parsed.slice(0,limit) : []);
      } catch {
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadFromDB(); }, []);

  function saveToLC(next) {
    try {
      localStorage.setItem(lcKey, JSON.stringify(next));
    } catch {}
  }

  function setToast2s(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  function updateRow(idx, patch) {
    setRows(prev => {
      const next = prev.slice();
      const cur = next[idx] || {};
      next[idx] = { ...cur, ...patch };
      if (!dbEnabledRef.current) saveToLC(next);
      return next;
    });
  }

  function addCard() {
    setRows(prev => {
      const base = { id:null, date_iso:null, team1:"", team2:"", competition:"", updated_at: new Date().toISOString() };
      const next = [base, ...prev].slice(0,limit);
      if (!dbEnabledRef.current) saveToLC(next);
      return next;
    });
  }

  async function onDelete(idx) {
    const row = rows[idx];
    // En vindeiros permitimos borrar manual (só admin)
    if (!isAdmin) return;
    if (dbEnabledRef.current && row?.id) {
      await supabase.from("matches_vindeiros").delete().eq("id", row.id);
    }
    setRows(prev => {
      const next = prev.slice();
      next.splice(idx,1);
      if (!dbEnabledRef.current) saveToLC(next);
      return next;
    });
  }

  async function onSave(idx) {
    const row = rows[idx];
    // Validación DATA
    let date_iso = row.date_iso || null;
    if (typeof row.date_iso === "string" && /\d{2}\/\d{2}\/\d{4}/.test(row.date_iso)) {
      const p = parseDMY(row.date_iso);
      if (!p) { setToast2s("DATA inválida"); return; }
      date_iso = p;
    }

    if (!isAdmin) { setToast2s("Só admin pode gardar"); return; }

    // Persistencia
    if (dbEnabledRef.current) {
      if (row.id) {
        const { error } = await supabase.from("matches_vindeiros")
          .update({
            match_date: date_iso,
            team1: row.team1 || null,
            team2: row.team2 || null,
            competition: row.competition || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        if (error) { setToast2s("Erro gardando"); return; }
      } else {
        const { data, error } = await supabase.from("matches_vindeiros")
          .insert({
            match_date: date_iso,
            team1: row.team1 || null,
            team2: row.team2 || null,
            competition: row.competition || null,
            updated_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();
        if (error) { setToast2s("Erro gardando"); return; }
        updateRow(idx, { id: data?.id || null });
      }
    } else {
      // localStorage xa actualizado en edición
    }
    setToast2s("Gardado!");
  }

  const view = useMemo(() => rows.slice(0,limit), [rows]);

  if (loading) {
    return (
      <main style={WRAP}>
        <h2 style={H1}>Vindeiros partidos</h2>
        <p style={SUB}>Axenda dos próximos encontros con data e hora confirmada</p>
        {Array.from({length:4}).map((_,i)=>(
          <div key={i} style={{...CARD, height:96, background:"linear-gradient(90deg,#fff 25%,#f8fafc 37%,#fff 63%)", backgroundSize:"400% 100%", animation:"sh 1.2s ease infinite"}}>
            <style>{`@keyframes sh{0%{background-position:100% 0}100%{background-position:0 0}}`}</style>
          </div>
        ))}
      </main>
    );
  }

  return (
    <main style={WRAP}>
      <h2 style={H1}>Vindeiros partidos</h2>
      <p style={SUB}>Axenda dos próximos encontros con data e hora confirmada</p>

      {/* Acción engadir (só admin) */}
      {isAdmin && (
        <div style={{ marginBottom: 10 }}>
          <button onClick={addCard} style={{...CHIP}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M4 12h16" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/></svg>
            Engadir
          </button>
        </div>
      )}

      {view.map((r,idx)=> {
        const dmy = r.date_iso ? (/\d{4}-\d{2}-\d{2}/.test(r.date_iso) ? toDMY(r.date_iso) : r.date_iso) : "";
        return (
          <section key={r.id || `v-${idx}`} style={CARD}>
            {/* Barra superior */}
            <div style={BAR}>
              <span style={PILL}>{String(idx+1).padStart(2,"0")}</span>

              <div style={{ display:"grid", gap:4, flex:1 }}>
                <label style={LABEL}>DATA</label>
                <input
                  style={INPUT_SOFT}
                  value={dmy}
                  placeholder="dd/mm/aaaa"
                  onInput={(e)=>updateRow(idx,{ date_iso: e.currentTarget.value })}
                  readOnly={!isAdmin}
                />
              </div>

              <div style={{ position:"relative" }}>
                <label style={{...LABEL, marginBottom:4, display:"block"}}>COMPETICIÓN</label>
                <button
                  type="button"
                  style={CHIP}
                  onClick={()=> setMenuAt(menuAt===idx ? null : idx)}
                  disabled={!isAdmin}
                  aria-haspopup="listbox"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke="#0f172a" stroke-width="1.6"/>
                    <path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" stroke="#0f172a" stroke-width="1.6"/>
                    <path d="M9 14h6v3H9z" stroke="#0f172a" stroke-width="1.6"/>
                  </svg>
                  <span style={{ fontWeight:700, fontSize:15 }}>{r.competition || "—"}</span>
                </button>

                {menuAt===idx && (
                  <div style={MENU} role="listbox">
                    {COMP_OPTIONS.map(opt=>(
                      <div
                        key={opt}
                        style={{...MENU_ITEM, background: r.competition===opt ? "#f1f5f9" : "#fff"}}
                        onClick={()=>{ updateRow(idx,{ competition: opt }); setMenuAt(null); }}
                      >
                        {opt}
                      </div>
                    ))}
                    <div style={MENU_ITEM} onClick={()=>{ updateRow(idx,{ competition: "" }); setMenuAt(null); }}>—</div>
                  </div>
                )}
              </div>
            </div>

            {/* Partido */}
            <div style={ROW_2COL}>
              <div>
                <label style={LABEL}>EQUIPO 1</label>
                <input
                  style={INPUT}
                  value={r.team1}
                  placeholder="LOCAL"
                  onInput={(e)=>updateRow(idx,{ team1: e.currentTarget.value.toUpperCase() })}
                  readOnly={!isAdmin}
                />
              </div>
              <div>
                <label style={LABEL}>EQUIPO 2</label>
                <input
                  style={INPUT}
                  value={r.team2}
                  placeholder="VISITANTE"
                  onInput={(e)=>updateRow(idx,{ team2: e.currentTarget.value.toUpperCase() })}
                  readOnly={!isAdmin}
                />
              </div>
            </div>

            {/* Acciones */}
            <div style={ACTIONS}>
              <button type="button" style={ICONBTN} title="Revisar" onClick={()=>route("/proximo-partido")}>
                {/* Ollo */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="#0f172a" stroke-width="1.6"/>
                </svg>
              </button>

              <div style={{ display:"flex", gap:8 }}>
                {isAdmin && (
                  <button type="button" style={{...ICONBTN, ...DANGER}} title="Eliminar" onClick={()=>onDelete(idx)}>
                    {/* Lixo */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M4 7h16M9 7v12M15 7v12M6 7l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" stroke="#b91c1c" stroke-width="1.6" stroke-linecap="round"/>
                      <path d="M9 4h6l1 3H8l1-3Z" stroke="#b91c1c" stroke-width="1.6"/>
                    </svg>
                  </button>
                )}

                <button type="button" style={ICONBTN} title="Gardar" onClick={()=>onSave(idx)}>
                  {/* Disquete */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h12l4 4v12H4V4Z" stroke="#0f172a" stroke-width="1.6" />
                    <path d="M7 4v6h10V4" stroke="#0f172a" stroke-width="1.6" />
                    <path d="M8 16h8v4H8z" stroke="#0f172a" stroke-width="1.6" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        );
      })}

      {toast && <div style={TOAST}>{toast}</div>}
    </main>
  );
}


