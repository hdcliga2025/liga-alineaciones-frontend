import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ====== Estilos base (tarxetas, responsive) ====== */
const WRAP   = { maxWidth: 1080, margin: "0 auto", padding: "16px 12px 24px" };
const HEADER = { display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:12 };
const H1     = { font:"700 20px/1.2 Montserrat,system-ui,sans-serif", color:"#0f172a", margin:0 };

const BTN_ADD = {
  display:"inline-flex", alignItems:"center", gap:8,
  border:"1px solid #0ea5e9", background:"#fff",
  padding:"8px 12px", borderRadius:10, cursor:"pointer",
  boxShadow:"0 8px 20px rgba(14,165,233,.18)", color:"#0ea5e9",
  font:"700 14px/1 Montserrat,system-ui,sans-serif"
};

const LIST   = { display:"grid", gap:10 };
const CARD   = {
  background:"#f3f6f9", // gris claro de fondo unificador
  border:"1px solid #e5e7eb",
  borderRadius:14,
  boxShadow:"0 6px 18px rgba(0,0,0,.06)",
  padding:"10px 10px 12px",
};
const CARD_SAVED = { border:"2px solid #0ea5e9", background:"#f0f9ff" }; // confirmación de gardado

const ROW1 = { display:"grid", gridTemplateColumns:"auto 1fr", alignItems:"center", gap:10, marginBottom:8 };
const NUMBOX = {
  minWidth:30, height:30, border:"1px solid #cbd5e1", borderRadius:6,
  display:"grid", placeItems:"center", background:"#fff",
  font:"700 14px/1 Montserrat,system-ui,sans-serif", color:"#0f172a"
};
const TEAMLINE = {
  display:"grid",
  gridTemplateColumns:"1fr auto 1fr",
  alignItems:"center",
  gap:6
};
const INPUT_TEAM = (editable) => ({
  width:"100%", border:"1px solid #dbe2f0", borderRadius:10, padding:"8px 10px",
  background:"#fff", outline:"none",
  font:`${editable ? "700" : "600"} 14px/1.2 Montserrat,system-ui,sans-serif`,
  color:"#0f172a"
});
const VS = { font:"700 13px/1 Montserrat,system-ui,sans-serif", color:"#64748b" };

const ROW2 = { display:"grid", gridTemplateColumns:"minmax(120px, 200px) 1fr auto", gap:8, alignItems:"center" };
const INPUT_DATE = (editable) => ({
  width:"100%", border:"1px solid #dbe2f0", borderRadius:10, padding:"8px 10px",
  background:"#fff", outline:"none",
  font:`${editable ? "700" : "600"} 13px/1.1 Montserrat,system-ui,sans-serif`,
  color:"#0f172a", letterSpacing:".2px"
});
const SELECT_COMP = (editable) => ({
  width:"100%", border:"1px solid #dbe2f0", borderRadius:10, padding:"8px 36px 8px 36px",
  background:"#fff", outline:"none", appearance:"none", WebkitAppearance:"none", MozAppearance:"none",
  font:`${editable ? "700" : "600"} 13px/1.1 Montserrat,system-ui,sans-serif`,
  color:"#0f172a"
});
const ICON_TROPHY = { position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", opacity:.8 };
const ICON_CHEV   = { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", opacity:.9 };

const ACTIONS = { display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end" };
const ICONBTN = (color="#0ea5e9") => ({
  width:34, height:34, display:"grid", placeItems:"center",
  borderRadius:8, border:`1px solid ${color}`, color, background:"#fff",
  boxShadow:"0 6px 16px rgba(14,165,233,.18)", cursor:"pointer"
});

/* ====== Utils ====== */
const pad2 = (n)=>String(n).padStart(2,"0");
/* dd/mm/aa ó dd/mm/aaaa → ISO */
function parseDMYtoISO(s) {
  const m = /^\s*(\d{2})\/(\d{2})\/(\d{2}|\d{4})\s*$/.exec(String(s||""));
  if (!m) return null;
  let [_, dd, mm, yy] = m;
  if (yy.length === 2) yy = `20${yy}`; // 25 → 2025
  const iso = `${yy}-${mm}-${dd}T00:00:00`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
function isoToDMY2(iso){ // → dd/mm/aa (2 díxitos ano)
  try {
    const d = new Date(iso);
    const DD = pad2(d.getDate());
    const MM = pad2(d.getMonth()+1);
    const YY = String(d.getFullYear()).slice(-2);
    return `${DD}/${MM}/${YY}`;
  } catch { return ""; }
}

export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // {id,equipo1,equipo2,match_date,competition,updated_at}
  const [busy, setBusy] = useState(false);

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
  }, []);

  async function loadList() {
    const { data } = await supabase
      .from("matches_vindeiros")
      .select("id,equipo1,equipo2,match_date,competition,updated_at,created_at")
      .order("match_date", { ascending: true });
    setRows(Array.isArray(data) ? data : []);
  }
  useEffect(()=>{ loadList(); }, []);

  // gardar (insert/update)
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

  async function onAdd() {
    if (!isAdmin) return;
    setRows((r)=>[
      { id:null, equipo1:"", equipo2:"", match_date:null, competition:null, _tmp:true },
      ...r
    ]);
  }

  async function onDelete(id) {
    if (!isAdmin || !id) return;
    await supabase.from("matches_vindeiros").delete().eq("id", id);
    await loadList();
  }

  function setLocal(i, patch){
    setRows(prev=>{
      const n = prev.slice();
      n[i] = { ...n[i], ...patch };
      return n;
    });
  }

  async function onSave(i) {
    if (busy) return;
    try {
      setBusy(true);
      const r = rows[i];
      if (!r) return;
      // validar 4 campos
      if (!(r.equipo1 && r.equipo2 && r.match_date && r.competition)) return;
      const saved = await saveRow(r);
      // marca visual saved
      setLocal(i, { id: saved.id ?? r.id, __saved: true, _tmp: false });
      // refresco lista ordenada por fecha
      await loadList();
    } finally { setBusy(false); }
  }

  const view = useMemo(()=>{
    // non-admin: só datos reais (sen _tmp)
    const base = isAdmin ? rows : rows.filter(r=>r?.id);
    // renumerar tras orden actual (xa está por data asc)
    return base.map((r, idx)=>({ ...r, _num: idx+1 }));
  }, [rows, isAdmin]);

  return (
    <main style={WRAP}>
      <div style={HEADER}>
        <h2 style={H1}>Axenda dos próximos encontros con data e hora confirmada</h2>
        {isAdmin && (
          <button type="button" style={BTN_ADD} onClick={onAdd}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{stroke:"#0ea5e9",strokeWidth:2}}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Engadir
          </button>
        )}
      </div>

      <section style={LIST}>
        {view.map((r, i) => {
          const editable = !!isAdmin;
          const savedStyle = r.__saved ? CARD_SAVED : null;

          const dmy = r.match_date ? isoToDMY2(r.match_date) : "";

          return (
            <article key={r.id || `n-${i}`} style={{ ...CARD, ...(savedStyle||{}) }}>
              {/* Fila 1: número + Equipo1 vs Equipo2 */}
              <div style={ROW1}>
                <div style={NUMBOX}>{String(r._num||i+1).padStart(2,"0")}</div>
                <div style={TEAMLINE}>
                  <input
                    style={INPUT_TEAM(editable)}
                    value={r.equipo1 || ""}
                    onInput={(e)=> editable && setLocal(i, { equipo1: e.currentTarget.value })}
                    placeholder="Equipo 1"
                    readOnly={!editable}
                  />
                  <span style={VS}>vs</span>
                  <input
                    style={INPUT_TEAM(editable)}
                    value={r.equipo2 || ""}
                    onInput={(e)=> editable && setLocal(i, { equipo2: e.currentTarget.value })}
                    placeholder="Equipo 2"
                    readOnly={!editable}
                  />
                </div>
              </div>

              {/* Fila 2: Data + Competición + accións */}
              <div style={ROW2}>
                <input
                  style={INPUT_DATE(editable)}
                  value={dmy}
                  onInput={(e)=>{
                    if (!editable) return;
                    const iso = parseDMYtoISO(e.currentTarget.value);
                    setLocal(i, { match_date: iso, __saved:false });
                  }}
                  placeholder="DD/MM/AA"
                  readOnly={!editable}
                />

                <div style={{ position:"relative" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={ICON_TROPHY} aria-hidden="true">
                    <path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke="#64748b" strokeWidth="1.6"/>
                    <path d="M9 14h6v3H9z" stroke="#64748b" strokeWidth="1.6"/>
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
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        title="Gardar"
                        style={ICONBTN()}
                        onClick={()=>onSave(i)}
                        disabled={busy}
                        aria-label="Gardar"
                      >
                        {/* disquete */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{stroke:"#0ea5e9",strokeWidth:2}}>
                          <path d="M4 4h12l4 4v12H4z" />
                          <path d="M8 4v6h8V4" />
                          <path d="M8 16h8v4H8z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        style={ICONBTN("#ef4444")}
                        onClick={()=> onDelete(r.id)}
                        disabled={busy || !r.id}
                        aria-label="Eliminar"
                      >
                        {/* papeleira */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{stroke:"#ef4444",strokeWidth:2}}>
                          <path d="M4 7h16" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M6 7l1 13h10l1-13" />
                          <path d="M9 7V4h6v3" />
                        </svg>
                      </button>
                    </>
                  )}
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

