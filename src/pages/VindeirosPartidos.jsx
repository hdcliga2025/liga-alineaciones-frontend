import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos base (idénticos a Finalizados) ===== */
const WRAP   = { maxWidth: 1080, margin: "0 auto", padding: "16px 12px 24px" };
const H1     = { font:"800 22px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", margin:"0 0 4px" };
const SUBTXT = { font:"400 12px/1.2 Montserrat,system-ui,sans-serif", color:"#64748b", margin:"0 0 10px" };

const TOPBAR = { display:"flex", alignItems:"center", gap:12, margin:"6px 0 14px" };
const BTN_ADD = {
  display:"inline-flex", alignItems:"center", gap:10,
  border:"1px solid #38bdf8",
  backgroundImage:"linear-gradient(180deg,#6cc7ff,#4da7f3)",
  color:"#fff",
  padding:"7px 56px",
  borderRadius:12, cursor:"pointer",
  boxShadow:"0 12px 28px rgba(14,165,233,.25)",
  font:"800 14px/1 Montserrat,system-ui,sans-serif", letterSpacing:".25px",
  userSelect:"none"
};

const LIST   = { display:"grid", gap:10 };
const CARD   = {
  background:"#f3f6f9",
  border:"1px solid #e5e7eb",
  borderRadius:14,
  boxShadow:"0 6px 18px rgba(0,0,0,.06)",
  padding:"10px 10px 12px",
};
const CARD_SAVED = {
  border:"2px solid #0ea5e9",
  background:"linear-gradient(180deg, #f2fbff 0%, #f7fbff 100%)"
};

const ROW1 = { display:"grid", gridTemplateColumns:"auto 1fr", alignItems:"center", gap:10, marginBottom:8 };
const NUMBOX = {
  minWidth:36, height:36, border:"1px solid #cbd5e1", borderRadius:6,
  display:"grid", placeItems:"center", background:"#fff",
  font:"700 14px/1 Montserrat,system-ui,sans-serif", color:"#0f172a"
};
const NUMBOX_SAVED = { border:"2px solid #0ea5e9" };

const EYE_BTN = {
  width:36, height:36, display:"grid", placeItems:"center",
  border:"1px solid #e5e7eb", background:"#fff", borderRadius:10,
  cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,.06)"
};

const TEAMWRAP = {
  display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center",
  border:"1px solid #dbe2f0", borderRadius:10, background:"#fff", overflow:"hidden"
};
const TEAM_INPUT = (editable) => ({
  width:"100%", minWidth:0, border:"none", padding:"10px 12px",
  outline:"none", background:"transparent",
  font:`${editable ? "700" : "600"} 14px/1.2 Montserrat,system-ui,sans-serif`,
  color:"#0f172a", textTransform:"uppercase"
});
const VS = { padding:"0 10px", font:"700 13px/1 Montserrat,system-ui,sans-serif", color:"#64748b", borderLeft:"1px solid #e5e7eb", borderRight:"1px solid #e5e7eb" };

const ROW2 = { display:"grid", gridTemplateColumns:"40px minmax(170px, 220px) 1fr", gap:8, alignItems:"center" };
const INPUT_DATE = (editable) => ({
  width:"100%", border:"1px solid #dbe2f0", borderRadius:10, padding:"8px 10px",
  background:"#fff", outline:"none",
  font:`${editable ? "700" : "600"} 13px/1.1 Montserrat,system-ui,sans-serif`,
  color:"#0f172a", letterSpacing:".2px"
});
const SELECT_WRAP = { position:"relative" };
const SELECT_COMP = (editable) => ({
  width:"100%", border:"1px solid #dbe2f0", borderRadius:10,
  padding:"10px 48px 10px 52px",
  background:"#fff", outline:"none",
  appearance:"none", WebkitAppearance:"none", MozAppearance:"none",
  font:`${editable ? "700" : "600"} 13px/1.1 Montserrat,system-ui,sans-serif`,
  color:"#0f172a", textTransform:"uppercase"
});
const ICON_TROPHY = {
  position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
  pointerEvents:"none"
};
const ICON_TROPHY_SVG = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 4h10v2a5 5 0 01-10 0V4Z" stroke="#0ea5e9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 4H4a3 3 0 0 0 3 5" stroke="#0ea5e9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18 4h2a3 3 0 0 1-3 5" stroke="#0ea5e9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 14h6v3H9z" stroke="#0ea5e9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 20h8" stroke="#0ea5e9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="10" r="1" fill="#0ea5e9"/>
  </svg>
);
const ICON_CHEV   = { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", opacity:.9 };

/* Utils */
const pad2 = (n)=>String(n).padStart(2,"0");
const isoToYMD = (iso)=> {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const ymdToISO = (ymd)=> {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  // local (10)
  const [rows, setRows] = useState(
    Array.from({length:10}, ()=>({ partido:"", match_date:null, competition:"", __saved:false }))
  );

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

  function setLocal(i, patch){
    setRows(prev=>{
      const n = prev.slice();
      n[i] = { ...n[i], ...patch };
      // marca visual de “gardado” (local) cando os 4 campos están cheos
      const parts = String(n[i].partido||"").toUpperCase().split(/\s+VS\s+/);
      const ok = (parts[0]||"").trim() && (parts[1]||"").trim() && !!n[i].match_date && (n[i].competition||"").trim();
      n[i].__saved = !!ok;
      return n;
    });
  }

  function onAdd(){
    if (!isAdmin) return;
    setRows(r=>[
      { partido:"", match_date:null, competition:"", __saved:false },
      ...r
    ]);
  }

  const view = useMemo(()=>{
    const total = rows.length;
    return rows.map((r, idx)=> ({ ...r, _numDisp: pad2(total - idx) }));
  }, [rows]);

  return (
    <main style={WRAP}>
      <h2 style={H1}>VINDEIROS PARTIDOS</h2>
      <p style={SUBTXT}>Próximos partidos a xogar polo Celta con data programada.</p>

      <div style={TOPBAR}>
        {isAdmin && (
          <button type="button" style={BTN_ADD} onClick={onAdd}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{stroke:"#fff",strokeWidth:2}}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Engadir
          </button>
        )}
      </div>

      <section style={LIST}>
        {view.map((r, i) => {
          const editable = !!isAdmin;
          const ymd = isoToYMD(r.match_date);
          const cardStyle = r.__saved ? { ...CARD, ...CARD_SAVED } : CARD;
          const parts = String(r.partido || "").split(/\s+vs\s+/i);
          const t1 = (parts[0]||"").toUpperCase();
          const t2 = (parts[1]||"").toUpperCase();

          return (
            <article key={`v-${i}`} style={cardStyle}>
              {/* Fila 1: nº + equipos */}
              <div style={ROW1}>
                <div style={r.__saved ? { ...NUMBOX, ...NUMBOX_SAVED } : NUMBOX}>{r._numDisp}</div>

                <div style={TEAMWRAP}>
                  <input
                    style={TEAM_INPUT(editable)}
                    value={t1}
                    onInput={(e)=> {
                      if (!editable) return;
                      const left = (e.currentTarget.value||"").toUpperCase();
                      setLocal(i, { partido: left + (t2 ? ` vs ${t2}` : "") });
                    }}
                    placeholder="EQUIPO 1"
                    readOnly={!editable}
                  />
                  <span style={VS}>vs</span>
                  <input
                    style={TEAM_INPUT(editable)}
                    value={t2}
                    onInput={(e)=> {
                      if (!editable) return;
                      const right = (e.currentTarget.value||"").toUpperCase();
                      setLocal(i, { partido: (t1 ? `${t1} vs ` : "EQUIPO 1 vs ") + right });
                    }}
                    placeholder="EQUIPO 2"
                    readOnly={!editable}
                  />
                </div>
              </div>

              {/* Fila 2: Ollo (izq) + data + competición (só visual en Vindeiros) */}
              <div class="pf-row2" style={ROW2}>
                <a
                  href="/resultados-ultima-alineacion"
                  title="Revisar"
                  style={EYE_BTN}
                  aria-label="Revisar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="#0ea5e9" strokeWidth="1.8"/>
                  </svg>
                </a>

                <input
                  type="date"
                  style={INPUT_DATE(editable)}
                  value={ymd}
                  onInput={(e)=>{
                    if (!editable) return;
                    const iso = ymdToISO(e.currentTarget.value);
                    setLocal(i, { match_date: iso });
                  }}
                  readOnly={!editable}
                  disabled={!editable}
                />

                <div style={SELECT_WRAP}>
                  <span style={ICON_TROPHY}>{ICON_TROPHY_SVG}</span>
                  <select
                    style={SELECT_COMP(editable)}
                    value={r.competition || ""}
                    disabled={!editable}
                    onChange={(e)=> {
                      if (!editable) return;
                      setLocal(i, { competition: e.currentTarget.value });
                    }}
                  >
                    <option value="">(SELECCIONA)</option>
                    <option value="LaLiga">LALIGA</option>
                    <option value="Europa League">EUROPA LEAGUE</option>
                    <option value="Copa do Rei">COPA DO REI</option>
                  </select>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={ICON_CHEV} aria-hidden="true">
                    <path d="M6 9l6 6 6-6" stroke="#0f172a" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

