// src/pages/ProximoPartido.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const ESCUDO_SRC = "/escudo.png";

const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };
const PANEL = {
  position: "relative",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  background: "#fff",
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: "18px 16px",
};
const TITLE_LINE = {
  margin: "0 0 8px 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  letterSpacing: ".3px",
  color: "#0f172a",
  lineHeight: 1.1,
  fontSize: 30,
  fontWeight: 700,
};
const TEAM_NAME = { fontWeight: 700, textTransform: "uppercase" };
const VS_STYLE  = { fontWeight: 600, fontSize: 22, margin: "0 8px" };

const LINE_GRAY = {
  margin: "6px 0 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  fontSize: 20,
  color: "#6b7280",
  fontWeight: 600,
};
const HR = { border: 0, borderTop: "1px solid #e5e7eb", margin: "14px 0" };

const ADMIN_BOX = {
  marginTop: 16,
  padding: 16,
  border: "1px dashed #cbd5e1",
  borderRadius: 14,
  background: "#f8fafc",
};
const LABEL = { display: "block", margin: "0 0 6px 6px", fontSize: 14, color: "#334155", fontWeight: 500 };
const INPUT_BASE = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid #dbe2f0",
  outline: "none",
  fontFamily: "Montserrat, system-ui, sans-serif",
  fontSize: 15,
  color: "#0f172a",
  background: "#fff",
};
const INPUT_EQ     = { ...INPUT_BASE, fontWeight: 800, textTransform: "uppercase" };
const INPUT_LUGAR  = { ...INPUT_BASE, fontWeight: 800, textTransform: "uppercase" };
const INPUT_DATE   = { ...INPUT_BASE, fontWeight: 800, paddingLeft: 40 };
const ROW          = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const SELECT_BASE  = { ...INPUT_BASE, appearance: "none", WebkitAppearance: "none", MozAppearance: "none", fontWeight: 800, paddingRight: 48, cursor: "pointer" };
const SELECT_WRAP  = { position: "relative" };
const SELECT_ARROW = { position: "absolute", top: "50%", right: 18, transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.95 };
const BTN_SAVE     = { marginTop: 10, width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #60a5fa", color: "#fff", fontWeight: 900, letterSpacing: ".2px", cursor: "pointer", backgroundImage: "linear-gradient(180deg,#67b1ff,#5a8df5)", boxShadow: "0 8px 24px rgba(59,130,246,.35)" };
const INFO         = { marginTop: 10, color: "#065f46", fontSize: 14 };
const ERR          = { marginTop: 10, color: "#b91c1c", fontSize: 14 };

const STYLE_HIDE_NATIVE_DATE = `
  .nm-date::-webkit-calendar-picker-indicator{ display:none; }
  .nm-date{ -webkit-appearance:none; appearance:none; }
`;

function toLongGalician(dateObj) {
  try {
    return new Intl.DateTimeFormat("gl-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Europe/Madrid",
    }).format(dateObj);
  } catch {
    return dateObj?.toLocaleDateString("gl-ES") || "";
  }
}
const capFirst = (s="") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function timeOptions() {
  const opts = [];
  for (let h = 12; h <= 23; h++) for (let m of [0,15,30,45]) opts.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
  return opts;
}

export default function ProximoPartido() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 560);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin form
  const [teamLocal, setTeamLocal] = useState("");
  const [teamAway,  setTeamAway]  = useState("");
  const [lugar,     setLugar]     = useState("");
  const [competition, setCompetition] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");
  const [errDetail, setErrDetail] = useState("");

  useEffect(() => {
    let alive = true;
    const safety = setTimeout(() => { if (alive) setLoading(false); }, 1600);

    (async () => {
      try {
        const { data: s } = await supabase.auth.getSession();
        const email = s?.session?.user?.email || "";
        const uid   = s?.session?.user?.id || null;

        let admin = false;
        const e = (email||"").toLowerCase();
        if (e === "hdcliga@gmail.com" || e === "hdcliga2@gmail.com") admin = true;
        if (!admin && uid) {
          const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
          if ((prof?.role||"").toLowerCase() === "admin") admin = true;
        }
        if (alive) setIsAdmin(admin);

        const { data: nm } = await supabase
          .from("next_match")
          .select("id, equipo1, equipo2, lugar, match_iso, tz, competition, weather_json, updated_at")
          .eq("id", 1)
          .maybeSingle();

        if (alive && nm) {
          setRow(nm);
          setTeamLocal(nm.equipo1 ? nm.equipo1.toUpperCase() : "");
          setTeamAway(nm.equipo2 ? nm.equipo2.toUpperCase() : "");
          setLugar(nm.lugar ? nm.lugar.toUpperCase() : "");
          setCompetition(nm.competition || "");
          if (nm.match_iso) {
            const dt = new Date(nm.match_iso);
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, "0");
            const dd = String(dt.getDate()).padStart(2, "0");
            const hh = String(dt.getHours()).padStart(2, "0");
            const mi = String(dt.getMinutes()).padStart(2, "0");
            setDateStr(`${yyyy}-${mm}-${dd}`);
            setTimeStr(`${hh}:${mi}`);
          } else {
            setDateStr(""); setTimeStr("");
          }
        }
      } finally {
        if (alive) setLoading(false);
        clearTimeout(safety);
      }
    })();

    return () => { alive = false; clearTimeout(safety); };
  }, []);

  const teamA = useMemo(() => (row?.equipo1 || teamLocal || "").toUpperCase(), [row, teamLocal]);
  const teamB = useMemo(() => (row?.equipo2 || teamAway  || "").toUpperCase(), [row, teamAway]);

  const dateObj = useMemo(() => {
    if (row?.match_iso) return new Date(row.match_iso);
    if (dateStr && timeStr) return new Date(`${dateStr}T${timeStr}:00`);
    return null;
  }, [row, dateStr, timeStr]);

  const longDate = useMemo(() => (dateObj ? toLongGalician(dateObj) : null), [dateObj]);

  async function onSave(e) {
    e?.preventDefault?.();
    setInfo(""); setErr(""); setErrDetail("");
    try {
      if (!teamLocal.trim() || !teamAway.trim() || !lugar.trim()) {
        setErr("Completa equipo local, visitante e lugar.");
        return;
      }
      if (!dateStr || !timeStr) {
        setErr("Completa data e hora.");
        return;
      }
      setSaving(true);

      const local = new Date(`${dateStr}T${timeStr}:00`);
      const match_iso = local.toISOString();

      const payload = {
        id: 1,
        equipo1: teamLocal.trim().toUpperCase(),
        equipo2: teamAway.trim().toUpperCase(),
        lugar: lugar.trim().toUpperCase(),
        competition: competition || null,
        match_iso,
        tz: "Europe/Madrid",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("next_match").upsert(payload, { onConflict: "id" });
      if (error) throw error;

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setInfo(`Gardado e publicado ás ${hh}:${mm}:${ss}`);

      setTimeout(() => { window.location.reload(); }, 450);
    } catch (e2) {
      console.error("[ProximoPartido] save error:", e2);
      setErr("Erro gardando os datos.");
      setErrDetail(e2?.message || String(e2));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main style={WRAP}>Cargando…</main>;

  // Espacio para el escudo a la derecha (PC)
  const rightPad = (!isMobile ? 220 : 0);

  const justTime = useMemo(() => {
    if (!dateObj) return null;
    try {
      return new Intl.DateTimeFormat("gl-ES", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Madrid",
      }).format(dateObj);
    } catch {
      const hh = String(dateObj.getHours()).padStart(2, "0");
      const mm = String(dateObj.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  }, [dateObj]);

  const lugarLegend = (row?.lugar || lugar || "—").toUpperCase();

  return (
    <main style={WRAP}>
      <style>{STYLE_HIDE_NATIVE_DATE}</style>

      <section style={PANEL}>
        {/* Escudo DOBLE tamaño y fijo, sin tapar borde */}
        {!isMobile && (
          <img
            src={ESCUDO_SRC}
            alt="Escudo RC Celta"
            decoding="async"
            loading="eager"
            style={{
              position: "absolute",
              top: 6, right: 14,
              width: 190, height: "auto",
              opacity: 0.95,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        )}

        <div style={{ position: "relative", zIndex: 1, paddingRight: rightPad }}>
          <h2 style={TITLE_LINE}>
            <span style={TEAM_NAME}>{teamA || "—"}</span>
            <span style={VS_STYLE}>vs</span>
            <span style={TEAM_NAME}>{teamB || "—"}</span>
          </h2>

          <p style={LINE_GRAY}>
            Competición: <strong>{row?.competition || competition || "—"}</strong>
          </p>

          <p style={LINE_GRAY}>
            Data: <strong>{capFirst(longDate || "—")}</strong>
          </p>

          <p style={LINE_GRAY}>
            Hora: {justTime ? <strong>{justTime}</strong> : "—"}
          </p>

          {/* METEO (estructura idéntica a la tuya, sin tocar lógica) */}
          <hr style={HR} />
          <div style={{ position: "relative", marginTop: 14 }}>
            <span
              style={{
                position: "relative",
                top: 0,
                left: 0,
                padding: "6px 10px",
                background: "#e0f2fe",
                color: "#0369a1",
                fontWeight: 800,
                borderRadius: 999,
                display: "inline-block",
                boxShadow: "0 2px 8px rgba(14,165,233,.25)",
              }}
            >
              METEO: {lugarLegend}
            </span>
            <span
              style={{
                marginLeft: 8,
                padding: "6px 10px",
                background: "#e5e7eb",
                color: "#334155",
                borderRadius: 999,
                display: "inline-block",
              }}
            >
              Previsión para a hora de partido
            </span>

            <div
              style={{
                marginTop: 10,
                position: "relative",
                border: "2px dashed #cbd5e1",
                borderRadius: 12,
                padding: "14px 12px",
                background: "#fff",
                zIndex: 1,
              }}
            >
              {/* Aquí seguiría tu bloque de meteo si lo cargas (omitido para centrar en RLS) */}
            </div>
          </div>
        </div>

        {/* Form ADMIN */}
        {isAdmin && (
          <form style={ADMIN_BOX} onSubmit={onSave}>
            <div style={{ ...ROW, marginBottom: 12 }}>
              <div>
                <label style={LABEL}>Competición</label>
                <div style={SELECT_WRAP}>
                  <select
                    value={competition}
                    onChange={(e) => setCompetition(e.currentTarget.value)}
                    style={SELECT_BASE}
                  >
                    <option value="">(selecciona)</option>
                    <option value="LaLiga">LaLiga</option>
                    <option value="Europa League">Europa League</option>
                    <option value="Copa do Rei">Copa do Rei</option>
                  </select>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={SELECT_ARROW}>
                    <path d="M6 9l6 6 6-6" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div>
                <label style={LABEL}>Lugar</label>
                <input
                  style={INPUT_LUGAR}
                  value={lugar}
                  onInput={(e) => setLugar(e.currentTarget.value.toUpperCase())}
                  placeholder="Ex.: VIGO"
                />
              </div>
            </div>

            <div style={{ ...ROW, marginBottom: 12 }}>
              <div>
                <label style={LABEL}>Equipo local</label>
                <input
                  style={INPUT_EQ}
                  value={teamLocal}
                  onInput={(e) => setTeamLocal(e.currentTarget.value.toUpperCase())}
                  placeholder="(sen valor por defecto)"
                />
              </div>
              <div>
                <label style={LABEL}>Equipo visitante</label>
                <input
                  style={INPUT_EQ}
                  value={teamAway}
                  onInput={(e) => setTeamAway(e.currentTarget.value.toUpperCase())}
                  placeholder="GIRONA"
                />
              </div>
            </div>

            <div style={{ ...ROW, marginBottom: 12 }}>
              <div>
                <label style={LABEL}>Data oficial confirmada</label>
                <div style={{ position: "relative" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ position: "absolute", left: 10, top: 10 }}>
                    <rect x="3" y="4.5" width="18" height="16" rx="2" stroke="#0ea5e9" strokeWidth="1.8" />
                    <path d="M7 2.5v4M17 2.5v4M3 9h18" stroke="#0ea5e9" strokeWidth="1.8" />
                  </svg>
                  <input
                    id="nm-date" class="nm-date" type="date"
                    style={INPUT_DATE}
                    value={dateStr}
                    onInput={(e) => setDateStr(e.currentTarget.value)}
                  />
                </div>
              </div>

              <div>
                <label style={LABEL}>Hora confirmada</label>
                <div style={SELECT_WRAP}>
                  <select style={SELECT_BASE} value={timeStr} onChange={(e) => setTimeStr(e.currentTarget.value)}>
                    <option value="">(selecciona)</option>
                    {timeOptions().map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={SELECT_ARROW}>
                    <path d="M6 9l6 6 6-6" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            <button type="submit" style={BTN_SAVE} disabled={saving}>
              {saving ? "Gardando…" : "Gardar"}
            </button>

            {info && <p style={INFO}>{info}</p>}
            {err && (
              <>
                <p style={ERR}>{err}</p>
                {errDetail && <p style={{...ERR, opacity:.9}}>Detalle técnico: {errDetail}</p>}
              </>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
