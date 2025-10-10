// src/pages/ResultadosHistoricos.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Estilos mínimos, coherentes con páginas existentes ===== */
const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };
const PAGE_HEAD = { margin: "0 0 6px", font: "700 22px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a" };
const PAGE_SUB = { margin: "0 0 12px", font: "400 16px/1.3 Montserrat,system-ui,sans-serif", color: "#475569" };

const LIST = { listStyle: "none", margin: 0, padding: 0 };
const ITEM = {
  display: "grid",
  gridTemplateColumns: "140px 1fr auto",
  gap: 12,
  alignItems: "center",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,.05)",
  marginBottom: 8,
};
const DATE = { font: "600 14px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a", whiteSpace: "nowrap" };
const TEAMS = {
  font: "600 15px/1.2 Montserrat,system-ui,sans-serif",
  textTransform: "uppercase",
  color: "#111827",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const ACTIONS = { display:"flex", gap:8, alignItems:"center", justifySelf:"end" };
const ICONBTN = { width:34, height:34, display:"grid", placeItems:"center", borderRadius:10, border:"1px solid #e2e8f0", background:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,.06)", cursor:"pointer" };
const SVGI = { fill:"none", stroke:"#0f172a", strokeWidth:1.9, strokeLinecap:"round", strokeLinejoin:"round" };

const EMPTY = {
  marginTop: 8,
  padding: "10px 12px",
  borderRadius: 10,
  background: "#ecfeff",
  border: "1px solid #67e8f9",
  color: "#0e7490",
  font: "600 13px/1.2 Montserrat,system-ui,sans-serif",
};
const ERR = { ...EMPTY, background: "#fee2e2", border: "1px solid #fecaca", color: "#b91c1c" };

/* ===== Utils ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const sortDescByDate = (a, b) =>
  (b.match_iso ? new Date(b.match_iso).getTime() : -Infinity) -
  (a.match_iso ? new Date(a.match_iso).getTime() : -Infinity);

function dmy(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

export default function ResultadosHistoricos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function resolveAdmin() {
    const { data: s } = await supabase.auth.getSession();
    const email = s?.session?.user?.email?.toLowerCase() || "";
    const uid   = s?.session?.user?.id || null;
    let admin = (email === "hdcliga@gmail.com" || email === "hdcliga2@gmail.com");
    if (!admin && uid) {
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
      if ((prof?.role||"").toLowerCase() === "admin") admin = true;
    }
    setIsAdmin(admin);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr("");
      setLoading(true);
      try {
        await resolveAdmin();
        const { data, error } = await supabase
          .from("matches_finalizados")
          .select("id,equipo1,equipo2,match_iso");
        if (error) throw error;

        const norm = (data || []).map((r) => ({
          id: r.id ?? null,
          equipo1: (r.equipo1 || "").toUpperCase(),
          equipo2: (r.equipo2 || "").toUpperCase(),
          match_iso: r.match_iso || null,
        }));

        if (alive) setRows(norm.sort(sortDescByDate));
      } catch (e) {
        console.error("Historico load:", e);
        if (alive) setErr("Produciuse un erro ao cargar o histórico.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const view = useMemo(() => rows, [rows]);

  return (
    <main style={WRAP}>
      <h2 style={PAGE_HEAD}>HISTÓRICO DE RESULTADOS</h2>
      <p style={PAGE_SUB}>Índice dos partidos rematados (máis recente → máis antigo).</p>

      {err && <div style={ERR} role="status" aria-live="polite">{err}</div>}
      {!err && loading && <div style={EMPTY} role="status" aria-live="polite">Cargando…</div>}
      {!err && !loading && view.length === 0 && (
        <div style={EMPTY} role="status" aria-live="polite">Non hai partidos rematados aínda.</div>
      )}

      {!err && !loading && view.length > 0 && (
        <ul style={LIST} aria-label="Lista de partidos rematados">
          {view.map((r, i) => (
            <li key={`${r.id ?? r.match_iso ?? "noid"}-${i}`} style={ITEM}>
              <span style={DATE}>{dmy(r.match_iso)}</span>
              <span style={TEAMS}>
                {r.equipo1 || "—"} <span style={{ margin: "0 6px", fontWeight: 500 }}>vs</span> {r.equipo2 || "—"}
              </span>
              <div style={ACTIONS}>
                {isAdmin && (
                  <button
                    type="button"
                    style={ICONBTN}
                    title="Editar partido"
                    aria-label="Editar partido"
                    onClick={()=>{ /* pendente: fluxo de edición */ }}
                  >
                    {/* lapis */}
                    <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}>
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  style={ICONBTN}
                  title="Ver detalle"
                  aria-label="Ver detalle"
                  onClick={()=> route("/resultados-ultima-alineacion")}
                >
                  {/* ollo */}
                  <svg width="20" height="20" viewBox="0 0 24 24" style={SVGI}>
                    <path d="M2 12s4.6-7 10-7 10 7 10 7-4.6 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
