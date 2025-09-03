// src/pages/VindeirosPartidos.jsx
import { h } from "preact";
import { useMemo, useState } from "preact/hooks";

/* Layout centrado e estilos de táboa */
const WRAP = { maxWidth: 980, margin: "0 auto", padding: "16px 12px 24px" };
const CARD = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: "16px 12px",
};
const H1  = { font: "700 22px/1.2 Montserrat,system-ui,sans-serif", margin: "0 0 4px", color: "#0f172a" };
const SUB = { font: "400 14px/1.25 Montserrat,system-ui,sans-serif", margin: "0 0 14px", color: "#64748b" };

/* Táboa */
const GRID = { display: "grid", gridTemplateColumns: "72px 140px 1fr 220px", alignItems: "center", gap: 0 };
const HEAD = { font: "700 13px/1.15 Montserrat,system-ui,sans-serif", color: "#334155", padding: "10px 12px" };
const ROW  = { ...GRID, minHeight: 48, borderTop: "1px solid #e5e7eb" }; // liña de fila (gris)
const CELL = { padding: "10px 12px", font: "400 14px/1.25 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const NUM  = { width: 40, textAlign: "right", color: "#64748b", marginRight: 8, fontWeight: 600 };
const COL_BORDER = "1px solid rgba(15,23,42,.22)"; // liña de columna (negro claro)

const BTN_ICON = {
  display: "inline-grid", placeItems: "center",
  width: 36, height: 36, border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,.06)", cursor: "pointer",
};

export default function VindeirosPartidos() {
  // 10 filas en branco, sen guións
  const [localRows, setLocalRows] = useState(
    Array.from({ length: 10 }, () => ({ date: "", match: "", comp: "" }))
  );
  const rows = useMemo(() => localRows, [localRows]);

  function onEdit(i, field, text) {
    const v = String(text || "").trim();
    setLocalRows((prev) => {
      const nxt = prev.slice();
      nxt[i] = { ...nxt[i], [field]: v };
      return nxt;
    });
  }

  // Helper para engadir liña de columna (dereita) excepto na última
  const headCell = (children, isLast = false, extra = {}) => (
    <div style={{ ...HEAD, borderRight: isLast ? "none" : COL_BORDER, ...extra }}>{children}</div>
  );
  const bodyCell = (children, isLast = false, extra = {}) => (
    <div style={{ ...CELL, borderRight: isLast ? "none" : COL_BORDER, ...extra }}>{children}</div>
  );

  return (
    <main style={WRAP}>
      <section style={CARD}>
        <h2 style={H1}>Vindeiros partidos</h2>
        <p style={SUB}>Axenda dos próximos encontros con data e hora confirmadas.</p>

        {/* Cabeceira */}
        <div
          style={{
            ...GRID,
            borderTop: "1px solid #e5e7eb",
            borderBottom: "1px solid #e5e7eb",
            background: "#f8fafc",
          }}
        >
          {headCell(
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={NUM}>#</span>
              <span style={{ display: "inline-grid", placeItems: "center", width: 22, height: 22 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" stroke="#0f172a" strokeWidth="1.6" />
                </svg>
              </span>
              <span>Ver</span>
            </div>
          )}
          {headCell(
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4.5" width="18" height="16" rx="2" stroke="#0f172a" strokeWidth="1.6" />
                <path d="M7 2.5v4M17 2.5v4M3 9h18" stroke="#0f172a" strokeWidth="1.6" />
              </svg>
              <span>Data</span>
            </div>
          )}
          {headCell(
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#0f172a" strokeWidth="1.6" />
                <polygon points="12,7 15,9 14,13 10,13 9,9" stroke="#0f172a" strokeWidth="1.2" fill="none" />
              </svg>
              <span>Partido</span>
            </div>
          )}
          {headCell(
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke="#0f172a" strokeWidth="1.6" />
                <path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" stroke="#0f172a" strokeWidth="1.6" />
                <path d="M9 14h6v3H9z" stroke="#0f172a" strokeWidth="1.6" />
              </svg>
              <span>Competición</span>
            </div>,
            true
          )}
        </div>

        {/* Filas */}
        {rows.map((r, i) => (
          <div key={i} style={ROW}>
            {/* Ver */}
            {bodyCell(
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={NUM}>{String(i + 1).padStart(2, "0")}</span>
                <button type="button" style={BTN_ICON} title="Ver">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="#0f172a" strokeWidth="1.6" />
                  </svg>
                </button>
              </div>
            )}
            {/* Data (sen guións) */}
            {bodyCell(
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onEdit(i, "date", e.currentTarget.innerText)}
              >
                {r.date}
              </div>
            )}
            {/* Partido */}
            {bodyCell(
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onEdit(i, "match", e.currentTarget.innerText)}
              >
                {r.match}
              </div>
            )}
            {/* Competición */}
            {bodyCell(
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onEdit(i, "comp", e.currentTarget.innerText)}
              >
                {r.comp}
              </div>,
              true
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
