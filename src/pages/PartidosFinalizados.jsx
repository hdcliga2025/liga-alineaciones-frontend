// src/pages/PartidosFinalizados.jsx
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* Layout centrado e estilos */
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

const GRID = { display: "grid", gridTemplateColumns: "72px 140px 1fr 220px", alignItems: "center", gap: 8 };
const HEAD = { font: "700 13px/1.15 Montserrat,system-ui,sans-serif", color: "#334155", padding: "10px 12px" };
const ROW  = { ...GRID, minHeight: 48, borderTop: "1px solid #e5e7eb" };
const CELL = { padding: "10px 12px", font: "400 14px/1.25 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const NUM  = { width: 40, textAlign: "right", color: "#64748b", marginRight: 8, fontWeight: 600 };
const BTN_ICON = {
  display: "inline-grid", placeItems: "center",
  width: 36, height: 36, border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,.06)", cursor: "pointer",
};
const MUTED = { color: "#94a3b8" };

/* Utils */
const toDMY = (d, tz="Europe/Madrid") => {
  try {
    const dt = (d instanceof Date) ? d : new Date(d);
    const y = new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, year:"numeric"}).format(dt);
    const m = new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, month:"2-digit"}).format(dt);
    const da= new Intl.DateTimeFormat("sv-SE",{ timeZone: tz, day:"2-digit"}).format(dt);
    return `${da}/${m}/${y}`;
  } catch { return ""; }
};
const parseDMY = (s) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s||"").trim());
  if (!m) return null;
  const [_, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm}-${dd}T00:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : iso;
};

export default function PartidosFinalizados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const insertedRef = useRef(false);

  // Admin?
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const email = s?.session?.user?.email || "";
      const uid   = s?.session?.user?.id || null;
      let admin = false;
      if (email) {
        const e = email.toLowerCase();
        if (e === "hdcliga@gmail.com" || e === "hdcliga2@gmail.com") admin = true;
      }
      if (!admin && uid) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", uid)
          .maybeSingle();
        if ((prof?.role || "").toLowerCase() === "admin") admin = true;
      }
      setIsAdmin(admin);
    })();
  }, []);

  async function loadList() {
    const { data } = await supabase
      .from("matches_finalizados")
      .select("id, match_iso, match_date, partido, competition, created_at")
      .order("match_date", { ascending: false })
      .limit(60);
    setRows(data || []);
  }
  useEffect(() => { loadList(); }, []);

  // Auto-archivado: cando o peche (2h antes) chegou a 0, inserta unha fila
  useEffect(() => {
    let t = null;

    async function checkAndArchive() {
      if (!isAdmin || insertedRef.current || busy) return;
      setBusy(true);
      try {
        const { data: nm } = await supabase
          .from("next_match")
          .select("equipo1,equipo2,competition,match_iso,tz")
          .eq("id", 1)
          .maybeSingle();
        if (!nm?.match_iso) return;

        const matchDt = new Date(nm.match_iso);
        const closeAt = new Date(matchDt.getTime() - 2 * 3600 * 1000);

        if (Date.now() >= closeAt.getTime()) {
          const partido = `${(nm.equipo1 || "").toUpperCase()} vs ${(nm.equipo2 || "").toUpperCase()}`.trim();
          const payload = {
            match_iso: nm.match_iso,                // único
            match_date: matchDt.toISOString(),      // o DATE real pode xerarse no server
            partido,
            competition: nm.competition || null,
          };
          await supabase.from("matches_finalizados").upsert(payload, { onConflict: "match_iso" });
          insertedRef.current = true;
          await loadList();
        }
      } finally {
        setBusy(false);
      }
    }

    checkAndArchive();
    t = setInterval(checkAndArchive, 1000);
    return () => clearInterval(t);
  }, [isAdmin, busy]);

  const viewRows = useMemo(() => {
    const out = [...(rows || [])];
    for (let i = out.length; i < 60; i++) out.push({ id: null, match_date: null, partido: "", competition: "" });
    return out;
  }, [rows]);

  async function handleCellEdit(idx, field, value) {
    const r = viewRows[idx];
    if (!r?.id || !isAdmin) return;
    const patch = { updated_at: new Date().toISOString() };
    if (field === "match_date") {
      const iso = parseDMY(value);
      if (!iso) return;
      patch.match_date = iso;
    } else if (field === "partido") patch.partido = value || null;
    else if (field === "competition") patch.competition = value || null;

    await supabase.from("matches_finalizados").update(patch).eq("id", r.id);
    await loadList();
  }

  return (
    <main style={WRAP}>
      <section style={CARD}>
        <h2 style={H1}>Partidos finalizados</h2>
        <p style={SUB}>Histórico recente dos encontros do RC Celta.</p>

        {/* Cabeceira */}
        <div
          style={{
            ...GRID,
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: 6,
            marginBottom: 2,
            background: "#f8fafc",
            borderRadius: 12,
          }}
        >
          <div style={{ ...HEAD, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={NUM}>#</span>
            <span style={{ display: "inline-grid", placeItems: "center", width: 22, height: 22 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="#0f172a" strokeWidth="1.6" />
              </svg>
            </span>
            <span>Ver</span>
          </div>
          <div style={{ ...HEAD, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4.5" width="18" height="16" rx="2" stroke="#0f172a" strokeWidth="1.6" /><path d="M7 2.5v4M17 2.5v4M3 9h18" stroke="#0f172a" strokeWidth="1.6" /></svg>
            <span>Data</span>
          </div>
          <div style={{ ...HEAD, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#0f172a" strokeWidth="1.6" /><polygon points="12,7 15,9 14,13 10,13 9,9" stroke="#0f172a" strokeWidth="1.2" fill="none" /></svg>
            <span>Partido</span>
          </div>
          <div style={{ ...HEAD, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 4h10v3a5 5 0 01-10 0V4Z" stroke="#0f172a" strokeWidth="1.6" /><path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" stroke="#0f172a" strokeWidth="1.6" /><path d="M9 14h6v3H9z" stroke="#0f172a" strokeWidth="1.6" /></svg>
            <span>Competición</span>
          </div>
        </div>

        {/* Filas */}
        {viewRows.map((r, i) => {
          const zebra = i % 2 === 1 ? { background: "#fbfdff" } : null;
          const dmy = r?.match_date ? toDMY(r.match_date) : "";
          const isPlaceholder = !r?.id;

          return (
            <div key={r?.id || `p-${i}`} style={{ ...ROW, ...zebra }}>
              {/* Ver */}
              <div style={{ ...CELL, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={NUM}>{String(i + 1).padStart(2, "0")}</span>
                <button type="button" style={BTN_ICON} title="Ver" onClick={() => route("/proximo-partido")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" stroke="#0f172a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="#0f172a" strokeWidth="1.6" />
                  </svg>
                </button>
              </div>

              {/* Data */}
              <div
                style={{ ...CELL, ...(isPlaceholder ? MUTED : {}) }}
                contentEditable={!!r?.id && isAdmin}
                suppressContentEditableWarning
                onBlur={(e) => handleCellEdit(i, "match_date", e.currentTarget.innerText)}
              >
                {dmy || (isPlaceholder ? "—" : "")}
              </div>

              {/* Partido */}
              <div
                style={{ ...CELL, ...(isPlaceholder ? MUTED : {}) }}
                contentEditable={!!r?.id && isAdmin}
                suppressContentEditableWarning
                onBlur={(e) => handleCellEdit(i, "partido", e.currentTarget.innerText)}
              >
                {r?.partido || (isPlaceholder ? "—" : "")}
              </div>

              {/* Competición */}
              <div
                style={{ ...CELL, ...(isPlaceholder ? MUTED : {}) }}
                contentEditable={!!r?.id && isAdmin}
                suppressContentEditableWarning
                onBlur={(e) => handleCellEdit(i, "competition", e.currentTarget.innerText)}
              >
                {r?.competition || (isPlaceholder ? "—" : "")}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
