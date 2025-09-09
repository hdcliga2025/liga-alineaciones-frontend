// src/pages/PartidosFinalizados.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const TABLE = "matches_finalizados";

// Esquemas posibles en la BD.
// El componente probará en este orden hasta que uno funcione.
const CANDIDATE_SCHEMAS = [
  { home: "home",      away: "away",        date: "match_date", competition: "competition" },
  { home: "local",     away: "visitante",   date: "match_date", competition: "competition" },
  { home: "equipo1",   away: "equipo2",     date: "match_date", competition: "competition" },
];

// UI helpers
const fmt = (d) => {
  if (!d) return "";
  try {
    const dd = new Date(d);
    const day = String(dd.getDate()).padStart(2, "0");
    const mon = String(dd.getMonth() + 1).padStart(2, "0");
    const yy = String(dd.getFullYear()).slice(-2);
    return `${day}/${mon}/${yy}`;
  } catch { return ""; }
};

export default function PartidosFinalizados() {
  const [schema, setSchema] = useState(null);      // {home, away, date, competition}
  const [rows, setRows] = useState([]);            // [{id,home,away,date,competition}]
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Detecta qué columnas existen y carga filas
  useEffect(() => {
    let alive = true;

    async function detectAndLoad() {
      setErr("");
      setLoading(true);

      // 1) Detectar esquema
      let chosen = null;
      for (const cand of CANDIDATE_SCHEMAS) {
        const sel = ["id", cand.date, cand.competition, cand.home, cand.away]
          .filter(Boolean)
          .join(",");
        const { error } = await supabase.from(TABLE).select(sel).limit(1);
        if (!error) { chosen = cand; break; }
      }

      if (!chosen) {
        setErr("Non foi posible detectar o esquema da táboa matches_finalizados.");
        setLoading(false);
        return;
      }
      if (!alive) return;
      setSchema(chosen);

      // 2) Cargar datos reales
      const sel = ["id", chosen.date, chosen.competition, chosen.home, chosen.away].join(",");
      const { data, error } = await supabase.from(TABLE).select(sel);
      if (error) {
        setErr(error.message || "Erro cargando datos.");
        setLoading(false);
        return;
      }
      if (!alive) return;

      const canon = (data || []).map((r) => ({
        id: r.id,
        home: r[chosen.home] || "",
        away: r[chosen.away] || "",
        date: r[chosen.date] || null,
        competition: r[chosen.competition] || "",
      }));

      // Orden: máis recente arriba
      canon.sort((a, b) => {
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return tb - ta;
      });

      setRows(canon);
      setLoading(false);
    }

    detectAndLoad();
    return () => { alive = false; };
  }, []);

  // Guardado de una fila (insert/update) usando el esquema detectado
  async function saveRow(idx, row) {
    if (!schema) return;

    // Requisitos mínimos: 4 campos cubertos
    const ok =
      row.home?.trim() && row.away?.trim() &&
      row.date && row.competition?.trim();

    if (!ok) return; // non garda aínda

    const payload = {
      [schema.home]: row.home.trim().toUpperCase(),
      [schema.away]: row.away.trim().toUpperCase(),
      [schema.date]: row.date,
      [schema.competition]: row.competition.trim(),
    };

    let error;
    if (row.id) {
      ({ error } = await supabase.from(TABLE).update(payload).eq("id", row.id));
    } else {
      const { data, error: e2 } = await supabase.from(TABLE).insert(payload).select("id").single();
      error = e2;
      if (!e2 && data?.id) row.id = data.id;
    }
    if (error) {
      setErr(error.message || "Erro gardando os datos.");
      return;
    }

    // Marca visual de gardado (borde celeste + fondo moi suave)
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...row, _saved: true };
      return next;
    });
  }

  function setLocal(idx, patch) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch, _saved: false };
      return next;
    });
  }

  function addBlank() {
    setRows((prev) => [
      {
        id: null,
        home: "",
        away: "",
        date: null,
        competition: "",
        _saved: false,
      },
      ...prev,
    ]);
  }

  const title = "PARTIDOS FINALIZADOS";
  const subtitle = "Listado dos encontros xa xogados polo Celta na tempada 2025/2026.";

  return (
    <main style={{ padding: "1rem" }}>
      <h2 style={{ margin: "0 0 6px" }}>{title}</h2>
      <p style={{ margin: "0 0 14px", color: "#475569" }}>{subtitle}</p>

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={addBlank}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(180deg,#22c55e,#16a34a)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 0 }}>＋</span>
          Engadir outro partido
        </button>
      </div>

      {err && (
        <p style={{ color: "#b91c1c", marginBottom: 12 }}>{err}</p>
      )}

      {loading && <p>Cargando…</p>}

      {!loading && rows.map((r, i) => (
        <article
          key={r.id ?? `tmp-${i}`}
          style={{
            border: r._saved ? "2px solid #0ea5e9" : "1px solid #e5e7eb",
            background: r._saved ? "rgba(14,165,233,0.06)" : "#f8fafc",
            borderRadius: 14,
            padding: 12,
            marginBottom: 12,
          }}
        >
          {/* Fila 1: EQUIPO1 vs EQUIPO2 */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}>
            <input
              placeholder="EQUIPO 1"
              value={r.home}
              onInput={(e) => setLocal(i, { home: e.currentTarget.value })}
              style={inp()}
            />
            <div style={{ textAlign: "center", color: "#6b7280", fontWeight: 600 }}>vs</div>
            <input
              placeholder="EQUIPO 2"
              value={r.away}
              onInput={(e) => setLocal(i, { away: e.currentTarget.value })}
              style={inp()}
            />
          </div>

          {/* Fila 2: DATA + COMPETICIÓN + (autoguardado) */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr auto",
            gap: 8,
            alignItems: "center",
          }}>
            <input
              type="date"
              value={r.date ? new Date(r.date).toISOString().slice(0,10) : ""}
              onInput={(e) => setLocal(i, { date: e.currentTarget.value || null })}
              style={inp()}
            />
            <select
              value={r.competition}
              onChange={(e) => setLocal(i, { competition: e.currentTarget.value })}
              style={inp()}
            >
              <option value="">— Competición —</option>
              <option>LaLiga</option>
              <option>Europa League</option>
              <option>Copa do Rei</option>
            </select>

            <button
              onClick={() => saveRow(i, rows[i])}
              style={{
                border: "1px solid #e2e8f0",
                background: "#fff",
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
              }}
              title="Gardar agora"
            >
              💾
            </button>
          </div>
        </article>
      ))}
    </main>
  );
}

function inp() {
  return {
    width: "100%",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 10,
    padding: "10px 12px",
    fontWeight: 600,
    textTransform: "uppercase",
  };
}
