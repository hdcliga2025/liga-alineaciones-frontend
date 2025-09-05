import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos / layout ===== */
const WRAP   = { maxWidth: 1080, margin: "0 auto", padding: "16px 12px 24px" };
const H1     = { font:"700 20px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", margin:"0 0 8px" };

const BTN_ADD_WRAP = { margin: "10px 0 16px" };
const BTN_ADD = {
  display:"inline-flex", alignItems:"center", gap:10,
  border:"1px solid #38bdf8",
  backgroundImage:"linear-gradient(180deg,#67b1ff,#5a8df5)",
  color:"#fff",
  padding:"12px 40px", borderRadius:12, cursor:"pointer",
  boxShadow:"0 12px 28px rgba(14,165,233,.28)",
  font:"800 14px/1 Montserrat,system-ui,sans-serif", letterSpacing:".25px"
};

const LIST   = { display:"grid", gap:10 };
const CARD   = {
  background:"#f3f6f9",
  border:"1px solid #e5e7eb",
  borderRadius:14,
  boxShadow:"0 6px 18px rgba(0,0,0,.06)",
  padding:"10px 10px 12px",
};
const CARD_SAVED = { border:"2px solid #0ea5e9", background:"#f3f6f9" };

/* Fila 1: nº + ojo + equipos (wrapper único con 'vs' integrado) */
const ROW1 = {
  display:"grid",
  gridTemplateColumns:"auto auto 1fr",
  alignItems:"center",
  gap:10,
  marginBottom:8
};
const NUMBOX = {
  minWidth:36, height:36, border:"1px solid #cbd5e1", borderRadius:6,
  display:"grid", placeItems:"center", background:"#fff",
  font:"700 14px/1 Montserrat,system-ui,sans-serif", color:"#0f172a"
};
const EYE_BTN = {
  width:36, height:36, display:"grid", placeItems:"center",
  border:"1px solid #e5e7eb", background:"#fff", borderRadius:10,
  cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,.06)"
};

/* Campo integrado Equipos */
const TEAMWRAP = {
  display:"grid",
  gridTemplateColumns:"1fr auto 1fr",
  alignItems:"center",
  gap:0,
  border:"1px solid #dbe2f0",
  borderRadius:10,
  background:"#fff",
  overflow:"hidden"
};
const TEAM_INPUT = (editable) => ({
  width:"100%",
  minWidth:0,
  border:"none",
  padding:"10px 12px",
  outline:"none",
  background:"transparent",
  font:`${editable ? "700" : "600"} 14px/1.2 Montserrat,system-ui,sans-serif`,
  color:"#0f172a"
});
const VS = {
  padding:"0 10px",
  font:"700 13px/1 Montserrat,system-ui,sans-serif",
  color:"#64748b",
  borderLeft:"1px solid #e5e7eb",
  borderRight:"1px solid #e5e7eb"
};

/* Fila 2: data + competición */
const ROW2 = { display:"grid", gridTemplateColumns:"minmax(160px, 240px) 1fr", gap:8, alignItems:"center" };
const INPUT_DATE = (editable) => ({
  width:"100%", border:"1px solid #dbe2f0", borderRadius:10, padding:"8px 10px",
  background:"#fff", outline:"none",
  font:`${editable ? "700" : "600"} 13px/1.1 Montserrat,system-ui,sans-serif`,
  color:"#0f172a", letterSpacing:".2px"
});
const SELECT_WRAP = { position:"relative" };
const SELECT_COMP = (editable) => ({
  width:"100%", border:"1px solid #dbe2f0", borderRadius:10,
  padding:"10px 44px 10px 46px",
  background:"#fff", outline:"none",
  appearance:"none", WebkitAppearance:"none", MozAppearance:"none",
  font:`${editable ? "700" : "600"} 13px/1.1 Montserrat,system-ui,sans-serif`,
  color:"#0f172a"
});
const ICON_TROPHY = {
  position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
  pointerEvents:"none"
};
const ICON_CHEV   = { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", opacity:.9 };

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

export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // {id,equipo1,equipo2,match_date,competition}
  const [busy, setBusy] = useState(false);
  const timersRef = useRef({}); // auto-guardado por fila

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
    return () => {
      Object.values(timersRef.current||{}).forEach((t)=> clearTimeout(t));
      timersRef.current = {};
    };
  }, []);

  async function loadList() {
    const { data } = await supabase
      .from("matches_vindeiros")
      .select("id,equipo1,equipo2,match_date,competition,updated_at,created_at")
      .order("match_date", { ascending: true }); // máis próxima primeiro
    setRows(Array.isArray(data) ? data : []);
  }
  useEffect(()=>{ loadList(); }, []);

  async function saveRow(local) {
    const payload = {
      id: local.id || undefined,
      equipo1: (local.equipo1||"").toUpperCase(),
      equipo2: (local.equipo2||"").toUpperCase(),
      competition: local.competition || null,
      match_date: local.match_date || null,
      updated_at: new Date().toISOString(),
    };
    const q = local.id
      ? supabase.from("matches_vindeiros").update(payload).eq("id", local.id)
      : supabase.from("matches_vindeiros").insert(payload).select().single();
    const { data, error } = await q;
    if (error) throw error;
    return data || payload;
  }

  function scheduleAutoSave(i, nextRow){
    if (!isAdmin) return;
    const ok = nextRow.equipo1 && nextRow.equipo2 && nextRow.match_date && nextRow.competition;
    if (!ok) return;
    if (timersRef.current[i]) clearTimeout(timersRef.current[i]);
    timersRef.current[i] = setTimeout(async ()=>{
      try {
        setBusy(true);
        const saved = await saveRow(nextRow);
        setRows(prev=>{
          const n = prev.slice();
          n[i] = { ...(n[i]||nextRow), id: saved?.id ?? n[i]?.id, __saved:true, _tmp:false };
          return n;
        });
        await loadList();
      } finally { setBusy(false); }
    }, 600);
  }

  function setLocal(i, patch){
    setRows(prev=>{
      const n = prev.slice();
      const nextRow = { ...n[i], ...patch, __saved:false };
      n[i] = nextRow;
      scheduleAutoSave(i, nextRow);
      return n;
    });
  }

  async function onAdd() {
    if (!isAdmin) return;
    setRows((r)=>[
      { id:null, equipo1:"", equipo2:"", match_date:null, competition:"", _tmp:true, __saved:false },
      ...r
    ]);
  }

  /* Vista:
     - Solo admin ve temporales y puede editar.
     - Público ve solo filas guardadas (con id).
     - Numeración visual: mayor arriba → menor abajo.
  */
  const view = useMemo(()=>{
    const base = isAdmin ? rows : rows.filter(r=>r?.id);
    const total = base.length;
    return base.map((r, idx)=>({ ...r, _numDisp: pad2(total - idx) })); // menor queda abaixo
  }, [rows, isAdmin]);

  return (
    <main style={WRAP}>
      <h2 style={H1}>Axenda dos próximos encontros con data e hora confirmada</h2>

      {isAdmin && (
        <div style={BTN_ADD_WRAP}>
          <button type="button" style={BTN_ADD} onClick={onAdd}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{stroke:"#fff",strokeWidth:2}}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Engadir
          </button>
        </div>
      )}

      <section style={LIST}>
        {view.map((r, i) => {
          const editable = !!isAdmin;
          const savedStyle = r.__saved ? CARD_SAVED : null;
          const ymd = isoToYMD(r.match_date);

          return (
            <article key={r.id || `n-${i}`} style={{ ...CARD, ...(savedStyle||{}) }}>
              {/* Fila 1: número + ojo + equipos (campo integrado) */}
              <div style={ROW1}>
                <div style={NUMBOX}>{r._numDisp}</div>

                <a href="/resultados-ultima-alineacion" title="Revisar resultados" style={EYE_BTN} aria-label="Revisar resultados">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="#0f172a" strokeWidth="1.6"/>
                  </svg>
                </a>

                <div style={TEAMWRAP}>
                  <input
                    style={TEAM_INPUT(editable)}
                    value={r.equipo1 || ""}
                    onInput={(e)=> editable && setLocal(i, { equipo1: e.currentTarget.value })}
                    placeholder="Equipo 1"
                    readOnly={!editable}
                  />
                  <span style={VS}>vs</span>
                  <input
                    style={TEAM_INPUT(editable)}
                    value={r.equipo2 || ""}
                    onInput={(e)=> editable && setLocal(i, { equipo2: e.currentTarget.value })}
                    placeholder="Equipo 2"
                    readOnly={!editable}
                  />
                </div>
              </div>

              {/* Fila 2: data + competición */}
              <div style={ROW2}>
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
                  {/* Trofeo celeste grande */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={ICON_TROPHY} aria-hidden="true">
                    <path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke="#0ea5e9" strokeWidth="1.8"/>
                    <path d="M9 14h6v3H9z" stroke="#0ea5e9" strokeWidth="1.8"/>
                  </svg>
                  <select
                    style={SELECT_COMP(editable)}
                    value={r.competition || ""}
                    disabled={!editable}
                    onChange={(e)=> editable && setLocal(i, { competition: e.currentTarget.value })}
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
              </div>
            </article>
          );
        })}

        {!view.length && (
          <p style={{ margin:"10px 2px", color:"#64748b" }}>
            {isAdmin ? "Non hai encontros. Preme Engadir para crear un novo." : "Non hai encontros dispoñibles."}
          </p>
        )}
      </section>
    </main>
  );
}

