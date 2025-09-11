import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };
const PAGE_HEAD = { margin: "0 0 10px", font: "700 22px/1.2 Montserrat,sans-serif", color: "#0f172a" };
const PAGE_SUB = { margin: "0 0 16px", font: "400 14px/1.4 Montserrat,sans-serif", color: "#475569" };

const CARD = {
  border: "2px solid #22c55e", // verde
  borderRadius: 12,
  background: "#f8fafc",
  padding: 10,
  boxShadow: "0 4px 12px rgba(0,0,0,.05)",
  marginBottom: 10,
};
const ROW = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const VS = { font: "700 14px Montserrat,sans-serif", color: "#0f172a" };

const INPUT = {
  flex: 1,
  borderRadius: 8,
  border: "1px solid #dbe2f0",
  padding: "6px 8px",
  font: "600 13px Montserrat,sans-serif",
  marginRight: 6,
};
const SELECT = { ...INPUT, flex: 0.7 };
const DATEBOX = { ...INPUT, flex: 0.7 };
const TIMEBOX = { ...INPUT, flex: 0.5 };

const ICONBTN = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ equipo1: "", equipo2: "", lugar: "", competition: "", dateStr: "", timeStr: "" });

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const email = s?.session?.user?.email || "";
      setIsAdmin(email === "hdcliga@gmail.com" || email === "hdcliga2@gmail.com");
      await loadList();
    })();
  }, []);

  async function loadList() {
    const { data } = await supabase.from("matches_vindeiros").select("*").order("match_iso", { ascending: true });
    setRows(data || []);
  }

  function handleChange(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function onSave() {
    const { equipo1, equipo2, lugar, competition, dateStr, timeStr } = form;
    if (!equipo1 || !equipo2 || !lugar || !competition || !dateStr || !timeStr) {
      alert("⚠️ Cumpre cubrir todos os campos");
      return;
    }
    const iso = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    await supabase.from("matches_vindeiros").insert([{ equipo1, equipo2, lugar, competition, match_iso: iso }]);
    setForm({ equipo1: "", equipo2: "", lugar: "", competition: "", dateStr: "", timeStr: "" });
    await loadList();
  }

  async function onPromote(row) {
    if (!confirm("Subir este partido a Próximo Partido?")) return;
    await supabase.from("next_match").upsert({
      id: 1,
      equipo1: row.equipo1,
      equipo2: row.equipo2,
      lugar: row.lugar,
      competition: row.competition,
      match_iso: row.match_iso,
    });
    await supabase.from("matches_vindeiros").delete().eq("id", row.id);
    await loadList();
  }

  return (
    <main style={WRAP}>
      <h2 style={PAGE_HEAD}>Vindeiros partidos</h2>
      <p style={PAGE_SUB}>Partidos programados polo Celta</p>

      {/* Formulario arriba */}
      {isAdmin && (
        <div style={{ ...CARD, marginBottom: 20 }}>
          <div style={ROW}>
            <input style={INPUT} placeholder="EQUIPO 1" value={form.equipo1} onInput={(e) => handleChange("equipo1", e.currentTarget.value)} />
            <span style={VS}>vs</span>
            <input style={INPUT} placeholder="EQUIPO 2" value={form.equipo2} onInput={(e) => handleChange("equipo2", e.currentTarget.value)} />
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
            <input style={INPUT} placeholder="Lugar" value={form.lugar} onInput={(e) => handleChange("lugar", e.currentTarget.value)} />
            <select style={SELECT} value={form.competition} onChange={(e) => handleChange("competition", e.currentTarget.value)}>
              <option value="">Competición</option>
              <option value="LaLiga">LaLiga</option>
              <option value="Europa League">Europa League</option>
              <option value="Copa do Rei">Copa do Rei</option>
            </select>
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
            <input type="date" style={DATEBOX} value={form.dateStr} onInput={(e) => handleChange("dateStr", e.currentTarget.value)} />
            <input type="time" style={TIMEBOX} value={form.timeStr} onInput={(e) => handleChange("timeStr", e.currentTarget.value)} />
          </div>
          <button onClick={onSave} style={{ marginTop: 10, padding: "6px 12px", background: "#22c55e", color: "#fff", borderRadius: 6, border: "none" }}>
            Gardar partido
          </button>
        </div>
      )}

      {/* Listado partidos */}
      {rows.map((r) => {
        const date = r.match_iso ? new Date(r.match_iso) : null;
        const dstr = date ? date.toLocaleDateString("gl-ES", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
        const tstr = date ? date.toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" }) : "—";
        return (
          <div key={r.id} style={CARD}>
            <div style={ROW}>
              <div><b>{r.equipo1}</b> vs <b>{r.equipo2}</b></div>
              {isAdmin && (
                <button style={ICONBTN} onClick={() => onPromote(r)}>
                  ⬆️
                </button>
              )}
            </div>
            <div>Competición: {r.competition}</div>
            <div>Lugar: {r.lugar}</div>
            <div>Data: {dstr}</div>
            <div>Hora: {tstr}</div>
          </div>
        );
      })}
    </main>
  );
}

