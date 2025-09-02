// src/pages/HazTu11.jsx
import { h } from "preact";
import { useMemo, useState } from "preact/hooks";
import { buildPlayers } from "../data/players.js";

const POS_TABS = [
  { key: "ALL",  label: "Todos" },
  { key: "POR",  label: "Porteiros" },
  { key: "DEF",  label: "Defensas" },
  { key: "CEN",  label: "Medios" },
  { key: "DEL",  label: "Dianteiros" },
];

// Silueta fallback (SVG outline, en liña co estilo da app)
function Silhouette({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="16" r="8" stroke="#94a3b8" stroke-width="2" />
      <path d="M8 42a16 16 0 0 1 32 0" stroke="#94a3b8" stroke-width="2" />
    </svg>
  );
}

export default function HazTu11() {
  const BASE = import.meta.env.VITE_FOTOS_BASE_URL || "";
  const allPlayers = useMemo(() => buildPlayers(BASE), [BASE]);

  const [tab, setTab]           = useState("ALL");
  const [q, setQ]               = useState("");
  const [imgError, setImgError] = useState({}); // { url: true }

  const filtered = useMemo(() => {
    const byPos = tab === "ALL" ? allPlayers : allPlayers.filter(p => p.pos === tab);
    const query = (q || "").trim().toLowerCase();
    if (!query) return byPos;
    return byPos.filter(p =>
      `${p.dorsal} ${p.name}`.toLowerCase().includes(query)
    );
  }, [tab, q, allPlayers]);

  // --- estilos inline (ligeros y acordes al resto) ---
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "16px" };
  const h1 = {
    fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    fontSize: 24, margin: "6px 0 2px", color: "#0f172a"
  };
  const sub = { margin: "0 0 12px", color: "#475569", fontSize: 14 };
  const tabs = { display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0 14px" };
  const tabBtn = (active) => ({
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: active ? "linear-gradient(180deg,#bae6fd,#7dd3fc)" : "#fff",
    color: active ? "#0c4a6e" : "#0f172a",
    fontWeight: 700, cursor: "pointer", boxShadow: active ? "0 8px 22px rgba(2,132,199,.25)" : "0 4px 12px rgba(0,0,0,.06)"
  });
  const searchRow = { display: "flex", gap: 10, alignItems: "center", marginBottom: 12 };
  const search = {
    flex: 1, padding: "10px 12px", borderRadius: 14,
    border: "1px solid #e5e7eb", outline: "none",
    fontSize: 14
  };
  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12
  };
  const card = {
    display: "grid", gridTemplateColumns: "72px 1fr", gap: 10, alignItems: "center",
    background: "#fff", border: "1px solid #eef2ff", borderRadius: 16,
    padding: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)"
  };
  const avatarBox = {
    width: 72, height: 72, borderRadius: 14,
    display: "grid", placeItems: "center",
    background: "linear-gradient(180deg,#f8fafc,#eef2ff)",
    border: "1px solid #e5e7eb", overflow: "hidden"
  };
  const name = { margin: 0, font: "700 15px/1.2 Montserrat, system-ui, sans-serif", color: "#0f172a" };
  const meta = { margin: "4px 0 0", color: "#475569", fontSize: 13 };

  // Responsivo
  if (typeof window !== "undefined" && window.innerWidth >= 560) {
    grid.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  }
  if (typeof window !== "undefined" && window.innerWidth >= 960) {
    grid.gridTemplateColumns = "repeat(4, minmax(0, 1fr))";
  }

  return (
    <main style={wrap}>
      <h1 style={h1}>Fai o teu 11</h1>
      <p style={sub}>Explora o plantel por posición, busca por nome ou dorsal. (Base para o selector de aliñación)</p>

      {/* Tabs posición */}
      <div style={tabs} role="tablist" aria-label="Filtrar por posición">
        {POS_TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            style={tabBtn(tab === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div style={searchRow}>
        <input
          type="search"
          placeholder="Buscar por nome ou dorsal…"
          value={q}
          onInput={(e) => setQ(e.currentTarget.value)}
          style={search}
          aria-label="Buscar xogadores"
        />
      </div>

      {/* Grid xogadores */}
      <section style={grid} aria-live="polite">
        {filtered.map((p) => (
          <article key={`${p.dorsal}-${p.name}`} style={card}>
            <div style={avatarBox}>
              {imgError[p.url] ? (
                <Silhouette />
              ) : (
                <img
                  src={p.url}
                  alt={`Foto de ${p.name}`}
                  width={72}
                  height={72}
                  decoding="async"
                  loading="lazy"
                  onError={() => setImgError((m) => ({ ...m, [p.url]: true }))}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            <div>
              <p style={name}>
                {p.dorsal != null ? `${String(p.dorsal).padStart(2,"0")} · ` : ""}{p.name}
              </p>
              <p style={meta}>{p.posLabel}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
