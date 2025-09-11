import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };
const PAGE_HEAD = { margin: "0 0 6px", font: "700 22px/1.2 Montserrat,sans-serif", color: "#0f172a" };
const PAGE_SUB = { margin: "0 0 16px", font: "400 13px/1.4 Montserrat,sans-serif", color: "#475569" };

const CARD = {
  border: "2px solid #ef4444", // rojo
  borderRadius: 12,
  background: "#fff",
  padding: 10,
  boxShadow: "0 4px 12px rgba(0,0,0,.05)",
  marginBottom: 10,
};

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

export default function PartidosFinalizados() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const email = s?.session?.user?.email || "";
      setIsAdmin(email === "hdcliga@gmail.com" || email === "hdcliga2@gmail.com");
      const { data } = await supabase.from("matches_finalizados").select("*").order("match_iso", { descending: true });
      setRows(data || []);
    })();
  }, []);

  return (
    <main style={WRAP}>
      <h2 style={PAGE_HEAD}>Partidos finalizados</h2>
      <p style={PAGE_SUB}>Listado de partidos xa xogados polo Celta</p>

      {rows.map((r) => {
        const date = r.match_iso ? new Date(r.match_iso) : null;
        const dstr = date ? date.toLocaleDateString("gl-ES", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
        const tstr = date ? date.toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" }) : "—";
        return (
          <div key={r.id} style={CARD}>
            <div><b>{r.equipo1}</b> vs <b>{r.equipo2}</b></div>
            <div>Competición: {r.competition}</div>
            <div>Lugar: {r.lugar}</div>
            <div>Data: {dstr}</div>
            <div>Hora: {tstr}</div>
            <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
              <button style={ICONBTN} onClick={() => route("/resultados-ultima-alineacion")}>👁️</button>
              {isAdmin && <button style={ICONBTN}>✏️</button>}
            </div>
          </div>
        );
      })}
    </main>
  );
}
