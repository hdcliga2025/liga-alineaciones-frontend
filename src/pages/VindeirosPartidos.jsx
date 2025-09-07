import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Fechas: dd/mm/aa <-> YYYY-MM-DD ===== */
function dmyToISO(v) {
  const s = String(v || "").trim();
  const m = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/.exec(s);
  if (!m) return null;
  let [, dd, mm, yy] = m;
  if (yy.length === 2) yy = `20${yy}`;
  const iso = `${yy}-${mm}-${dd}`;
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : iso;
}
function isoToDMY(iso) {
  try {
    const [y, m, d] = String(iso || "").slice(0, 10).split("-");
    if (!y || !m || !d) return "";
    return `${d}/${m}/${String(y).slice(2)}`;
  } catch { return ""; }
}

const COMP_OPTS = ["LaLiga", "Europa League", "Copa do Rei"];

/* ===== Estilos ===== */
const WRAP   = { maxWidth: 960, margin: "0 auto", padding: "16px 12px 28px" };
const H1     = { margin: "0 0 6px", color: "#0f172a", font: "700 22px/1.2 Montserrat,system-ui,sans-serif" };
const SUB    = { margin: "0 0 14px", color: "#475569", font: "400 13px/1.35 Montserrat,system-ui,sans-serif" };
const TOP    = { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 };
const BTNADD = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "10px 24px", borderRadius: 12, border: 0,
  background: "linear-gradient(180deg,#34d399,#10b981)", color: "#fff",
  font: "700 13px/1 Montserrat,system-ui,sans-serif", letterSpacing: ".2px",
  boxShadow: "0 6px 14px rgba(16,185,129,.25)", cursor: "pointer"
};
const TOAST  = {
  marginLeft: "auto", background: "#10b981", color:"#fff",
  font:"700 12px/1 Montserrat,system-ui,sans-serif", padding:"8px 10px",
  borderRadius:10, boxShadow:"0 6px 14px rgba(16,185,129,.25)"
};
const ERR    = { margin:"8px 0 0", color:"#dc2626", font:"600 13px/1.25 Montserrat,system-ui,sans-serif" };

const CARD = (savedVisual) => ({
  background: savedVisual ? "linear-gradient(180deg,#f6fffb,#f3fbf7)" : "#fff",
  border: `2px solid ${savedVisual ? "#10b981" : "#e5e7eb"}`, borderRadius: 16,
  boxShadow: "0 4px 12px rgba(0,0,0,.06)", padding: 12
});
const GRID = { display:"grid", gridTemplateColumns:"64px 1fr", gap:10, alignItems:"stretch" };
const COL_L = { display:"grid", gridTemplateRows:"40px 34px", gap:8 };
const NUMBOX = (saved) => ({
  height: 40, borderRadius: 10, border:`2px solid ${saved ? "#10b981":"#e5e7eb"}`,
  display:"grid", placeItems:"center", font:"700 14px/1 Montserrat,system-ui,sans-serif",
  color:"#0f172a", background:"#fff"
});
const BTNUP = {
  height: 34, borderRadius: 10, background:"#ecfdf5", border:"1px solid #a7f3d0",
  display:"grid", placeItems:"center", cursor:"pointer"
};
const ROW1R = {
  display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center",
  gap:8, border:"1px solid #e5e7eb", borderRadius:12, padding:"8px 10px", background:"#fff"
};
const VS = { font:"700 12px/1 Montserrat,system-ui,sans-serif", color:"#64748b" };
const INPUT = (editable) => ({
  width:"100%", border:0, outline:"none", background:"transparent",
  font:"700 14px/1.2 Montserrat,system-ui,sans-serif",
  color: editable ? "#0f172a" : "#64748b", textTransform:"uppercase"
});
const ROW2  = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, alignItems:"center", marginTop:10 };
const FIELD = { display:"flex", alignItems:"center", gap:10, border:"1px solid #e5e7eb", borderRadius:12, padding:"8px 10px", background:"#fff" };
const DATEINPUT = (editable) => ({
  width:"100%", border:0, outline:"none", background:"transparent",
  font:"700 13px/1.2 Montserrat,system-ui,sans-serif",
  color: editable ? "#0f172a" : "#64748b", textTransform:"uppercase"
});
const SELECT = (editable) => ({
  width:"100%", border:0, outline:"none", background:"transparent",
  font:"700 13px/1.2 Montserrat,system-ui,sans-serif",
  color: editable ? "#0f172a" : "#64748b", textTransform:"uppercase", appearance:"none"
});

/* ===== Página ===== */
export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows]     = useState([]);   // DB
  const [locals, setLocals] = useState([]);   // nuevos
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState("");
  const tRef = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToast(""), 2000);
  };

  // ¿Admin?
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.rpc("is_admin");
        if (alive) setIsAdmin(!!data);
      } catch {
        const { data: s } = await supabase.auth.getSession();
        const email = (s?.session?.user?.email || "").toLowerCase();
        const ok = ["hdcliga@gmail.com", "hdcliga2@gmail.com"].includes(email);
        if (alive) setIsAdmin(ok);
      }
    })();
    return () => { alive = false; clearTimeout(tRef.current); };
  }, []);

  async function load() {
    setErrorMsg("");
    const { data, error } = await supabase
      .from("matches_vindeiros")
      .select("id, home, away, match_date, competition")
      .order("match_date", { ascending: true, nullsFirst: false });

    if (error) { setErrorMsg(error.message || "Erro cargando datos."); return; }
    setRows((data || []).map(r => ({ ...r, _saved: true })));
  }
  useEffect(() => { load(); }, []);

  // Orden (fecha más próxima, sin fecha al final) y numeración 01..N
  const viewList = useMemo(() => {
    const all = [...rows, ...locals];
    const withKey = all.map((r, i) => ({ ...r, _k: r.id || r._tempId || `k-${i}` }));
    const dated = [], nodate = [];
    for (const r of withKey) (r.match_date ? dated : nodate).push(r);
    dated.sort((a,b) => new Date(a.match_date) - new Date(b.match_date));
    return [...dated, ...nodate].map((r, i) => ({ ...r, _num: String(i+1).padStart(2,"0") }));
  }, [rows, locals]);

  function addLocal() {
    if (!isAdmin) return;
    setLocals(l => [{
      _tempId: `tmp-${Date.now()}`, home:"", away:"", match_date:"", competition:"", _saved:false
    }, ...l]);
  }
  function setLocalField(tmp, patch) {
    setLocals(l => l.map(r => r._tempId === tmp ? { ...r, ...patch, _saved:false } : r));
  }
  function setRowField(id, patch) {
    setRows(l => l.map(r => r.id === id ? { ...r, ...patch, _saved:false } : r));
  }
  const isComplete = (r) =>
    (r.home||"").trim() && (r.away||"").trim() && (r.match_date||"").trim() && (r.competition||"").trim();

  async function persist(r) {
    setErrorMsg("");
    try {
      let iso = r.match_date;
      if (/^\d{2}\/\d{2}\/\d{2,4}$/.test(iso)) {
        iso = dmyToISO(iso);
        if (!iso) throw new Error("Formato de data inválido.");
      }
      const home = (r.home||"").toUpperCase().trim();
      const away = (r.away||"").toUpperCase().trim();
      const payload = { home, away, match_date: iso, competition: r.competition, partido: `${home} vs ${away}` };

      if (r.id) {
        const { error } = await supabase.from("matches_vindeiros").update(payload).eq("id", r.id);
        if (error) throw error;
        setRows(list => list.map(x => x.id === r.id ? { ...x, ...payload, _saved:true } : x));
      } else {
        const { data, error } = await supabase
          .from("matches_vindeiros")
          .insert(payload)
          .select("id, home, away, match_date, competition")
          .single();
        if (error) throw error;
        setLocals(list => list.filter(x => x._tempId !== r._tempId));
        setRows(list => [{ ...data, _saved:true }, ...list]);
      }
      showToast("REGISTRADO");
    } catch (e) {
      setErrorMsg(e?.message || "Erro gardando.");
    }
  }

  // Autoguardado al completar 4 campos (sólo admin)
  useEffect(() => {
    if (!isAdmin) return;
    for (const r of locals) if (!r._saved && isComplete(r)) persist(r);
    for (const r of rows)   if (!r._saved && isComplete(r)) persist(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locals, rows, isAdmin]);

  async function promoteToNextMatch(r) {
    if (!isAdmin) return;
    try {
      // si es local y no está en DB aún, primero guardamos
      if (!r.id) {
        if (!isComplete(r)) return;
        await persist(r);
        return; // se recarga en persist → aparecerá con id y flecha usable en el siguiente tick
      }
      if (!isComplete(r)) return;

      // match_iso: fecha a las 21:00 Europe/Madrid (ajustable)
      let iso = r.match_date;
      if (/^\d{2}\/\d{2}\/\d{2,4}$/.test(iso)) iso = dmyToISO(iso);
      const matchIso = iso ? `${iso}T21:00:00` : null;

      // escribe en next_match (id=1)
      const upd = {
        equipo1: (r.home||"").toUpperCase().trim(),
        equipo2: (r.away||"").toUpperCase().trim(),
        competition: r.competition || null,
        match_iso: matchIso,
        tz: "Europe/Madrid",
      };
      const { error: e1 } = await supabase.from("next_match").update(upd).eq("id", 1);
      if (e1) throw e1;

      // borra de vindeiros
      const { error: e2 } = await supabase.from("matches_vindeiros").delete().eq("id", r.id);
      if (e2) throw e2;

      // saca de la lista
      setRows(list => list.filter(x => x.id !== r.id));
      showToast("ENVIADO A PRÓXIMO PARTIDO");
    } catch (e) {
      setErrorMsg(e?.message || "Erro ao subir a Próximo Partido.");
    }
  }

  const renderMatch = (r, editable) => {
    const onHome = (e) => {
      const v = e.currentTarget.value.toUpperCase();
      r.id ? setRowField(r.id,{home:v}) : setLocalField(r._tempId,{home:v});
    };
    const onAway = (e) => {
      const v = e.currentTarget.value.toUpperCase();
      r.id ? setRowField(r.id,{away:v}) : setLocalField(r._tempId,{away:v});
    };
    return (
      <div style={ROW1R}>
        <input style={INPUT(editable)} placeholder="EQUIPO 1" value={r.home||""}
               onInput={editable ? onHome : undefined} disabled={!editable}/>
        <span style={VS}>VS</span>
        <input style={INPUT(editable)} placeholder="EQUIPO 2" value={r.away||""}
               onInput={editable ? onAway : undefined} disabled={!editable}/>
      </div>
    );
  };

  const renderDate = (r, editable) => {
    const val = r.match_date
      ? (/^\d{2}\/\d{2}\/\d{2,4}$/.test(r.match_date) ? r.match_date : isoToDMY(r.match_date))
      : "";
    const onInput = (e) => {
      const v = e.currentTarget.value.toUpperCase();
      r.id ? setRowField(r.id,{match_date:v}) : setLocalField(r._tempId,{match_date:v});
    };
    return (
      <div style={FIELD} title="DATA">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{flex:"0 0 auto"}}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" stroke="#10b981" strokeWidth="1.8"/>
          <path d="M7 2.5v4M17 2.5v4M3 9h18" stroke="#10b981" strokeWidth="1.8"/>
        </svg>
        <input style={DATEINPUT(editable)} placeholder="DD/MM/AA" value={val}
               onInput={editable ? onInput : undefined} disabled={!editable}/>
      </div>
    );
  };

  const renderComp = (r, editable) => {
    const onChange = (e) => {
      const v = e.currentTarget.value;
      r.id ? setRowField(r.id,{competition:v}) : setLocalField(r._tempId,{competition:v});
    };
    return (
      <div style={FIELD} title="COMPETICIÓN">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{flex:"0 0 auto"}}>
          <path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke="#10b981" strokeWidth="1.8"/>
          <path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" stroke="#10b981" strokeWidth="1.8"/>
          <path d="M9 14h6v3H9z" stroke="#10b981" strokeWidth="1.8"/>
        </svg>
        <select style={SELECT(editable)} value={r.competition||""}
                onChange={editable ? onChange : undefined} disabled={!editable}>
          <option value="" disabled>—</option>
          {COMP_OPTS.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
        </select>
      </div>
    );
  };

  return (
    <main style={WRAP}>
      <h2 style={H1}>Vindeiros partidos</h2>
      <p style={SUB}>Axenda dos próximos encontros con data e hora confirmada.</p>

      <div style={TOP}>
        {isAdmin && (
          <button type="button" style={BTNADD} onClick={addLocal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Engadir outro partido
          </button>
        )}
        {toast && <span style={TOAST}>{toast}</span>}
      </div>

      {errorMsg && <p style={ERR}>{errorMsg}</p>}

      <div style={{ display:"grid", gap:12 }}>
        {viewList.map((r) => {
          const complete = isComplete(r);
          const savedVisual = complete && (r._saved || !!r.id);
          const editable = isAdmin;
          return (
            <section key={r._k} style={CARD(savedVisual)}>
              <div style={GRID}>
                {/* Columna izquierda: número + flecha subir */}
                <div style={COL_L}>
                  <div style={NUMBOX(savedVisual)}>{r._num}</div>
                  <button
                    type="button"
                    style={BTNUP}
                    title="Subir a Próximo Partido"
                    onClick={() => promoteToNextMatch(r)}
                    disabled={!editable || !complete}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 6l-6 6M12 6l6 6" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 6v12" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {/* Derecha: EQUIPO1 vs EQUIPO2 */}
                {renderMatch(r, editable)}
              </div>

              {/* Segunda fila: DATA + COMPETICIÓN (iconos verdes) */}
              <div style={ROW2}>
                {renderDate(r, editable)}
                {renderComp(r, editable)}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
