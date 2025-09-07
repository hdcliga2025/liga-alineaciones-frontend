// src/pages/VindeirosPartidos.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Paleta / estilos base (verde) ===== */
const GREEN_500 = "#22c55e";
const GREEN_400 = "#34d399";
const GREEN_50  = "#f0fdf4"; // fondo muy suave
const SHADOW    = "0 6px 18px rgba(0,0,0,.06)";
const BORDER    = "1px solid #e5e7eb";

const WRAP = { maxWidth: 1080, margin: "0 auto", padding: "16px 12px 26px" };
const HEADER_ROW = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
};
const H1 = { font: "800 20px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a", margin: 0 };
const SUB = { margin: "2px 0 0", font: "400 13px/1.2 Montserrat,system-ui,sans-serif", color: "#475569" };

const BTN_ADD = {
  borderRadius: 12,
  padding: "10px 18px",
  border: "1px solid " + GREEN_400,
  backgroundImage: `linear-gradient(180deg,${GREEN_400},${GREEN_500})`,
  color: "#fff",
  font: "800 14px/1 Montserrat,system-ui,sans-serif",
  letterSpacing: ".2px",
  boxShadow: "0 8px 22px rgba(34,197,94,.25)",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const LIST = { display: "grid", gap: 12 };

const CARD = {
  background: GREEN_50,               // muy suave
  border: `2px solid ${GREEN_500}`,   // marco verde
  borderRadius: 16,
  boxShadow: SHADOW,
  padding: 12,
};

const TOPLINE = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: 10,
  alignItems: "center",
};
const NUM_BADGE = {
  minWidth: 34,
  height: 34,
  padding: "0 8px",
  display: "grid",
  placeItems: "center",
  borderRadius: 8,                     // cuadrado con esquinas
  border: `2px solid ${GREEN_500}`,    // borde verde
  background: "#fff",
  font: "700 14px/1 Montserrat,system-ui,sans-serif",
  color: "#0f172a",
};

const VS_WRAP = {
  display: "grid",
  gridTemplateColumns: "minmax(60px,1fr) auto minmax(60px,1fr)",
  alignItems: "center",
  gap: 8,
};
const INPUT_TEAM = (editable) => ({
  width: "100%",
  borderRadius: 10,
  border: BORDER,
  background: "#fff",
  padding: "10px 10px",
  font: "700 14px/1 Montserrat,system-ui,sans-serif",
  color: "#0f172a",
  textTransform: "uppercase",
  outline: "none",
  ...(editable ? {} : { background: "#f8fafc", color: "#334155" }),
});
const VS = { font: "800 14px/1 Montserrat,system-ui,sans-serif", color: "#0f172a" };

const BOTLINE = {
  display: "grid",
  gridTemplateColumns: "minmax(120px,220px) 1fr auto",
  gap: 10,
  alignItems: "center",
  marginTop: 10,
};

const INPUT_DATE = (editable) => ({
  width: "100%",
  borderRadius: 10,
  border: BORDER,
  background: "#fff",
  padding: "10px 10px",
  font: "700 14px/1 Montserrat,system-ui,sans-serif",
  color: "#0f172a",
  outline: "none",
  ...(editable ? {} : { background: "#f8fafc", color: "#334155" }),
});

const COMP_WRAP = { display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "center", gap: 8 };
const TROPHY = (size=20,color=GREEN_500)=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke={color} stroke-width="2"/>
    <path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" stroke={color} stroke-width="2"/>
    <path d="M9 14h6v3H9z" stroke={color} stroke-width="2"/>
  </svg>
);
const SELECT_COMP = (editable) => ({
  width: "100%",
  borderRadius: 10,
  border: BORDER,
  background: "#fff",
  padding: "10px 12px",
  font: "700 14px/1 Montserrat,system-ui,sans-serif",
  color: "#0f172a",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  ...(editable ? {} : { background: "#f8fafc", color: "#334155" }),
});

const RIGHT_ICONS = { display: "grid", gridAutoFlow: "column", gap: 8, alignItems: "center" };
const ICON_BTN = {
  width: 36, height: 36,
  display: "grid", placeItems: "center",
  borderRadius: 10,
  border: BORDER,
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
  cursor: "pointer",
};

const UP_ARROW = (size=20, color=GREEN_500)=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 4l-7 7M12 4l7 7" stroke={color} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 4v16" stroke={color} stroke-width="2.4" stroke-linecap="round"/>
  </svg>
);

/* ===== Helpers ===== */
const toDMY = (d, tz="Europe/Madrid") => {
  try {
    const dt = (d instanceof Date) ? d : new Date(d);
    const y = new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, year:"2-digit"}).format(dt); // “aa”
    const m = new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, month:"2-digit"}).format(dt);
    const da= new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, day:"2-digit"}).format(dt);
    return `${da}/${m}/${y}`;
  } catch { return ""; }
};
const parseDMY = (s) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(String(s||"").trim());
  if (!m) return null;
  const [_, dd, mm, yy] = m;
  const yyyy = Number(yy) >= 70 ? `19${yy}` : `20${yy}`; // 70-99 → 19xx, resto → 20xx
  const iso = `${yyyy}-${mm}-${dd}T00:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : iso;
};

export default function VindeirosPartidos(){
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]); // { id, team1, team2, match_date, competition, created_at }
  const [busy, setBusy]   = useState(false);

  // Admin?
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const email = s?.session?.user?.email || "";
      const uid   = s?.session?.user?.id   || null;
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
    try{
      const { data } = await supabase
        .from("matches_vindeiros")
        .select("id, team1, team2, match_date, competition, created_at")
        .order("match_date", { ascending: true, nullsFirst: false })
        .limit(120);
      setRows(data || []);
    }catch(e){
      console.warn("Vindeiros: loadList error", e);
      setRows([]); // vacío pero visible
    }
  }
  useEffect(()=>{ loadList(); }, []);

  const viewRows = useMemo(()=>{
    // numeración 01.. de arriba a abajo (próximos primero)
    return (rows || []).map((r, idx) => ({...r, __n: String(idx+1).padStart(2,"0") }));
  },[rows]);

  const editable = isAdmin;

  function setLocal(i, patch){
    setRows(prev => {
      const nxt = prev.slice();
      nxt[i] = { ...nxt[i], ...patch, updated_at: new Date().toISOString() };
      return nxt;
    });
  }

  async function ensureRow(i){
    // si no tiene id, insertar vacío para conseguir ID
    if (rows[i]?.id) return rows[i].id;
    try{
      const { data, error } = await supabase
        .from("matches_vindeiros")
        .insert({ team1: null, team2: null, match_date: null, competition: null })
        .select("id")
        .single();
      if (error) throw error;
      setRows(prev=>{
        const nxt = prev.slice();
        nxt[i] = { ...nxt[i], id: data.id };
        return nxt;
      });
      return data.id;
    }catch(e){
      console.warn("ensureRow", e);
      return null;
    }
  }

  async function saveRow(i){
    if (!editable) return;
    const r = rows[i];
    if (!r) return;
    // normaliza TEAMs a MAYÚSCULAS
    const team1 = (r.team1 || "").toUpperCase().trim();
    const team2 = (r.team2 || "").toUpperCase().trim();
    // admite dd/mm/aa o iso
    let match_iso = null;
    if (r.match_date){
      if (/^\d{2}\/\d{2}\/\d{2}$/.test(r.match_date)) {
        match_iso = parseDMY(r.match_date);
      } else {
        const d = new Date(r.match_date);
        match_iso = Number.isNaN(d.getTime()) ? null : d.toISOString();
      }
    }
    const competition = (r.competition || "").trim() || null;

    // upsert si hay id; si no, insert
    try{
      setBusy(true);
      const id = await ensureRow(i);
      if (!id) return;

      const payload = {
        team1: team1 || null,
        team2: team2 || null,
        match_date: match_iso,
        competition,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("matches_vindeiros")
        .update(payload)
        .eq("id", id);
      if (error) throw error;

      // refresca para reordenar por fecha
      await loadList();
    }catch(e){
      console.warn("saveRow", e);
    }finally{
      setBusy(false);
    }
  }

  async function onAdd(){
    if (!editable) return;
    try{
      const { data, error } = await supabase
        .from("matches_vindeiros")
        .insert({ team1:null, team2:null, match_date:null, competition:null })
        .select("id, team1, team2, match_date, competition, created_at")
        .single();
      if (error) throw error;
      setRows(prev => [ data, ...prev ]);
    }catch(e){
      console.warn("add", e);
    }
  }

  // ======= RENDER =======
  return (
    <main style={WRAP}>
      <div style={HEADER_ROW}>
        <div>
          <h2 style={H1}>VINDEIROS PARTIDOS</h2>
          <p style={SUB}>Próximos partidos a xogar polo Celta con data programada</p>
        </div>
        {editable && (
          <button type="button" style={BTN_ADD} onClick={onAdd} disabled={busy}>
            Engadir
          </button>
        )}
      </div>

      <section style={LIST}>
        {viewRows.map((r, i) => {
          const dmy = r.match_date
            ? (/^\d{2}\/\d{2}\/\d{2}$/.test(r.match_date) ? r.match_date : toDMY(r.match_date))
            : "";

        return (
          <article key={r.id || `v-${i}`} style={CARD}>
            {/* Línea 1: Nº + (Equipo1 vs Equipo2) */}
            <div style={TOPLINE}>
              <div style={NUM_BADGE}>{r.__n}</div>
              <div style={VS_WRAP}>
                <input
                  style={INPUT_TEAM(editable)}
                  value={r.team1 || ""}
                  placeholder="EQUIPO 1"
                  disabled={!editable}
                  onInput={(e)=> editable && setLocal(i, { team1: e.currentTarget.value.toUpperCase() })}
                  onBlur={()=> saveRow(i)}
                />
                <span style={VS}>vs</span>
                <input
                  style={INPUT_TEAM(editable)}
                  value={r.team2 || ""}
                  placeholder="EQUIPO 2"
                  disabled={!editable}
                  onInput={(e)=> editable && setLocal(i, { team2: e.currentTarget.value.toUpperCase() })}
                  onBlur={()=> saveRow(i)}
                />
              </div>
            </div>

            {/* Línea 2: Data + Competición + Icono (flecha arriba) */}
            <div style={BOTLINE}>
              <input
                style={INPUT_DATE(editable)}
                value={dmy}
                placeholder="DD/MM/AA"
                disabled={!editable}
                onInput={(e)=> editable && setLocal(i, { match_date: e.currentTarget.value.toUpperCase() })}
                onBlur={()=> saveRow(i)}
              />

              <div style={COMP_WRAP}>
                {TROPHY(22, GREEN_500)}
                <select
                  style={SELECT_COMP(editable)}
                  value={r.competition || ""}
                  disabled={!editable}
                  onChange={(e)=> editable && setLocal(i, { competition: e.currentTarget.value })}
                  onBlur={()=> saveRow(i)}
                >
                  <option value="">(selecciona)</option>
                  <option value="LaLiga">LaLiga</option>
                  <option value="Europa League">Europa League</option>
                  <option value="Copa do Rei">Copa do Rei</option>
                </select>
              </div>

              <div style={RIGHT_ICONS}>
                <button
                  type="button"
                  title="Enviar arriba"
                  style={ICON_BTN}
                  onClick={()=> window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  {UP_ARROW(20, GREEN_500)}
                </button>
              </div>
            </div>
          </article>
        );})}

        {viewRows.length === 0 && (
          <div
            style={{
              border: BORDER,
              borderRadius: 16,
              background: "#fff",
              padding: 16,
              textAlign: "center",
              color: "#64748b",
              font: "400 14px/1.2 Montserrat,system-ui,sans-serif",
            }}
          >
            Aínda non hai encontros programados.
          </div>
        )}
      </section>
    </main>
  );
}
