// src/pages/ProximoPartido.jsx
import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const ESCUDO_SRC = "/escudo.png";

/* ===== Layout base ===== */
const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };

/* Panel principal: fondo BLANCO y borde celeste */
const PANEL = {
  position: "relative",
  border: "1px solid #cfe8ff",
  borderRadius: 18,
  background: "#fff",
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: "18px 16px",
};

/* Bloque de texto: fondo CELESTE suave (intocable el banner de meteo) */
const TOP_BOX = {
  background: "linear-gradient(180deg, rgba(224,242,254,0.55), rgba(191,219,254,0.45))",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: "14px 12px",
  marginBottom: 12,
};

/* ===== Título EQUIPO1 vs EQUIPO2 ===== */
const TITLE_LINE_BASE = {
  margin: "0 0 8px 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  letterSpacing: ".3px",
  color: "#0f172a",
  lineHeight: 1.08,
  fontSize: 30,
  fontWeight: 700,
};
const TITLE_LINE = (isMobile) => ({
  ...TITLE_LINE_BASE,
  fontSize: isMobile ? 22 : 30, // móvil +5% respecto al ajuste anterior
});

const TEAM_NAME = { fontWeight: 700, textTransform: "uppercase" };
const VS_STYLE_BASE = { fontWeight: 600, fontSize: 22, margin: "0 8px" };
const VS_STYLE = (isMobile) => ({
  ...VS_STYLE_BASE,
  fontSize: isMobile ? 17 : 22,
});

const LINE_GRAY = {
  margin: "6px 0 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  fontSize: 19,
  color: "#64748b",
  fontWeight: 600,
};

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
  borderBottom: "none", // ✅ eliminar línea celeste bajo el subtexto (móvil y desktop)
});
const METEO_BAR = (isMobile) => ({
  display: "flex",
  gap: isMobile ? 20 : 28,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  maxWidth: 1000,
  margin: isMobile ? "10px auto 0" : "0 auto", // espacio entre “METEO | Lugar” e iconos
  color: "#0f172a",
  fontSize: isMobile ? 20 : 22, // móvil -10% (22 → 20), desktop se mantiene
  fontWeight: 700,
});
const METEO_LEGEND_TOP = (isMobile) => ({
  position: "absolute",
  top: 6,
  left: "50%",
  transform: "translateX(-50%)",
  fontSize: isMobile ? 13 : 13, // móvil +10% (12 → 13); desktop 13
  fontWeight: 800,
  color: "#0284c7",
  letterSpacing: ".3px",
});
const METEO_SUBLEGEND_AFTER = (isMobile) => ({
  textAlign: "center",
  marginTop: 0, // ✅ sin línea extra en móvil y desktop
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

// Cache simple 24h en localStorage (só meteo)
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
    if (Date.now() - obj.t > WX_TTL_MS) return null; // caducado
    return obj.v;
  } catch { return null; }
}
function setCachedWx(lugar, matchISO, val) {
  const k = wxKey(lugar, matchISO);
  if (!k) return;
  try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), v: val })); } catch {}
}

/* Meteo auxiliar */
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
    const lat = loc.latitude, lon = loc.longitude;

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
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 560 : false
  );
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

  // Refresca sesión ligera para evitar quedarse en "Cargando…" tras deploy
  useEffect(() => {
    supabase.auth.getSession().then(() => {
      // intento de refresh no intrusivo
      supabase.auth.refreshSession().catch(() => {});
    });
  }, []);

  function shouldRefreshDaily(existing) {
    return !existing; // cache local 24h
  }

  async function loadData() {
    setError(null);
    setLoading(true);
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
        const within8days = dMs <= 8 * 24 * 3600 * 1000;
        if (within8days) {
          const fresh = await fetchMeteoFor(nm.lugar, nm.match_iso);
          if (fresh) {
            setMeteo(fresh);
            setCachedWx(nm.lugar, nm.match_iso, fresh);
            try {
              await supabase
                .from("next_match")
                .update({ weather_json: fresh, updated_at: new Date().toISOString() })
                .eq("id", 1);
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err?.message || "Erro ao cargar datos.");
    } finally {
      setLoading(false);
    }
  }

  // Guard anti-cargando eterno
  useEffect(() => {
    if (loading) {
      guardRef.current = setTimeout(() => setShowReload(true), 4500);
    }
    return () => {
      if (guardRef.current) clearTimeout(guardRef.current);
      setShowReload(false);
    };
  }, [loading]);

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <main style={WRAP}>
        <p style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}>Cargando…</p>
        {showReload && (
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => loadData()}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #cbd5e1", background: "#eef2ff", fontWeight: 700 }}
            >
              Reintentar
            </button>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("v", String(Date.now()));
                window.location.replace(url.toString());
              }}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #93c5fd", background: "#dbeafe", fontWeight: 700 }}
            >
              Actualizar app
            </button>
          </div>
        )}
      </main>
    );
  }

  // Sen partido → mensaxe centrada
  if (!row) {
    return (
      <>
        <main style={WRAP}>
          <section style={PANEL}>
            <div style={{
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              padding: "28px 12px",
              fontFamily: "Montserrat, system-ui, sans-serif",
              color: "#0f172a"
            }}>
              <h2 style={{ margin: 0, fontWeight: 800 }}>Agardando novo Próximo Partido</h2>
              <p style={{ margin: "10px 0 0", color: "#475569" }}>
                Os administradores establecerán un novo encontro en breve. Visítanos axiña; é probábel que en poucas horas esta páxina volva estar actualizada. Grazas!
              </p>
              {error && <p style={{ color: "#ef4444", marginTop: 10 }}>Erro: {error}</p>}
            </div>
          </section>
        </main>
      </>
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
      {/* Banner METEO */}
      <div style={BLEED_WRAP}>
        <div style={METEO_BANNER(isMobile)}>
          <div style={METEO_LEGEND_TOP(isMobile)}>METEO | {lugar}</div>
          {meteoContent}
          <div style={METEO_SUBLEGEND_AFTER(isMobile)}>PREVISIÓN HORA PARTIDO</div>
        </div>
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
                top: 2,
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

              <p style={LINE_GRAY}>
                Competición:{" "}
                <strong style={{ fontWeight: 700, color: "#0f172a" }}>{competition}</strong>
              </p>
              <p style={LINE_GRAY}>
                Lugar:{" "}
                <strong style={{ fontWeight: 700, color: "#0f172a" }}>{lugar}</strong>
              </p>
              <p style={LINE_GRAY}>
                Data:{" "}
                <strong style={{ fontWeight: 700, color: "#0f172a" }}>{capFirst(longDate)}</strong>
              </p>
              <p style={LINE_GRAY}>
                Hora:{" "}
                <strong style={{ fontWeight: 700, color: "#0f172a" }}>{justTime}</strong>
              </p>

              {error && (
                <p style={{ color: "#ef4444", marginTop: 10 }}>
                  Erro ao cargar datos: {error}
                </p>
              )}
            </div>
          </div>

          {isMobile && (
            <div style={{ marginTop: 16, display: "grid", placeItems: "center" }}>
              <img
                src={ESCUDO_SRC}
                alt="Escudo RC Celta"
                decoding="async"
                loading="eager"
                style={{ width: ESCUDO_W, height: "auto", opacity: 0.98 }}
              />
            </div>
          )}
        </section>
      </main>
    </>
  );
}

