// src/pages/VindeirosPartidos.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

const WRAP = { maxWidth: 1080, margin: "0 auto", padding: "16px 12px 28px" };
const TITLE = { font: "700 22px/1.2 Montserrat,system-ui", margin: "4px 0 2px", color: "#0f172a" };
const SUB = { margin: "0 0 14px", color: "#475569", font: "500 14px/1.25 Montserrat,system-ui" };

const ADD = {
  display: "inline-flex", alignItems: "center", gap: 8,
  background: "linear-gradient(90deg,#16a34a,#22c55e)",
  color: "#fff", border: "none", borderRadius: 12, padding: "10px 22px",
  font: "700 14px/1.1 Montserrat,system-ui", boxShadow: "0 10px 22px rgba(22,163,74,.25)",
  cursor: "pointer"
};

const LIST = { display: "grid", gap: 12, marginTop: 12 };
const CARD = (saved) => ({
  background: saved ? "rgba(16,185,129,.06)" : "#f8fafc",
  border: `2px solid ${saved ? "#10b981" : "#e2e8f0"}`,
  borderRadius: 16, boxShadow: "0 6px 16px rgba(0,0,0,.06)", padding: 12,
  transition: "border-color .15s ease, background .15s ease",
});
const ROW = { display: "grid", gridTemplateColumns: "92px 1fr auto", gap: 10, alignItems: "center" };
const ROW2 = { display: "grid", gridTemplateColumns: "92px 1fr 260px", gap: 10, alignItems: "center", marginTop: 8 };

const NUMBOX = (saved) => ({
  display: "grid", placeItems: "center", height: 40, borderRadius: 8,
  border: `2px solid ${saved ? "#10b981" : "#e2e8f0"}`, background: "#fff",
  font: "700 14px/1 Montserrat,system-ui", color: "#0f172a",
});

const FIELD = { background:"#fff", border:"1px solid #e5e7eb", borderRadius: 10, display:"flex", alignItems:"center", gap:10, padding:"10px 12px" };
const TEXTIN = (editable) => ({ flex:1, minWidth:0, border:"none", outline:"none", font:"700 14px/1.1 Montserrat,system-ui", textTransform:"uppercase", color: editable?"#0f172a":"#64748b", background:"transparent" });
const DATEINPUT = TEXTIN;
const SELECT = (editable) => ({ flex:1, minWidth:0, border:"none", outline:"none", font:"700 14px/1.1 Montserrat,system-ui", color: editable?"#0f172a":"#64748b", background:"transparent", appearance:"none" });

const ICONBTN = { width: 40, height: 40, display: "grid", placeItems: "center", background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, cursor:"pointer", boxShadow:"0 3px 10px rgba(0,0,0,.06)" };
const ERR = { marginTop: 10, color: "#b91c1c", font: "600 13px/1.2 Montserrat,system-ui" };
const TOAST = { position:"fixed", left:"50%", transform:"translateX(-50%)", bottom:18, background:"#16a34a", color:"#fff", padding:"10px 16px", borderRadius:12, font:"700 13px/1 Montserrat,system-ui", boxShadow:"0 10px 20px rgba(22,163,74,.35)" };

const TROPHY = (color="#10b981") => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke={color} strokeWidth="2.8"/>
    <path d="M7 7H5a3 3 0 003 3M17 7h2a3 3 0 01-3 3" stroke={color} strokeWidth="2.8" />
    <path d="M9 14h6v3H9z" stroke={color} strokeWidth="2.8" />
  </svg>
);
const CAL = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="3" stroke="#10b981" strokeWidth="3.2"/>
    <path d="M7 3.5v4.5M17 3.5v4.5M3 9h18" stroke="#10b981" strokeWidth="3.2" strokeLinecap="round"/>
  </svg>
);
const ARROW_UP = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 19V5" stroke="#10b981" strokeWidth="3" strokeLinecap="round"/>
    <path d="M6 11l6-6 6 6" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const dmyToISO = (s) => {
  if (!s) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/.exec(String(s).trim());
  if (!m) return null;
  let [_, dd, mm, yy] = m;
  if (yy.length === 2) yy = String(2000 + Number(yy));
  return `${yy}-${mm}-${dd}`;
};
const isoToDMY = (iso) => {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0,10).split("-");
  return `${d}/${m}/${y.slice(2)}`;
};

export default function VindeirosPartidos() {
  const [rows, setRows] = useState([]);
  const [locals, setLocals] = useState([]);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // ¿admin?
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        let admin = false;
        const { data, error } = await supabase.rpc("is_admin");
        if (!error) admin = !!data;
        if (!admin) {
          const { data: s } = await supabase.auth.getSession();
          const email = (s?.session?.user?.email || "").toLowerCase();
          admin = ["hdcliga@gmail.com","hdcliga2@gmail.com"].includes(email);
        }
        if (!cancel) setIsAdmin(admin);
      } catch {}
    })();
    return () => { cancel = true; };
  }, []);

  // cargar
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("matches_vindeiros")
        .select("id, match_date, home, away, competition")
        .order("match_date", { ascending: true, nullsFirst: false });
      if (!alive) return;
      if (error) setErr(error.message || "Erro cargando datos");
      setRows(data || []);
    };
    load();
    const re = () => !document.hidden && load();
    window.addEventListener("focus", re);
    document.addEventListener("visibilitychange", re);
    window.addEventListener("online", re);
    return () => {
      alive = false;
      window.removeEventListener("focus", re);
      document.removeEventListener("visibilitychange", re);
      window.removeEventListener("online", re);
    };
  }, []);

  // ordenar (fechas primero)
  const list = useMemo(() => {
    const all = [...rows, ...locals];
    const withDate = all.filter(r => !!r.match_date);
    const noDate = all.filter(r => !r.match_date);
    withDate.sort((a,b)=>{
      const A = dmyToISO(a.match_date) || a.match_date;
      const B = dmyToISO(b.match_date) || b.match_date;
      return String(A).localeCompare(String(B));
    });
    return [...withDate, ...noDate];
  }, [rows, locals]);

  const fireToast = (m) => { setToast(String(m||"").toUpperCase()); setTimeout(()=>setToast(""), 2000); };

  const addOne = () => {
    if (!isAdmin) return;
    const _tempId = "t" + Math.random().toString(36).slice(2, 9);
    setLocals(p => [...p, { _tempId, home:"", away:"", match_date:"", competition:"" }]);
  };

  const setLocal = (id, patch) => setLocals(p => p.map(r => r._tempId===id ? { ...r, ...patch } : r));
  const setRow   = (id, patch) => setRows(p => p.map(r => r.id===id ? { ...r, ...patch } : r));

  const completed = (r) => {
    const e1 = (r.home||"").trim();
    const e2 = (r.away||"").trim();
    const cmp = (r.competition||"").trim();
    const iso = r.match_date ? (dmyToISO(r.match_date) || r.match_date) : null;
    const okDate = /^\d{4}-\d{2}-\d{2}$/.test(String(iso));
    return e1 && e2 && cmp && okDate;
  };

  // autoguardado
  useEffect(() => {
    (async () => {
      if (!isAdmin) return;

      // INSERT de locales
      for (const r of locals) {
        if (completed(r)) {
          const iso = dmyToISO(r.match_date) || r.match_date;
          const { data, error } = await supabase
            .from("matches_vindeiros")
            .insert({
              home: r.home.toUpperCase(),
              away: r.away.toUpperCase(),
              match_date: iso,
              competition: r.competition
            })
            .select("id, match_date, home, away, competition")
            .single();
          if (error) { setErr(error.message || "Erro gardando"); continue; }
          setLocals(p => p.filter(x => x._tempId !== r._tempId));
          setRows(p => [...p, data]);
          fireToast("REGISTRADO");
        }
      }

      // UPDATE de filas reales marcadas como _dirty
      for (const r of rows) {
        if (r._dirty && completed(r)) {
          const iso = dmyToISO(r.match_date) || r.match_date;
          const { data, error } = await supabase
            .from("matches_vindeiros")
            .update({
              home: r.home.toUpperCase(),
              away: r.away.toUpperCase(),
              match_date: iso,
              competition: r.competition
            })
            .eq("id", r.id)
            .select("id, match_date, home, away, competition")
            .single();
          if (error) { setErr(error.message || "Erro gardando"); continue; }
          setRows(p => p.map(x => x.id===r.id ? data : x));
          fireToast("REGISTRADO");
        }
      }
    })();
  }, [locals, rows, isAdmin]); // eslint-disable-line

  const onChangeHome = (r, v) => (r.id ? setRow(r.id,{home:String(v).toUpperCase(), _dirty:true}) : setLocal(r._tempId,{home:String(v).toUpperCase()}));
  const onChangeAway = (r, v) => (r.id ? setRow(r.id,{away:String(v).toUpperCase(), _dirty:true}) : setLocal(r._tempId,{away:String(v).toUpperCase()}));
  const onChangeDate = (r, v) => (r.id ? setRow(r.id,{match_date:String(v).toUpperCase(), _dirty:true}) : setLocal(r._tempId,{match_date:String(v).toUpperCase()}));
  const onChangeComp = (r, v) => (r.id ? setRow(r.id,{competition:v, _dirty:true}) : setLocal(r._tempId,{competition:v}));

  // Subir a Próximo Partido
  const pushToNext = async (r) => {
    try {
      setErr("");
      if (!completed(r)) { setErr("Completa os 4 campos antes de subir"); return; }
      const iso = dmyToISO(r.match_date) || r.match_date;
      const match_iso = `${iso}T21:00:00Z`;
      const { error: e1 } = await supabase
        .from("next_match")
        .update({
          equipo1: r.home.toUpperCase(),
          equipo2: r.away.toUpperCase(),
          competition: r.competition,
          match_iso
        })
        .eq("id", 1);
      if (e1) throw e1;

      if (r.id) {
        await supabase.from("matches_vindeiros").delete().eq("id", r.id);
        setRows(p => p.filter(x => x.id !== r.id));
      } else {
        setLocals(p => p.filter(x => x._tempId !== r._tempId));
      }
      fireToast("REGISTRADO");
    } catch (e) {
      setErr(e?.message || "Erro subindo a Próximo partido");
    }
  };

  const editable = isAdmin;

  return (
    <main style={WRAP}>
      <h2 style={TITLE}>Vindeiros partidos</h2>
      <p style={SUB}>Axenda dos próximos encontros con data e hora confirmada.</p>

      {editable && (
        <div style={{display:"flex",alignItems:"center",gap:10, marginBottom:8}}>
          <button type="button" style={ADD} onClick={addOne}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/></svg>
            Engadir outro partido
          </button>
        </div>
      )}

      {err && <div style={ERR}>{err}</div>}

      <section style={LIST}>
        {list.map((r, idx) => {
          const saved = !!r.id && completed(r);
          const num = String(idx+1).padStart(2,"0");
          const dateDisplay = r.match_date ? (/^\d{4}-/.test(r.match_date) ? isoToDMY(r.match_date) : r.match_date) : "";

          return (
            <article key={r.id || r._tempId} style={CARD(saved)}>
              {/* Fila 1 */}
              <div style={ROW}>
                <div style={NUMBOX(saved)}>{num}</div>

                <div style={FIELD}>
                  <input
                    style={TEXTIN(editable)}
                    placeholder="EQUIPO 1"
                    value={r.home || ""}
                    onInput={editable ? (e)=>onChangeHome(r, e.currentTarget.value) : undefined}
                    disabled={!editable}
                  />
                  <span style={{font:"800 12px/1 Montserrat,system-ui",color:"#64748b"}}>VS</span>
                  <input
                    style={TEXTIN(editable)}
                    placeholder="EQUIPO 2"
                    value={r.away || ""}
                    onInput={editable ? (e)=>onChangeAway(r, e.currentTarget.value) : undefined}
                    disabled={!editable}
                  />
                </div>

                <button type="button" style={ICONBTN} title="Subir a Próximo partido"
                  onClick={() => editable && pushToNext(r)} disabled={!editable}>
                  <ARROW_UP />
                </button>
              </div>

              {/* Fila 2 */}
              <div style={ROW2}>
                <div />
                <div style={FIELD} title="DATA">
                  <CAL />
                  <input
                    style={DATEINPUT(editable)}
                    placeholder="DD/MM/AA"
                    value={dateDisplay}
                    onInput={editable ? (e)=>onChangeDate(r, e.currentTarget.value) : undefined}
                    disabled={!editable}
                  />
                </div>

                <div style={FIELD} title="COMPETICIÓN">
                  {TROPHY()}
                  <select
                    style={SELECT(editable)}
                    value={r.competition || ""}
                    onChange={editable ? (e)=>onChangeComp(r, e.currentTarget.value) : undefined}
                    disabled={!editable}
                  >
                    <option value="" disabled>—</option>
                    <option value="LaLiga">LaLiga</option>
                    <option value="Europa League">Europa League</option>
                    <option value="Copa do Rei">Copa do Rei</option>
                  </select>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {toast && <div style={TOAST}>{toast}</div>}
    </main>
  );
}
