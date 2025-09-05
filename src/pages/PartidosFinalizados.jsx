import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos / layout ===== */
const WRAP   = { maxWidth: 1080, margin: "0 auto", padding: "16px 12px 24px" };
const H1     = { font:"700 20px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", margin:"0 0 8px" };

const BTN_ADD_WRAP = { margin: "4px 0 14px" };
const BTN_ADD = {
  display:"inline-flex", alignItems:"center", gap:8,
  border:"1px solid #0ea5e9", background:"#fff",
  padding:"10px 18px", borderRadius:12, cursor:"pointer",
  boxShadow:"0 10px 24px rgba(14,165,233,.18)", color:"#0ea5e9",
  font:"700 14px/1 Montserrat,system-ui,sans-serif", letterSpacing:".2px"
};

const LIST   = { display:"grid", gap:10 };
const CARD   = {
  background:"#f3f6f9",
  border:"1px solid #e5e7eb",
  borderRadius:14,
  boxShadow:"0 6px 18px rgba(0,0,0,.06)",
  padding:"10px 10px 12px",
};
const CARD_SAVED = { border:"2px solid #0ea5e9", background:"#f0f9ff" };

const ROW1 = { display:"grid", gridTemplateColumns:"auto 1fr", alignItems:"center", gap:10, marginBottom:8 };
const NUMBOX = {
  minWidth:32, height:32, border:"1px solid #cbd5e1", borderRadius:6,
  display:"grid", placeItems:"center", background:"#fff",
  font:"700 14px/1 Montserrat,system-ui,sans-serif", color:"#0f172a"
};
const TEAMLINE = { display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:6 };
const INPUT_TEAM = (editable) => ({
  width:"100%", border:"1px solid #dbe2f0", borderRadius:10, padding:"8px 10px",
  background:"#fff", outline:"none",
  font:`${editable ? "700" : "600"} 14px/1.2 Montserrat,system-ui,sans-serif`,
  color:"#0f172a"
});
const VS = { font:"700 13px/1 Montserrat,system-ui,sans-serif", color:"#64748b" };

const ROW2 = { display:"grid", gridTemplateColumns:"minmax(140px, 220px) 1fr auto", gap:8, alignItems:"center" };
const INPUT_DATE = (editable) => ({
  width:"100%", border:"1px solid #dbe2f0", borderRadius:10, padding:"8px 10px",
  background:"#fff", outline:"none",
  font:`${editable ? "700" : "600"} 13px/1.1 Montserrat,system-ui,sans-serif`,
  color:"#0f172a", letterSpacing:".2px"
});
const SELECT_COMP = (editable) => ({
  width:"100%", border:"1px solid #dbe2f0", borderRadius:10, padding:"10px 40px 10px 42px",
  background:"#fff", outline:"none", appearance:"none", WebkitAppearance:"none", MozAppearance:"none",
  font:`${editable ? "700" : "600"} 13px/1.1 Montserrat,system-ui,sans-serif`,
  color:"#0f172a"
});
const ICON_TROPHY = {
  position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
  pointerEvents:"none", opacity:.95
};
const ICON_CHEV   = { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", opacity:.9 };

const ACTIONS = { display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end" };
const ICONBTN = (color="#0ea5e9") => ({
  width:34, height:34, display:"grid", placeItems:"center",
  borderRadius:8, border:`1px solid ${color}`, color, background:"#fff",
  boxShadow:"0 6px 16px rgba(14,165,233,.18)", cursor:"pointer"
});

/* ===== Utils ===== */
const pad2 = (n)=>String(n).padStart(2,"0");
const isoToYMD = (iso)=> {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
};
const ymdToISO = (ymd)=> {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

function splitTeams(s=""){
  const m = String(s).split(/\s+vs\s+/i);
  return { t1: (m[0]||"").trim(), t2: (m[1]||"").trim() };
}

function joinTeams(t1, t2){
  const a = (t1||"").trim(); const b = (t2||"").trim();
  return a && b ? `${a} vs ${b}` : (a||b||"");
}

export default function PartidosFinalizados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // {id, partido, match_date, competition}
  const [busy, setBusy] = useState(false);

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
      .select("id, match_date, partido, competition, updated_at, created_at")
      .order("match_date", { ascending: false });
    setRows(Array.isArray(data) ? data : []);
  }
  useEffect(()=>{ loadList(); }, []);

  async function saveRow(local) {
    const payload = {
      id: local.id || undefined,
      partido: local.partido || null,
      competition: local.competition || null,
      match_date: local.match_date || null,
      updated_at: new Date().toISOString(),
    };
    const q = local.id
      ? supabase.from("matches_finalizados").update(payload).eq("id", local.id)
      : supabase.from("matches_finalizados").insert(payload).select().single();
    const { data, error } = await q;
    if (error) throw error;
    return data || payload;
  }

  function setLocal(i, patch){
    setRows(prev=>{
      const n = prev.slice();
      n[i] = { ...n[i], ...patch };
      return n;
    });
  }

  async function onAdd() {
    if (!isAdmin) return;
    setRows((r)=>[
      { id:null, partido:"", match_date:null, competition:null, _tmp:true },
      ...r
    ]);
  }

  async function onSave(i){
    if (busy) return;
    try {
      setBusy(true);
      const r = rows[i];
      if (!r) return;
      if (!(r.partido && r.match_date && r.competition)) return;
      const saved = await saveRow(r);
      setLocal(i, { id: saved.id ?? r.id, __saved:true, _tmp:false });
      await loadList();
    } finally { setBusy(false); }
  }

  const view = useMemo(()=>{
    const base = isAdmin ? rows : rows.filter(r=>r?.id);
    return base.map((r, idx)=>({ ...r, _num: idx+1 }));
  }, [rows, isAdmin]);

  return (
    <main style={WRAP}>
      <h2 style={H1}>Histórico dos encontros do Celta na tempada 2025/2026</h2>
      {isAdmin && (
        <div style={BTN_ADD_WRAP}>
          <button type="button" style={BTN_ADD} onClick={onAdd}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{stroke:"#0ea5e9",strokeWidth:2}}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Engadir
          </button>
        </div>
      )}

      <section style={{ display:"grid", gap:10 }}>
        {view.map((r, i) => {
          const editable = !!isAdmin;
          const savedStyle = r.__saved ? CARD_SAVED : null;
          const ymd = isoToYMD(r.match_date);
          const { t1, t2 } = splitTeams(r.partido||"");

          return (
            <article key={r.id || `n-${i}`} style={{ ...CARD, ...(savedStyle||{}) }}>
              {/* Fila 1 */}
              <div style={ROW1}>
                <div style={NUMBOX}>{String(r._num||i+1).padStart(2,"0")}</div>
                <div style={TEAMLINE}>
                  <input
                    style={INPUT_TEAM(editable)}
                    value={t1}
                    onInput={(e)=> editable && setLocal(i, { partido: (e.currentTarget.value.toUpperCase()||"") + (t2?` vs ${t2.toUpperCase()}`:""), __saved:false })}
                    placeholder="Equipo 1"
                    readOnly={!editable}
                  />
                  <span style={VS}>vs</span>
                  <input
                    style={INPUT_TEAM(editable)}
                    value={t2}
                    onInput={(e)=> editable && setLocal(i, { partido: (t1?`${t1.toUpperCase()} vs `:"") + (e.currentTarget.value.toUpperCase()||""), __saved:false })}
                    placeholder="Equipo 2"
                    readOnly={!editable}
                  />
                </div>
              </div>

              {/* Fila 2 */}
              <div style={ROW2}>
                <input
                  type="date"
                  style={INPUT_DATE(editable)}
                  value={ymd}
                  onInput={(e)=>{
                    if (!editable) return;
                    const iso = ymdToISO(e.currentTarget.value);
                    setLocal(i, { match_date: iso, __saved:false });
                  }}
                  readOnly={!editable}
                  disabled={!editable}
                />

                <div style={{ position:"relative" }}>
                  {/* Icono trofeo más grande y celeste */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={ICON_TROPHY} aria-hidden="true">
                    <path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke="#0ea5e9" strokeWidth="1.8"/>
                    <path d="M9 14h6v3H9z" stroke="#0ea5e9" strokeWidth="1.8"/>
                  </svg>
                  <select
                    style={SELECT_COMP(editable)}
                    value={r.competition || ""}
                    disabled={!editable}
                    onChange={(e)=> editable && setLocal(i, { competition: e.currentTarget.value, __saved:false })}
                  >
                    <option value="">(selecciona)</option>
                    <option value="LaLiga">LaLiga</option>
                    <option value="Europa League">Europa League</option>
                    <option value="Copa do Rei">Copa do Rei</option>
                  </select>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={ICON_CHEV} aria-hidden="true">
                    <path d="M6 9l6 6 6-6" stroke="#0f172a" strokeWidth="2"/>
                  </svg>
                </div>

                <div style={ACTIONS}>
                  {/* Ver (cara a ranking do partido; temporalmente a /proximo-partido) */}
                  <button
                    type="button"
                    title="Revisar"
                    style={ICONBTN()}
                    onClick={()=> route("/proximo-partido")}
                    aria-label="Revisar"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{stroke:"#0ea5e9",strokeWidth:2}}>
                      <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      title="Gardar"
                      style={ICONBTN()}
                      onClick={()=>onSave(i)}
                      disabled={busy}
                      aria-label="Gardar"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{stroke:"#0ea5e9",strokeWidth:2}}>
                        <path d="M4 4h12l4 4v12H4z" />
                        <path d="M8 4v6h8V4" />
                        <path d="M8 16h8v4H8z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {!view.length && (
          <p style={{ margin:"10px 2px", color:"#64748b" }}>
            {isAdmin ? "Non hai partidos finalizados. Podes engadir rexistros." : "Aínda non hai partidos finalizados rexistrados."}
          </p>
        )}
      </section>
    </main>
  );
}
