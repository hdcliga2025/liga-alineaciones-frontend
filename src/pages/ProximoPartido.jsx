// src/pages/ProximoPartido.jsx
import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const ESCUDO_SRC = "/escudo.png";

/* ===== Layout base ===== */
const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };

/* Panel principal */
const PANEL = {
  position: "relative",
  border: "1px solid #cfe8ff",
  borderRadius: 18,
  background: "#fff",
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: "18px 16px",
};

/* Bloque de texto (tarxeta) */
const TOP_BOX = {
  background: "linear-gradient(180deg, rgba(224,242,254,0.55), rgba(191,219,254,0.45))",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: "14px 12px",
  marginBottom: 12,
};

/* === Escala -10% textos de la TARJETA === */
const SCALE = 0.9;

/* Título EQUIPO1 vs EQUIPO2 (aplica -10% a móvil y desktop) */
const TITLE_LINE_BASE = {
  margin: "0 0 8px 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  letterSpacing: ".3px",
  color: "#0f172a",
  lineHeight: 1.08,
  fontWeight: 700,
};
const TITLE_LINE = (isMobile) => ({
  ...TITLE_LINE_BASE,
  fontSize: (isMobile ? 18 : 30) * SCALE, // 18→16.2 | 30→27
});
const TEAM_NAME = { fontWeight: 700, textTransform: "uppercase" };
const VS_STYLE = (isMobile) => ({
  fontWeight: 600,
  fontSize: (isMobile ? 17 : 22) * SCALE, // 17→15.3 | 22→19.8
  margin: "0 8px",
});

/* Líneas secundarias (Competición/Lugar/Data/Hora) */
const LINE_GRAY = {
  margin: "6px 0 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  fontSize: 19 * SCALE, // 19→17.1
  color: "#64748b",
  fontWeight: 600,
};

/* ===== Banner METEO (full-bleed, SOLO ICONOS) ===== */
const BLEED_WRAP = { width: "100vw", marginLeft: "50%", transform: "translateX(-50%)" };
const METEO_BANNER = (isMobile) => ({
  position: "relative",
  width: "100%",
  padding: isMobile ? "22px 14px" : "26px 20px",
  background: "linear-gradient(180deg, rgba(224,242,254,0.9), rgba(191,219,254,0.9))",
  border: "none",
  boxShadow: "none",
  outline: "none",
  paddingTop: isMobile ? 26 : 28,
  paddingBottom: isMobile ? 26 : 28,
});
const METEO_BAR = (isMobile) => ({
  display: "flex",
  gap: isMobile ? 18 : 26,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  maxWidth: 1000,
  margin: "0 auto",
  color: "#0f172a",
  fontSize: isMobile ? 18 : 22,
  fontWeight: 700,
});

/* Leyenda baixo o banner (gl) */
const METEO_LEGEND_OUT = {
  textAlign: "center",
  margin: "6px 0 10px",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  fontSize: 15,
  fontWeight: 400,
  color: "#0369a1",
  letterSpacing: ".2px",
};

/* ===== Utils ===== */
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
const capFirst = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Cache simple 24h (meteo)
const WX_TTL_MS = 24 * 3600 * 1000;
function wxKey(lugar, matchISO, tz = "Europe/Madrid") {
  if (!lugar || !matchISO) return null;
  const target = new Date(matchISO);
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = fmt.formatToParts(target).reduce((a, p) => { a[p.type] = p.value; return a; }, {});
  const localISO = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  return `wx:${lugar}:${localISO}`;
}
function getCachedWx(lugar, matchISO) {
  const k = wxKey(lugar, matchISO);
  if (!k) return null;
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.t || !obj.v) return null;
    if (Date.now() - obj.t > WX_TTL_MS) return null;
    return obj.v;
  } catch { return null; }
}
function setCachedWx(lugar, matchISO, val) {
  const k = wxKey(lugar, matchISO);
  if (!k) return;
  try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), v: val })); } catch {}
}

async function fetchMeteoFor(lugar, matchISO) {
  try {
    if (!lugar || !matchISO) return null;
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(lugar)}&count=1&language=gl&format=json`,
      { cache: "no-store" }
    );
    const geo = await geoRes.json();
    const loc = geo?.results?.[0];
    if (!loc) return null;
    const { latitude: lat, longitude: lon } = loc;

    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&hourly=temperature_2m,precipitation_probability,wind_speed_10m&timezone=Europe/Madrid&forecast_days=8`,
      { cache: "no-store" }
    );
    const wx = await wxRes.json();
    const times = wx?.hourly?.time || [];
    if (!times.length) return null;

    const target = new Date(matchISO);
    const fmt = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const parts = fmt.formatToParts(target).reduce((a, p) => { a[p.type] = p.value; return a; }, {});
    const localISO = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;

    let idx = times.indexOf(localISO);
    if (idx === -1) {
      let best = 0, bestDiff = Infinity;
      const targetMs = new Date(localISO + ":00").getTime();
      for (let i = 0; i < times.length; i++) {
        const d = Math.abs(new Date(times[i] + ":00").getTime() - targetMs);
        if (d < bestDiff) { bestDiff = d; best = i; }
      }
      idx = best;
    }

    return {
      temp_c: wx.hourly.temperature_2m?.[idx] ?? null,
      wind_kmh: wx.hourly.wind_speed_10m?.[idx] ?? null,
      precip_prob_pct: wx.hourly.precipitation_probability?.[idx] ?? null,
      src: "open-meteo",
    };
  } catch { return null; }
}

export default function ProximoPartido() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meteo, setMeteo] = useState(null);
  const [error, setError] = useState(null);
  const [showReload, setShowReload] = useState(false);
  const guardRef = useRef(null);

  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 560);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // refresh silencioso de sesión
  useEffect(() => { supabase.auth.getSession().then(() => supabase.auth.refreshSession().catch(()=>{})); }, []);

  function shouldRefreshDaily(existing) { return !existing; }

  async function loadData() {
    setError(null); setLoading(true);
    try {
      const { data: nm, error: e } = await supabase
        .from("next_match")
        .select("equipo1, equipo2, lugar, competition, match_iso, weather_json")
        .eq("id", 1)
        .maybeSingle();
      if (e) throw e;
      setRow(nm || null);

      let wx = getCachedWx(nm?.lugar, nm?.match_iso) || nm?.weather_json || null;
      if (wx) setMeteo(wx);

      if (nm?.match_iso && nm?.lugar && shouldRefreshDaily(wx)) {
        const dMs = new Date(nm.match_iso).getTime() - Date.now();
        if (dMs <= 8 * 24 * 3600 * 1000) {
          const fresh = await fetchMeteoFor(nm.lugar, nm.match_iso);
          if (fresh) {
            setMeteo(fresh);
            setCachedWx(nm.lugar, nm.match_iso, fresh);
            try { await supabase.from("next_match").update({ weather_json: fresh, updated_at: new Date().toISOString() }).eq("id", 1); } catch {}
          }
        }
      }
    } catch (err) {
      setError(err?.message || "Erro ao cargar datos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loading) { guardRef.current = setTimeout(() => setShowReload(true), 4500); }
    return () => { if (guardRef.current) clearTimeout(guardRef.current); setShowReload(false); };
  }, [loading]);

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <main style={WRAP}>
        <p style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}>Cargando…</p>
        {showReload && (
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => loadData()} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#eef2ff", fontWeight: 700 }}>Reintentar</button>
            <button onClick={() => { const url = new URL(window.location.href); url.searchParams.set("v", String(Date.now())); window.location.replace(url.toString()); }} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #93c5fd", background: "#dbeafe", fontWeight: 700 }}>Actualizar app</button>
          </div>
        )}
      </main>
    );
  }

  if (!row) {
    return (
      <main style={WRAP}>
        <section style={PANEL}>
          <div style={{ display: "grid", placeItems: "center", textAlign: "center", padding: "28px 12px", fontFamily: "Montserrat, system-ui, sans-serif", color: "#0f172a" }}>
            <h2 style={{ margin: 0, fontWeight: 800 }}>Agardando novo Próximo Partido</h2>
            <p style={{ margin: "10px 0 0", color: "#475569" }}>
              Os administradores establecerán un novo encontro en breve. Visítanos axiña; é probábel que en poucas horas esta páxina volva estar actualizada. Grazas!
            </p>
            {error && <p style={{ color: "#ef4444", marginTop: 10 }}>Erro: {error}</p>}
          </div>
        </section>
      </main>
    );
  }

  const teamA = (row?.equipo1 || "—").toUpperCase();
  const teamB = (row?.equipo2 || "—").toUpperCase();
  const lugar = row?.lugar || "—";
  const competition = row?.competition || "—";

  const dateObj = row?.match_iso ? new Date(row.match_iso) : null;
  const longDate = dateObj ? toLongGalician(dateObj) : "—";
  const justTime = dateObj
    ? new Intl.DateTimeFormat("gl-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Madrid" }).format(dateObj)
    : "—";

  const ESCUDO_W = isMobile ? 300 : 200;
  const rightPad = !isMobile ? ESCUDO_W + 24 : 0;

  const meteoContent = (
    <div style={METEO_BAR(isMobile)}>
      <span>🌡️ <strong>{meteo?.temp_c != null ? `${Math.round(meteo.temp_c)} °C` : "—"}</strong></span>
      <span>💨 <strong>{meteo?.wind_kmh != null ? `${Math.round(meteo.wind_kmh)} km/h` : "—"}</strong></span>
      <span>☔ <strong>{meteo?.precip_prob_pct != null ? `${meteo.precip_prob_pct}%` : "—"}</strong></span>
    </div>
  );

  return (
    <>
      {/* Banner METEO (solo iconos) */}
      <div style={BLEED_WRAP}>
        <div style={METEO_BANNER(isMobile)}>{meteoContent}</div>
      </div>
      {/* Leyenda fora (gl) */}
      <div style={METEO_LEGEND_OUT}>
        Meteo en <strong>{lugar}</strong> á hora do partido
      </div>

      {/* Contido principal */}
      <main style={WRAP}>
        <section style={PANEL}>
          {!isMobile && (
            <img
              src={ESCUDO_SRC}
              alt="Escudo RC Celta"
              decoding="async"
              loading="eager"
              style={{
                position: "absolute",
                top: -4,
                right: 10,
                width: ESCUDO_W,
                height: "auto",
                opacity: 0.96,
                pointerEvents: "none",
                zIndex: 0,
              }}
            />
          )}

          <div style={{ position: "relative", zIndex: 1, paddingRight: rightPad }}>
            <div style={TOP_BOX}>
              <h2 style={TITLE_LINE(isMobile)}>
                <span style={TEAM_NAME}>{teamA}</span>
                <span style={VS_STYLE(isMobile)}>vs</span>
                <span style={TEAM_NAME}>{teamB}</span>
              </h2>

              <p style={LINE_GRAY}>Competición: <strong style={{ fontWeight: 700, color: "#0f172a" }}>{competition}</strong></p>
              <p style={LINE_GRAY}>Lugar: <strong style={{ fontWeight: 700, color: "#0f172a" }}>{lugar}</strong></p>
              <p style={LINE_GRAY}>Data: <strong style={{ fontWeight: 700, color: "#0f172a" }}>{capFirst(longDate)}</strong></p>
              <p style={LINE_GRAY}>Hora: <strong style={{ fontWeight: 700, color: "#0f172a" }}>{justTime}</strong></p>
            </div>
          </div>

          {isMobile && (
            <div style={{ marginTop: 4, display: "grid", placeItems: "center" }}>
              <img src={ESCUDO_SRC} alt="Escudo RC Celta" decoding="async" loading="eager" style={{ width: ESCUDO_W, height: "auto", opacity: 0.98 }} />
            </div>
          )}
        </section>
      </main>
    </>
  );
}

