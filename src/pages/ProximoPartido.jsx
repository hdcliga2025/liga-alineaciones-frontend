// src/pages/ProximoPartido.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const ESCUDO_SRC = "/escudo.png";

/* ===== Layout base ===== */
const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };

const PANEL = {
  position: "relative",
  border: "2px solid #0ea5e9", // celeste
  borderRadius: 18,
  background: "#fff",
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: "18px 16px",
};

/* ===== Bloque superior (texto) ===== */
const TOP_BOX = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: "14px 12px",
  marginBottom: 12,
};

const TITLE_LINE = {
  margin: "0 0 8px 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  letterSpacing: ".3px",
  color: "#0f172a",
  lineHeight: 1.08,
  fontSize: 30,
  fontWeight: 700,
};
const TEAM_NAME = { fontWeight: 700, textTransform: "uppercase" };
const VS_STYLE = { fontWeight: 600, fontSize: 22, margin: "0 8px" };

const LINE_GRAY = {
  margin: "6px 0 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  fontSize: 19,
  color: "#64748b",
  fontWeight: 600,
};

const HR = { border: 0, borderTop: "1px solid #e5e7eb", margin: "14px 0" };

/* ===== Banner METEO (full-bleed) ===== */
const BLEED_WRAP = {
  width: "100vw",
  marginLeft: "50%",
  transform: "translateX(-50%)",
};

const METEO_BANNER = (isMobile) => ({
  position: "relative",
  width: "100%",
  padding: isMobile ? "22px 14px" : "26px 20px",
  background: "linear-gradient(180deg, rgba(224,242,254,0.9), rgba(191,219,254,0.9))",
  borderTop: "1px solid #bae6fd",
  borderBottom: "1px solid #93c5fd",
});

const METEO_BAR = (isMobile) => ({
  display: "flex",
  gap: isMobile ? 18 : 28,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  maxWidth: 1000,
  margin: "0 auto",
  color: "#0f172a",
  fontSize: isMobile ? 18 : 22,
  fontWeight: 700,
});

const METEO_LEGEND_TOP = (isMobile) => ({
  position: "absolute",
  top: 6,
  left: "50%",
  transform: "translateX(-50%)",
  fontSize: isMobile ? 12 : 13,
  fontWeight: 800,
  color: "#0284c7",
  letterSpacing: ".3px",
});

const METEO_SUBLEGEND_AFTER = (isMobile) => ({
  textAlign: "center",
  marginTop: isMobile ? 6 : 8,
  fontSize: isMobile ? 11 : 12,
  fontWeight: 600,
  color: "#475569",
  letterSpacing: ".2px",
});

/* ===== Utilidades ===== */
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

async function fetchMeteoFor(lugar, matchISO) {
  try {
    if (!lugar || !matchISO) return null;
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(lugar)}&count=1&language=gl&format=json`
    );
    const geo = await geoRes.json();
    const loc = geo?.results?.[0];
    if (!loc) return null;

    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
        `&hourly=temperature_2m,precipitation_probability,wind_speed_10m&timezone=Europe/Madrid&forecast_days=3`
    );
    const wx = await wxRes.json();
    const times = wx?.hourly?.time || [];
    if (!times.length) return null;

    const target = new Date(matchISO);
    const fmt = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(target).reduce((a, p) => {
      a[p.type] = p.value;
      return a;
    }, {});
    const localISO = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;

    let idx = times.indexOf(localISO);
    if (idx === -1) {
      let best = 0,
        bestDiff = Infinity;
      for (let i = 0; i < times.length; i++) {
        const d = Math.abs(new Date(times[i]).getTime() - new Date(localISO).getTime());
        if (d < bestDiff) {
          bestDiff = d;
          best = i;
        }
      }
      idx = best;
    }

    return {
      temp_c: wx.hourly.temperature_2m?.[idx] ?? null,
      wind_kmh: wx.hourly.wind_speed_10m?.[idx] ?? null,
      precip_prob_pct: wx.hourly.precipitation_probability?.[idx] ?? null,
    };
  } catch {
    return null;
  }
}

export default function ProximoPartido() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth <= 560);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meteo, setMeteo] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: nm } = await supabase
        .from("next_match")
        .select("equipo1, equipo2, lugar, competition, match_iso, weather_json")
        .eq("id", 1)
        .maybeSingle();

      if (alive) {
        setRow(nm || null);
        setMeteo(nm?.weather_json || null);

        if (nm?.match_iso && !nm?.weather_json) {
          const ms = new Date(nm.match_iso).getTime() - Date.now();
          if (ms <= 48 * 3600 * 1000 && nm.lugar) {
            const wx = await fetchMeteoFor(nm.lugar, nm.match_iso);
            if (alive && wx) setMeteo(wx);
          }
        }
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <main style={WRAP}>Cargando…</main>;

  const teamA = (row?.equipo1 || "—").toUpperCase();
  const teamB = (row?.equipo2 || "—").toUpperCase();
  const lugar = (row?.lugar || "—").toUpperCase();
  const competition = row?.competition || "—";

  const dateObj = row?.match_iso ? new Date(row.match_iso) : null;
  const longDate = dateObj ? toLongGalician(dateObj) : "—";
  const justTime = dateObj
    ? new Intl.DateTimeFormat("gl-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Madrid",
      }).format(dateObj)
    : "—";

  const ESCUDO_W = isMobile ? 260 : 170;
  const showEscudo = true;
  const rightPad = !isMobile && showEscudo ? ESCUDO_W + 24 : 0;

  const meteoContent = (
    <div style={METEO_BAR(isMobile)}>
      <span>🌡️ <strong>{meteo?.temp_c != null ? `${Math.round(meteo.temp_c)} °C` : "—"}</strong></span>
      <span>💨 <strong>{meteo?.wind_kmh != null ? `${Math.round(meteo.wind_kmh)} km/h` : "—"}</strong></span>
      <span>☔ <strong>{meteo?.precip_prob_pct != null ? `${meteo.precip_prob_pct}%` : "—"}</strong></span>
    </div>
  );

  return (
    <>
      {/* ===== Banner METEO ===== */}
      <div style={BLEED_WRAP}>
        <div style={METEO_BANNER(isMobile)}>
          <div style={METEO_LEGEND_TOP(isMobile)}>METEO | {lugar}</div>
          {meteoContent}
          <div style={METEO_SUBLEGEND_AFTER(isMobile)}>PREVISIÓN HORA PARTIDO</div>
        </div>
      </div>

      {/* ===== Contenido principal ===== */}
      <main style={WRAP}>
        <section style={PANEL}>
          {!isMobile && showEscudo && (
            <img
              src={ESCUDO_SRC}
              alt="Escudo RC Celta"
              style={{
                position: "absolute",
                top: 2,
                right: 10,
                width: ESCUDO_W,
                opacity: 0.96,
                pointerEvents: "none",
              }}
            />
          )}

          <div style={{ position: "relative", zIndex: 1, paddingRight: rightPad }}>
            <div style={TOP_BOX}>
              <h2 style={TITLE_LINE}>
                <span style={TEAM_NAME}>{teamA}</span>
                <span style={VS_STYLE}>vs</span>
                <span style={TEAM_NAME}>{teamB}</span>
              </h2>

              <p style={LINE_GRAY}>Competición: <strong>{competition}</strong></p>
              <p style={LINE_GRAY}>Data: <strong>{capFirst(longDate)}</strong></p>
              <p style={LINE_GRAY}>Hora: <strong>{justTime}</strong></p>
            </div>

            <hr style={HR} />
          </div>

          {isMobile && showEscudo && (
            <div style={{ marginTop: 16, display: "grid", placeItems: "center" }}>
              <img src={ESCUDO_SRC} alt="Escudo RC Celta" style={{ width: ESCUDO_W, opacity: 0.98 }} />
            </div>
          )}
        </section>
      </main>
    </>
  );
}
