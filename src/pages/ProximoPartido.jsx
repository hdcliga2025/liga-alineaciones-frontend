// src/pages/ProximoPartido.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

const ADMIN_EMAILS = new Set(["hdcliga@gmail.com", "hdcliga2@gmail.com"]);
const TZ_DEFAULT = "Europe/Madrid";

// Devuelve o offset (en minutos) da zona en determinada data
function tzOffsetMinutesAt(tz, date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(date);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+0";
  // tzName adoita vir como "GMT+2" ou "GMT-1"
  const m = tzName.match(/GMT([+-]\d+)/);
  const hours = m ? parseInt(m[1], 10) : 0;
  return hours * 60;
}

// Constrúe un ISO UTC a partir de (YYYY-MM-DD, HH:MM) en tz
function buildMatchISO(dateText, timeText, tz = TZ_DEFAULT) {
  if (!dateText || !timeText) return null;
  const [y, m, d] = dateText.split("-").map((n) => parseInt(n, 10));
  const [hh, mm] = timeText.split(":").map((n) => parseInt(n, 10));
  // Base como se fose en UTC
  const baseUTC = new Date(Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0));
  // Offset real desa data en tz
  const offMin = tzOffsetMinutesAt(tz, baseUTC); // ex. CEST → +120
  const utcMs = baseUTC.getTime() - offMin * 60_000;
  return new Date(utcMs).toISOString();
}

const HOURS_15M = (() => {
  const out = [];
  for (let h = 12; h <= 23; h++) {
    for (const m of [0, 15, 30, 45]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
})();

export default function ProximoPartido() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [savedAt, setSavedAt] = useState("");

  // Formulario — só campos básicos que xa existían
  const [form, setForm] = useState({
    team1: "RC Celta",
    team2: "",
    place: "",
    date_text: "",
    time_text: "",
    tz: TZ_DEFAULT,
  });

  // Meteo en cliente (placeholder a >48h)
  const [meteo, setMeteo] = useState({ loading: false, text: "", placeholder: false });

  useEffect(() => {
    let alive = true;

    (async () => {
      // Sesión + admin
      const { data: s } = await supabase.auth.getSession();
      const email = s?.session?.user?.email || "";
      if (ADMIN_EMAILS.has((email || "").toLowerCase())) setIsAdmin(true);

      // Cargar next_match (id=1)
      const { data, error } = await supabase
        .from("next_match")
        .select("team1, team2, place, date_text, time_text, tz, match_iso")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data && alive) {
        setForm({
          team1: data.team1 || "RC Celta",
          team2: data.team2 || "",
          place: data.place || "",
          date_text: data.date_text || "",
          time_text: data.time_text || "",
          tz: data.tz || TZ_DEFAULT,
        });
        // Meteo client-side (se faltan ≤ 48h)
        hydrateMeteo(data.place, data.match_iso || null, data.tz || TZ_DEFAULT);
      } else {
        // Estado por defecto
        hydrateMeteo("", null, TZ_DEFAULT);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onChange(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSave(e) {
    e?.preventDefault?.();
    setSaving(true);
    try {
      if (!form.team1.trim() || !form.team2.trim() || !form.place.trim() || !form.date_text || !form.time_text) {
        alert("Completa Equipo Local, Equipo Visitante, Lugar, Data e Hora.");
        setSaving(false);
        return;
      }

      const match_iso = buildMatchISO(form.date_text, form.time_text, form.tz || TZ_DEFAULT);
      if (!match_iso) {
        alert("Non puidemos calcular a hora ISO. Revisa a data e a hora.");
        setSaving(false);
        return;
      }

      // Gardamos en BBDD
      const payload = {
        id: 1,
        team1: form.team1.trim().toUpperCase(),
        team2: form.team2.trim().toUpperCase(),
        place: form.place.trim().toUpperCase(),
        date_text: form.date_text,
        time_text: form.time_text,
        tz: form.tz || TZ_DEFAULT,
        match_iso,
      };

      const { error } = await supabase.from("next_match").upsert(payload, { onConflict: "id" });
      if (error) {
        console.error(error);
        alert("Erro gardando o partido.");
        setSaving(false);
        return;
      }

      // Mensaxe e recarga (para refrescar o contador do NavBar)
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setSavedAt(`${hh}:${mm}:${ss}`);

      // Meteo local inmediata
      hydrateMeteo(payload.place, payload.match_iso, payload.tz);

      // Pequeña pausa visual e recarga
      setTimeout(() => {
        window.location.reload();
      }, 650);
    } finally {
      setSaving(false);
    }
  }

  // Meteo en cliente: Open-Meteo + Geocoding cando falten ≤48h
  async function hydrateMeteo(place, matchISO, tz) {
    try {
      if (!place || !matchISO) {
        setMeteo({ loading: false, text: "", placeholder: true });
        return;
      }
      const now = Date.now();
      const t = Date.parse(matchISO);
      if (isNaN(t) || t - now > 48 * 3600 * 1000) {
        setMeteo({ loading: false, text: "", placeholder: true });
        return;
      }

      setMeteo((m) => ({ ...m, loading: true }));
      // 1) Geocoding
      const gRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=gl`
      );
      const g = await gRes.json();
      const r = g?.results?.[0];
      if (!r) {
        setMeteo({ loading: false, text: "Non se atopou localización para Meteo.", placeholder: false });
        return;
      }

      // 2) Forecast
      const fRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${r.latitude}&longitude=${r.longitude}` +
          `&hourly=temperature_2m,precipitation_probability,windspeed_10m&timezone=${encodeURIComponent(tz || TZ_DEFAULT)}`
      );
      const f = await fRes.json();
      const hours = f?.hourly?.time || [];
      const temp = f?.hourly?.temperature_2m || [];
      const wind = f?.hourly?.windspeed_10m || [];
      const prob = f?.hourly?.precipitation_probability || [];

      // 3) Hora máis próxima
      let idx = -1,
        best = Infinity;
      for (let i = 0; i < hours.length; i++) {
        const dt = Date.parse(hours[i]);
        const d = Math.abs(dt - t);
        if (d < best) {
          best = d;
          idx = i;
        }
      }
      if (idx < 0) {
        setMeteo({ loading: false, text: "Non hai tramos horarios dispoñibles para Meteo.", placeholder: false });
        return;
      }

      const gl = `Temp: ${Math.round(temp[idx])}ºC · Vento: ${Math.round(wind[idx])} km/h · Prob. chuvia: ${prob[idx] ?? 0}%`;
      setMeteo({ loading: false, text: gl, placeholder: false });
    } catch (e) {
      console.error(e);
      setMeteo({ loading: false, text: "Erro obtendo Meteo.", placeholder: false });
    }
  }

  const kickoffLocalStr = useMemo(() => {
    if (!form.date_text || !form.time_text) return "";
    try {
      // Só para mostrar: Data e Hora tal cal
      return `${form.date_text} · ${form.time_text} (${form.tz || TZ_DEFAULT})`;
    } catch {
      return "";
    }
  }, [form.date_text, form.time_text, form.tz]);

  if (loading) return <main style={{ padding: 16 }}>Cargando…</main>;

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "16px" }}>
      {/* Cabecera visual simple */}
      <section style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 6px 20px rgba(0,0,0,.12)",
            background: "#fff",
          }}
        >
          <img
            src="/escudo.png"
            alt="Escudo"
            width="40"
            height="40"
            style={{ objectFit: "contain", display: "block" }}
            decoding="async"
            loading="eager"
          />
        </div>
        <div>
          <h2 style={{ margin: "0 0 6px", fontFamily: "Montserrat, system-ui, sans-serif", fontWeight: 700 }}>
            {form.team1 || "RC Celta"} <span style={{ fontWeight: 600, fontSize: "90%" }}>vs</span>{" "}
            {form.team2 || "—"}
          </h2>
          {form.date_text && form.time_text ? (
            <p style={{ margin: 0, color: "#334155" }}>{kickoffLocalStr}</p>
          ) : (
            <p style={{ margin: 0, color: "#64748b" }}>Data e hora pendentes de confirmar</p>
          )}
        </div>
      </section>

      {/* Meteo */}
      <section
        style={{
          marginTop: 14,
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 12,
          background: "#fff",
        }}
      >
        <h3 style={{ margin: "0 0 6px" }}>Meteo</h3>
        {meteo.placeholder ? (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 12,
              padding: 12,
              color: "#475569",
              background: "#fff",
            }}
          >
            Información meteorolóxica dispoñible 48 horas antes do partido
          </div>
        ) : meteo.loading ? (
          <p style={{ margin: 0 }}>Cargando previsión…</p>
        ) : meteo.text ? (
          <p style={{ margin: 0 }}>{meteo.text}</p>
        ) : (
          <p style={{ margin: 0, color: "#b91c1c" }}>Non foi posible cargar a Meteo.</p>
        )}
      </section>

      {/* Formulario admin (só emails autorizados) */}
      {isAdmin && (
        <section
          style={{
            marginTop: 18,
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 12,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Editar próximo partido (só admin)</h3>
          <form onSubmit={onSave}>
            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontWeight: 600, color: "#334155" }}>Equipo Local</label>
              <input
                value={form.team1}
                onInput={(e) => onChange("team1", e.currentTarget.value.toUpperCase())}
                placeholder="RC CELTA"
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontWeight: 700,
                }}
              />

              <label style={{ fontWeight: 600, color: "#334155" }}>Equipo Visitante</label>
              <input
                value={form.team2}
                onInput={(e) => onChange("team2", e.currentTarget.value.toUpperCase())}
                placeholder="RIVAL"
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontWeight: 700,
                }}
              />

              <label style={{ fontWeight: 600, color: "#334155" }}>Lugar</label>
              <input
                value={form.place}
                onInput={(e) => onChange("place", e.currentTarget.value.toUpperCase())}
                placeholder="VIGO"
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontWeight: 700,
                }}
              />

              <label style={{ fontWeight: 600, color: "#334155" }}>Fecha oficial confirmada</label>
              <input
                type="date"
                value={form.date_text}
                onInput={(e) => onChange("date_text", e.currentTarget.value)}
                style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
              />

              <label style={{ fontWeight: 600, color: "#334155" }}>Hora confirmada</label>
              <select
                value={form.time_text}
                onChange={(e) => onChange("time_text", e.currentTarget.value)}
                style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
              >
                <option value="">—</option>
                {HOURS_15M.map((h) => (
                  <option value={h}>{h}</option>
                ))}
              </select>

              {/* Zona horaria (fixa por defecto; editable por se acaso) */}
              <label style={{ fontWeight: 600, color: "#334155" }}>Zona horaria</label>
              <input
                value={form.tz}
                onInput={(e) => onChange("tz", e.currentTarget.value)}
                placeholder="Europe/Madrid"
                style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
              />

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: 6,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid #0ea5e9",
                  backgroundImage: "linear-gradient(180deg,#67b1ff,#5a8df5)",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 10px 24px rgba(14,165,233,.28)",
                }}
              >
                {saving ? "Gardando…" : "Gardar"}
              </button>

              {savedAt && (
                <p style={{ margin: "6px 0 0", color: "#0f766e" }}>
                  Gardado e publicado ás {savedAt}
                </p>
              )}
            </div>
          </form>
        </section>
      )}
    </main>
  );
}


