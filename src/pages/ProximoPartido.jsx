// src/pages/ProximoPartido.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const ESCUDO_SRC = "/escudo.png";
const ESCUDO_DESKTOP_WIDTH = 172;
const ESCUDO_DESKTOP_TOP = -10;   // máis arriba, sen tocar liñas

const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };

const PANEL = {
  position: "relative",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  background: "#fff",
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: "18px 16px",
};

const TITLE_LINE_BASE = {
  margin: "0 0 8px 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  letterSpacing: ".3px",
  color: "#0f172a",
  lineHeight: 1.1,
};
const TEAM_NAME = { fontWeight: 600, textTransform: "uppercase" };
const VS_WEIGHT = 500;

const LINE_GRAY_BASE = {
  margin: "6px 0 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  color: "#6b7280",
  fontWeight: 500,
};

const ADMIN_BOX = { marginTop: 16, padding: 16, border: "1px dashed #cbd5e1", borderRadius: 14, background: "#f8fafc" };
const LABEL = { display: "block", margin: "0 0 6px 6px", fontSize: 14, color: "#334155", fontWeight: 500 };
const INPUT_BASE = {
  width: "100%", padding: "12px 12px", borderRadius: 12, border: "1px solid #dbe2f0",
  outline: "none", fontFamily: "Montserrat, system-ui, sans-serif", fontSize: 15, color: "#0f172a", background: "#fff",
};
const INPUT_EQ = { ...INPUT_BASE, fontWeight: 800, textTransform: "uppercase" };
const INPUT_LUGAR = { ...INPUT_BASE, fontWeight: 800, textTransform: "uppercase" };
const INPUT_DATE = { ...INPUT_BASE, fontWeight: 800, paddingLeft: 40 };
const ROW = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const SELECT_BASE = { ...INPUT_BASE, appearance: "none", WebkitAppearance: "none", MozAppearance: "none", fontWeight: 800, paddingRight: 48, cursor: "pointer" };
const SELECT_WRAP = { position: "relative" };
const SELECT_ARROW = { position: "absolute", top: "50%", right: 18, transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.95 };
const BTN_SAVE = {
  marginTop: 10, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #60a5fa",
  color: "#fff", fontWeight: 800, letterSpacing: ".2px", cursor: "pointer",
  backgroundImage: "linear-gradient(180deg,#67b1ff,#5a8df5)", boxShadow: "0 8px 24px rgba(59,130,246,.35)", fontSize: 17,
};
const INFO = { marginTop: 10, color: "#065f46", fontSize: 14 };
const ERR  = { marginTop: 10, color: "#b91c1c", fontSize: 14 };

const STYLE_HIDE_NATIVE_DATE = `
  .nm-date::-webkit-calendar-picker-indicator{ display:none; }
  .nm-date{ -webkit-appearance:none; appearance:none; }
`;

/* ===== Utils ===== */
function toLongGalician(dateObj) {
  try {
    return new Intl.DateTimeFormat("gl-ES", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Madrid",
    }).format(dateObj);
  } catch { return dateObj?.toLocaleDateString("gl-ES") || ""; }
}
const capFirst = (s="") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
function timeOptions(){ const a=[]; for(let h=12;h<=23;h++){ for(let m of[0,15,30,45]){ a.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);} } return a; }

/* Meteo fetch (misma lógica) */
async function fetchMeteoFor(lugar, matchISO){
  try{
    if(!lugar||!matchISO) return null;
    const geoRes=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(lugar)}&count=1&language=gl&format=json`);
    const geo=await geoRes.json(); const loc=geo?.results?.[0]; if(!loc) return null;
    const lat=loc.latitude, lon=loc.longitude;
    const wxRes=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,wind_speed_10m&timezone=Europe/Madrid&forecast_days=3`);
    const wx=await wxRes.json(); const times=wx?.hourly?.time||[]; if(!times.length) return null;
    const target=new Date(matchISO);
    const fmt=new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false});
    const parts=fmt.formatToParts(target).reduce((a,p)=>{a[p.type]=p.value;return a;},{}); const localISO=`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
    let idx=times.indexOf(localISO);
    if(idx===-1){ let best=0,bestDiff=Infinity; for(let i=0;i<times.length;i++){ const d=Math.abs(new Date(times[i]).getTime()-new Date(localISO).getTime()); if(d<bestDiff){bestDiff=d;best=i;} } idx=best; }
    const temp=wx.hourly.temperature_2m?.[idx]??null, wind=wx.hourly.wind_speed_10m?.[idx]??null, ppop=wx.hourly.precipitation_probability?.[idx]??null;
    return { temp_c:temp, wind_kmh:wind, precip_prob_pct:ppop };
  }catch{ return null; }
}

export default function ProximoPartido(){
  const [isAdmin,setIsAdmin]=useState(false);
  const [isMobile,setIsMobile]=useState(typeof window!=="undefined"?window.innerWidth<=560:false);
  useEffect(()=>{ const onR=()=>setIsMobile(window.innerWidth<=560); window.addEventListener("resize",onR); return()=>window.removeEventListener("resize",onR);},[]);
  const scale=(n)=> (isMobile ? Math.max(10,Math.round(n*0.9)) : n);
  const TITLE_LINE={...TITLE_LINE_BASE,fontSize:scale(30)}; const VS_STYLE={fontWeight:VS_WEIGHT,fontSize:scale(22),margin:"0 8px"}; const LINE_GRAY={...LINE_GRAY_BASE,fontSize:scale(20)};

  const [row,setRow]=useState(null);
  const [loading,setLoading]=useState(true);
  const [teamLocal,setTeamLocal]=useState(""); const [teamAway,setTeamAway]=useState(""); const [lugar,setLugar]=useState(""); const [competition,setCompetition]=useState("");
  const [dateStr,setDateStr]=useState(""); const [timeStr,setTimeStr]=useState(""); const [saving,setSaving]=useState(false); const [info,setInfo]=useState(""); const [err,setErr]=useState("");
  const [meteo,setMeteo]=useState(null);

  // Carga rápida de next_match
  useEffect(()=>{ let alive=true;
    (async()=>{ try{
      const { data:nm }=await supabase.from("next_match").select("id,equipo1,equipo2,lugar,match_iso,tz,competition,weather_json,updated_at").eq("id",1).maybeSingle();
      if(alive && nm){
        setRow(nm);
        setTeamLocal(nm.equipo1?.toUpperCase()||""); setTeamAway(nm.equipo2?.toUpperCase()||""); setLugar(nm.lugar?.toUpperCase()||""); setCompetition(nm.competition||"");
        if(nm.match_iso){ const dt=new Date(nm.match_iso); setDateStr(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`); setTimeStr(`${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`); }
        setMeteo(nm.weather_json||null);
      }
    }finally{ if(alive) setLoading(false); }})();
    return()=>{ alive=false; };
  },[]);

  // Admin (en paralelo)
  useEffect(()=>{ let alive=true;(async()=>{
    const { data:s }=await supabase.auth.getSession();
    const email=s?.session?.user?.email||""; const uid=s?.session?.user?.id||null;
    let admin=false; if(email){ const e=email.toLowerCase(); if(e==="hdcliga@gmail.com"||e==="hdcliga2@gmail.com") admin=true; }
    if(!admin && uid){ const { data:prof }=await supabase.from("profiles").select("role").eq("id",uid).maybeSingle(); if((prof?.role||"").toLowerCase()==="admin") admin=true; }
    if(alive) setIsAdmin(admin);
  })(); return()=>{ alive=false; }; },[]);

  // Meteo automática (despois)
  useEffect(()=>{ let alive=true;(async()=>{
    const nm=row; if(!nm?.match_iso||!nm?.lugar||nm.weather_json) return;
    const ms=new Date(nm.match_iso).getTime()-Date.now();
    if(ms<=48*3600*1000){
      const wx=await fetchMeteoFor(nm.lugar,nm.match_iso);
      if(alive && wx){ setMeteo(wx); if(isAdmin){ await supabase.from("next_match").update({ weather_json:wx, updated_at:new Date().toISOString() }).eq("id",1); } }
    }
  })(); return()=>{ alive=false; }; },[row,isAdmin]);

  const teamA=useMemo(()=> (row?.equipo1||teamLocal||"").toUpperCase(),[row,teamLocal]);
  const teamB=useMemo(()=> (row?.equipo2||teamAway ||"").toUpperCase(),[row,teamAway]);

  const dateObj=useMemo(()=>{ if(row?.match_iso) return new Date(row.match_iso); if(dateStr&&timeStr) return new Date(`${dateStr}T${timeStr}:00`); return null; },[row,dateStr,timeStr]);
  const longDate=useMemo(()=> (dateObj ? toLongGalician(dateObj) : null),[dateObj]);
  const showEscudo=(!isMobile && true) || (isMobile && !isAdmin);

  function hardReloadWithBusting(){ const u=new URL(window.location.href); u.searchParams.set("t",String(Date.now())); window.location.replace(u.toString()); }

  async function onSave(e){
    e?.preventDefault?.(); setInfo(""); setErr("");
    try{
      if(!teamLocal.trim()||!teamAway.trim()||!lugar.trim()){ setErr("Completa equipo local, visitante e lugar."); return; }
      if(!dateStr||!timeStr){ setErr("Completa data e hora."); return; }
      setSaving(true);

      const local=new Date(`${dateStr}T${timeStr}:00`);
      const payload={ id:1, equipo1:teamLocal.trim().toUpperCase(), equipo2:teamAway.trim().toUpperCase(), lugar:lugar.trim().toUpperCase(), competition:competition||null, match_iso:local.toISOString(), tz:"Europe/Madrid", updated_at:new Date().toISOString() };
      const { error }=await supabase.from("next_match").upsert(payload,{ onConflict:"id" });
      if(error) throw error;

      // estado inmediato e info visual
      setRow(prev=>({ ...(prev||{}), ...payload }));
      setInfo(`Gardado e publicado ás ${new Date().toLocaleTimeString("gl-ES",{hour12:false})}`);
      setSaving(false);

      // recarga rápida; meteo xa se reencherá ao montar
      setTimeout(hardReloadWithBusting, 450);
    }catch(e2){
      console.error("[ProximoPartido] save error:",e2);
      setErr("Erro gardando os datos.");
      setSaving(false);
    }
  }

  if(loading) return <main style={WRAP}>Cargando…</main>;

  const rightPad=!isMobile && showEscudo ? ESCUDO_DESKTOP_WIDTH + 70 : 0;
  const justTime=useMemo(()=>{ if(!dateObj) return null; try{ return new Intl.DateTimeFormat("gl-ES",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Europe/Madrid"}).format(dateObj); }catch{ const hh=String(dateObj.getHours()).padStart(2,"0"); const mm=String(dateObj.getMinutes()).padStart(2,"0"); return `${hh}:${mm}`; } },[dateObj]);
  const legendText=`METEO: ${capFirst(String((row?.lugar||lugar||"—")).toLowerCase())}`;

  return (
    <main style={WRAP}>
      <style>{STYLE_HIDE_NATIVE_DATE}</style>

      <section style={PANEL}>
        {/* Borde superposto en capa superior para que nunca quede tapado polo escudo */}
        <div style={{ position:"absolute", inset:0, border:"1px solid #e5e7eb", borderRadius:18, pointerEvents:"none", zIndex:4 }} />

        {/* Escudo fixo por detrás */}
        {showEscudo && !isMobile && (
          <img
            src={ESCUDO_SRC}
            alt="Escudo RC Celta"
            decoding="async"
            loading="eager"
            style={{
              position:"absolute", top:ESCUDO_DESKTOP_TOP, right:12,
              width:ESCUDO_DESKTOP_WIDTH, height:"auto",
              opacity:0.95, pointerEvents:"none", userSelect:"none", transform:"translateZ(0)", zIndex:0,
            }}
          />
        )}

        {/* Bloque superior */}
        <div style={{ position:"relative", zIndex:1, paddingRight:rightPad }}>
          <h2 style={TITLE_LINE}>
            <span style={TEAM_NAME}>{teamA || "—"}</span>
            <span style={VS_STYLE}>vs</span>
            <span style={TEAM_NAME}>{teamB || "—"}</span>
          </h2>
          <p style={LINE_GRAY}>Competición: <strong style={{ fontWeight:600 }}>{row?.competition || competition || "—"}</strong></p>
          <p style={LINE_GRAY}>Data: <strong style={{ fontWeight:600 }}>{capFirst(longDate || "—")}</strong></p>
          <p style={LINE_GRAY}>Hora: {justTime ? <strong style={{ fontWeight:600 }}>{justTime}</strong> : "—"}</p>
        </div>

        {/* Separador */}
        <div style={{ position:"relative", zIndex:2, margin:"18px 0" }}>
          <hr style={{ border:0, borderTop:"1px solid #e5e7eb", margin:0 }}/>
        </div>

        {/* ===== METEO ===== */}
        <div style={{ position:"relative", marginTop:22, marginBottom:22, zIndex:1 }}>
          {/* Botón METEO a esquerda e máis baixo */}
          <span style={{
            position:"absolute", top:-14, left:12,
            display:"inline-flex", alignItems:"center", padding:"4px 12px",
            borderRadius:10, background:"#0ea5e9", color:"#fff",
            boxShadow:"0 6px 18px rgba(14,165,233,.35)", border:"1px solid #0284c7",
            fontSize:scale(13), fontWeight:700, lineHeight:1.1, zIndex:3, pointerEvents:"none", whiteSpace:"nowrap",
          }}>
            {legendText}
          </span>

          {/* Sub-leyenda un pouco máis arriba */}
          <span style={{
            position:"absolute", bottom:-12, left:12,
            display:"inline-flex", alignItems:"center", padding:"3px 10px",
            borderRadius:10, background:"#e5e7eb", color:"#334155",
            boxShadow:"0 3px 10px rgba(0,0,0,.08)", border:"1px solid #cbd5e1",
            fontSize:scale(11), fontWeight:400, lineHeight:1.1, zIndex:3, pointerEvents:"none", whiteSpace:"nowrap",
          }}>
            Previsión para a hora do partido
          </span>

          <div style={{
            border:"2px dashed #cbd5e1", borderRadius:12,
            background:"linear-gradient(180deg, rgba(14,165,233,0.08), rgba(99,102,241,0.06))",
            padding:"22px 16px", paddingRight:16+rightPad,
          }}>
            {meteo ? (
              <div style={{ display:"flex", gap:22, flexWrap:"wrap", alignItems:"center" }}>
                <div style={pillStyle(scale)}><span style={pillIcon(scale)}>🌡️</span><strong style={pillValue(scale)}>{meteo.temp_c!=null?`${Math.round(meteo.temp_c)} °C`:"—"}</strong></div>
                <div style={pillStyle(scale)}><span style={pillIcon(scale)}>💨</span><strong style={pillValue(scale)}>{meteo.wind_kmh!=null?`${Math.round(meteo.wind_kmh)} km/h`:"—"}</strong></div>
                <div style={pillStyle(scale)}><span style={pillIcon(scale)}>☔</span><strong style={pillValue(scale)}>{meteo.precip_prob_pct!=null?`${meteo.precip_prob_pct}%`:"—"}</strong></div>
              </div>
            ) : (
              <p style={{ margin:0, color:"#475569", fontSize:scale(16) }}>Información meteorolóxica dispoñible 48 horas antes do partido.</p>
            )}
          </div>
        </div>

        {/* Form ADMIN */}
        {isAdmin && (
          <form style={ADMIN_BOX} onSubmit={onSave}>
            <div style={{ ...ROW, marginBottom:12 }}>
              <div>
                <label style={LABEL}>Competición</label>
                <div style={SELECT_WRAP}>
                  <select value={competition} onChange={(e)=>setCompetition(e.currentTarget.value)} style={SELECT_BASE}>
                    <option value="">(selecciona)</option>
                    <option value="LaLiga">LaLiga</option>
                    <option value="Europa League">Europa League</option>
                    <option value="Copa do Rei">Copa do Rei</option>
                  </select>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={SELECT_ARROW}>
                    <path d="M6 9l6 6 6-6" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div>
                <label style={LABEL}>Lugar</label>
                <input style={INPUT_LUGAR} value={lugar} onInput={(e)=>setLugar(e.currentTarget.value.toUpperCase())} placeholder="Ex.: VIGO"/>
              </div>
            </div>

            <div style={{ ...ROW, marginBottom:12 }}>
              <div>
                <label style={LABEL}>Equipo local</label>
                <input style={INPUT_EQ} value={teamLocal} onInput={(e)=>setTeamLocal(e.currentTarget.value.toUpperCase())} placeholder="(sen valor por defecto)"/>
              </div>
              <div>
                <label style={LABEL}>Equipo visitante</label>
                <input style={INPUT_EQ} value={teamAway} onInput={(e)=>setTeamAway(e.currentTarget.value.toUpperCase())} placeholder="GIRONA"/>
              </div>
            </div>

            <div style={{ ...ROW, marginBottom:12 }}>
              <div>
                <label style={LABEL}>Data oficial confirmada</label>
                <div style={{ position:"relative" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ position:"absolute", left:10, top:10 }}>
                    <rect x="3" y="4.5" width="18" height="16" rx="2" stroke="#0ea5e9" strokeWidth="1.8"/>
                    <path d="M7 2.5v4M17 2.5v4M3 9h18" stroke="#0ea5e9" strokeWidth="1.8"/>
                  </svg>
                  <input id="nm-date" class="nm-date" type="date" style={INPUT_DATE} value={dateStr} onInput={(e)=>setDateStr(e.currentTarget.value)} />
                </div>
              </div>

              <div>
                <label style={LABEL}>Hora confirmada</label>
                <div style={SELECT_WRAP}>
                  <select style={SELECT_BASE} value={timeStr} onChange={(e)=>setTimeStr(e.currentTarget.value)}>
                    <option value="">(selecciona)</option>
                    {timeOptions().map((t)=>(<option key={t} value={t}>{t}</option>))}
                  </select>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={SELECT_ARROW}>
                    <path d="M6 9l6 6 6-6" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <button type="submit" style={BTN_SAVE} disabled={saving}>{saving ? "Gardando…" : "Gardar"}</button>
            {info && <p style={INFO}>{info}</p>}
            {err  && <p style={ERR}>{err}</p>}
          </form>
        )}
      </section>
    </main>
  );
}

function pillStyle(scale){ return { display:"inline-flex", alignItems:"center", gap:10, padding:`${Math.round(scale(10))}px ${Math.round(scale(14))}px`, borderRadius:999, background:"#fff", border:"1px solid #e2e8f0", boxShadow:"0 1px 2px rgba(0,0,0,.05)", }; }
function pillIcon(scale){ return { fontSize:scale(26), lineHeight:1, display:"inline-block" }; }
function pillValue(scale){ return { fontSize:scale(20), lineHeight:1.1, letterSpacing:".2px" }; }
