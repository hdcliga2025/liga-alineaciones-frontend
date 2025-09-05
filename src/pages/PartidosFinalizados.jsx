import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const WRAP = { maxWidth: 960, margin: "0 auto", padding: "16px 12px 24px" };
const CARD = { border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,.06)", padding: "14px 12px" };
const H1 = { font: "700 20px/1.2 Montserrat,system-ui,sans-serif", margin: "0 0 8px", color: "#0f172a" };
const SUB = { margin: "0 0 14px", color: "#475569", font: "400 14px/1.25 Montserrat,system-ui,sans-serif" };

const CAP = { display: "grid", gridTemplateColumns: "56px 160px 1fr 220px 56px", gap: 10, alignItems: "center", background: "#0ea5e9", color: "#fff", padding: "10px 0", borderRadius: 12, border: "1px solid #0ea5e9", marginBottom: 6 };
const CAPC = { font: "700 13px/1 Montserrat,system-ui,sans-serif", textAlign: "left", padding: "0 8px" };
const CAPNUM = { ...CAPC, textAlign: "right" };

const ROW = { display: "grid", gridTemplateColumns: "56px 160px 1fr 220px 56px", alignItems: "center", gap: 10, borderTop: "1px solid #e5e7eb", minHeight: 52, padding: "6px 0" };
const CELL = { font: "700 14px/1.25 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const NUM = { textAlign: "right", color: "#64748b", fontWeight: 700 };
const INPUT = { width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #dbe2f0", outline: "none", font: "700 14px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a", background: "#fff" };
const SELECT = { ...INPUT, fontWeight: 700, cursor: "pointer" };

export default function PartidosFinalizados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const email = s?.session?.user?.email?.toLowerCase() || "";
      const uid = s?.session?.user?.id || null;
      let admin = email === "hdcliga@gmail.com" || email === "hdcliga2@gmail.com";
      if (!admin && uid) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
        if ((prof?.role || "").toLowerCase() === "admin") admin = true;
      }
      setIsAdmin(admin);
    })();
  }, []);

  async function loadList() {
    const { data, error } = await supabase
      .from("matches_finalizados")
      .select("id, match_date, partido, competition")
      .order("match_date", { ascending: false })
      .limit(60);
    if (!error) setRows(data || []);
  }
  useEffect(() => { loadList(); }, []);

  const view = useMemo(() => {
    const out = [...rows];
    for (let i = out.length; i < 60; i++) out.push({ id: null, match_date: "", partido: "", competition: "" });
    return out;
  }, [rows]);

  async function saveRow(idx) {
    const r = view[idx];
    if (!isAdmin) return;
    // inserta o actualiza por id+fecha
    if (r.id) {
      await supabase.from("matches_finalizados").update({
        match_date: r.match_date || null,
        partido: r.partido || null,
        competition: r.competition || null,
      }).eq("id", r.id);
    } else {
      await supabase.from("matches_finalizados").insert({
        match_date: r.match_date || null,
        partido: r.partido || null,
        competition: r.competition || null,
      });
    }
    await loadList();
  }

  const setField = (idx, key, val) => {
    setRows((prev) => {
      const out = prev.slice();
      // cuando idx excede el tamaño (placeholder), creamos una fila temporal editable
      while (out.length <= idx) out.push({ id: null, match_date: "", partido: "", competition: "" });
      out[idx] = { ...out[idx], [key]: val };
      return out;
    });
  };

  return (
    <main style={WRAP}>
      <section style={CARD}>
        <h2 style={H1}>Partidos finalizados</h2>
        <p style={SUB}>Histórico dos encontros do Celta na tempada 2025/2026.</p>

        <div style={CAP}>
          <div style={CAPNUM}>#</div>
          <div style={CAPC}>DATA</div>
          <div style={CAPC}>PARTIDO</div>
          <div style={CAPC}>COMPETICIÓN</div>
          <div style={{ ...CAPC, textAlign: "center" }}>REVISAR</div>
        </div>

        {view.map((r, i) => (
          <div key={r.id || `p-${i}`} style={ROW}>
            <div style={{ ...CELL, ...NUM }}>{String(i + 1).padStart(2, "0")}</div>

            <div>
              <input
                style={INPUT}
                placeholder="dd/mm/aaaa hh:mm"
                value={r.match_date || ""}
                onInput={(e) => setField(i, "match_date", e.currentTarget.value)}
                disabled={!isAdmin}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8 }}>
              <input
                style={INPUT}
                placeholder="EQUIPO 1"
                value={(r.partido || "").split(" vs ")[0] || ""}
                onInput={(e) => {
                  const right = (r.partido || "").split(" vs ")[1] || "";
                  setField(i, "partido", `${e.currentTarget.value.toUpperCase()} vs ${right}`.trim());
                }}
                disabled={!isAdmin}
              />
              <div style={{ alignSelf: "center", fontWeight: 800, color: "#334155" }}>vs</div>
              <input
                style={INPUT}
                placeholder="EQUIPO 2"
                value={(r.partido || "").split(" vs ")[1] || ""}
                onInput={(e) => {
                  const left = (r.partido || "").split(" vs ")[0] || "";
                  setField(i, "partido", `${left} vs ${e.currentTarget.value.toUpperCase()}`.trim());
                }}
                disabled={!isAdmin}
              />
            </div>

            <div>
              <select
                style={SELECT}
                value={r.competition || ""}
                onChange={(e) => setField(i, "competition", e.currentTarget.value)}
                disabled={!isAdmin}
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
                title="Revisar / Gardar"
                onClick={() => isAdmin && saveRow(i)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                  cursor: isAdmin ? "pointer" : "not-allowed",
                  opacity: isAdmin ? 1 : .6,
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
      </section>
    </main>
  );
}
