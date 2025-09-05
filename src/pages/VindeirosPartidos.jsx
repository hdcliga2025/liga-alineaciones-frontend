import { h } from "preact";
import { useMemo, useState } from "preact/hooks";

const WRAP = { maxWidth: 960, margin: "0 auto", padding: "16px 12px 24px" };
const GRID = { display: "grid", gap: 10 };
const CARD = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: "14px 12px",
};

const H1 = { font: "700 20px/1.2 Montserrat,system-ui,sans-serif", margin: "0 0 8px", color: "#0f172a" };
const SUB = { margin: "0 0 14px", color: "#475569", font: "400 14px/1.25 Montserrat,system-ui,sans-serif" };

const ROW = {
  display: "grid",
  gridTemplateColumns: "56px 160px 1fr 220px 56px",
  alignItems: "center",
  gap: 10,
  borderTop: "1px solid #e5e7eb",
  minHeight: 52,
  padding: "6px 0",
};
const CELL = { font: "700 14px/1.25 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const NUM = { textAlign: "right", color: "#64748b", fontWeight: 700 };

const INPUT = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #dbe2f0",
  outline: "none",
  font: "700 14px/1.2 Montserrat,system-ui,sans-serif",
  color: "#0f172a",
  background: "#fff",
};
const SELECT = { ...INPUT, fontWeight: 700, cursor: "pointer" };

const CAP = {
  display: "grid",
  gridTemplateColumns: "56px 160px 1fr 220px 56px",
  gap: 10,
  alignItems: "center",
  background: "#0ea5e9",
  color: "#fff",
  padding: "10px 0",
  borderRadius: 12,
  border: "1px solid #0ea5e9",
  marginBottom: 6,
};
const CAPC = { font: "700 13px/1 Montserrat,system-ui,sans-serif", textAlign: "left", padding: "0 8px" };
const CAPNUM = { ...CAPC, textAlign: "right" };

export default function VindeirosPartidos() {
  const [rows, setRows] = useState(
    Array.from({ length: 10 }, () => ({
      date: "",
      home: "",
      away: "",
      comp: "",
    }))
  );

  const view = useMemo(() => rows, [rows]);

  const setField = (idx, key, val) => {
    setRows((prev) => {
      const next = prev.slice();
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  };

  return (
    <main style={WRAP}>
      <section style={CARD}>
        <h2 style={H1}>Vindeiros partidos</h2>
        <p style={SUB}>Axenda dos próximos encontros con data e hora confirmadas.</p>

        {/* cabecera */}
        <div style={CAP}>
          <div style={CAPNUM}>#</div>
          <div style={CAPC}>DATA</div>
          <div style={CAPC}>PARTIDO</div>
          <div style={CAPC}>COMPETICIÓN</div>
          <div style={{ ...CAPC, textAlign: "center" }}>REVISAR</div>
        </div>

        {/* filas */}
        <div style={GRID}>
          {view.map((r, i) => (
            <div key={i} style={ROW}>
              <div style={{ ...CELL, ...NUM }}>{String(i + 1).padStart(2, "0")}</div>

              <div>
                <input
                  style={INPUT}
                  placeholder="dd/mm/aaaa hh:mm"
                  value={r.date}
                  onInput={(e) => setField(i, "date", e.currentTarget.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8 }}>
                <input
                  style={INPUT}
                  placeholder="EQUIPO 1"
                  value={r.home}
                  onInput={(e) => setField(i, "home", e.currentTarget.value.toUpperCase())}
                />
                <div style={{ alignSelf: "center", fontWeight: 800, color: "#334155" }}>vs</div>
                <input
                  style={INPUT}
                  placeholder="EQUIPO 2"
                  value={r.away}
                  onInput={(e) => setField(i, "away", e.currentTarget.value.toUpperCase())}
                />
              </div>

              <div>
                <select
                  style={SELECT}
                  value={r.comp}
                  onChange={(e) => setField(i, "comp", e.currentTarget.value)}
                >
                  <option value="">(selecciona)</option>
                  <option value="LaLiga">LaLiga</option>
                  <option value="Europa League">Europa League</option>
                  <option value="Copa do Rei">Copa do Rei</option>
                </select>
              </div>

              <div style={{ display: "grid", placeItems: "center" }}>
                <button
                  type="button"
                  title="Revisar"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                    cursor: "pointer",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="#0f172a" stroke-width="1.6"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}


