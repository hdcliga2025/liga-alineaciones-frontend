// src/pages/ResultadosUltimaAlineacion.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Utils ===== */
const POS_RANK = { POR: 0, DEF: 1, CEN: 2, DEL: 3 };
const cap = (s = "") => (s || "").toUpperCase();
const isUUID = (v = "") =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

function safeDecode(s = "") {
  try { return decodeURIComponent(s); } catch { return s.replace(/%20/g, " "); }
}
function parseFromFilename(url = "") {
  const last = (url.split("?")[0].split("#")[0].split("/").pop() || "").trim();
  const m = last.match(/^(\d+)-(.+)-(POR|DEF|CEN|DEL)\.(jpg|jpeg|png|webp)$/i);
  if (!m) return { dorsalFile: null, nameFile: null, posFile: null };
  return {
    dorsalFile: parseInt(m[1], 10),
    nameFile: safeDecode(m[2].replace(/_/g, " ")),
    posFile: m[3].toUpperCase(),
  };
}
function enrichPlayer(p = {}) {
  const { dorsalFile, nameFile, posFile } = parseFromFilename(p.foto_url || "");
  return {
    id: p.id,
    nombre: (nameFile || p.nombre || "").trim(),
    dorsal: dorsalFile ?? p.dorsal ?? null,
    pos: (posFile || p.pos || "").toUpperCase(),
  };
}
const fmtDateTime = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const f = d.toLocaleDateString("gl-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    const t = d.toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" });
    return `${f} ${t}`;
  } catch { return "—"; }
};

/* ===== Estilos ===== */
const S = {
  wrap: { padding: "72px 16px 24px", maxWidth: 1080, margin: "0 auto" },
  h1: { font: "700 24px/1.15 Montserrat,system-ui", margin: "0 0 4px" },
  sub: { font: "400 14px/1.35 Montserrat,system-ui", color: "#475569", margin: "0 0 12px" },

  // Cabeceira do encontro: máis grande + fondo verde degradado
  resumen: {
    margin: "0 0 14px",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #86efac",
    background: "linear-gradient(180deg,#dcfce7,#bbf7d0)",
    color: "#064e3b",
    boxShadow: "0 6px 18px rgba(22,163,74,.18)",
  },
  resumeTitle: { margin: 0, font: "800 18px/1.25 Montserrat,system-ui", letterSpacing: ".2px" },
  resumeLine: { margin: "4px 0 0", font: "700 15px/1.25 Montserrat,system-ui", color: "#065f46" },
  resumeMuted: { margin: "6px 0 0", font: "600 14px/1.2 Montserrat,system-ui", color: "#065f46" },

  tableWrap: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
  },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    font: "700 13px/1.2 Montserrat,system-ui",
    color: "#0f172a",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 12px",
    font: "500 14px/1.35 Montserrat,system-ui",
    color: "#0f172a",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
    whiteSpace: "nowrap",
  },
  tdPlayers: {
    padding: "10px 12px",
    borderBottom: "1px solid #f1f5f9",
    whiteSpace: "normal",
  },

  // Estilos de cada xogador na lista
  hit: { color: "#0ea5e9", fontWeight: 700 },   // celeste + lixeiro bold
  miss: { color: "#0f172a", fontWeight: 400 },  // un pouco máis fino

  empty: {
    padding: "12px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#eef6ff",
    color: "#0f172a",
  },
};

/* ===== Page ===== */
export default function ResultadosUltimaAlineacion() {
  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState(null); // {equipo1, equipo2, match_iso}
  const [matchIso, setMatchIso] = useState(null);

  // Filas da táboa
  // [{timeISO,timeStr,user,total,players: Array<{id,dorsal,nombre,isHit}>}]
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        /* 1) Partido de referencia */
        let mIso = null;
        const last = await supabase
          .from("alineacion_oficial")
          .select("match_iso, updated_at")
          .not("match_iso", "is", null)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (last.data && last.data.length) {
          mIso = last.data[0].match_iso;
        } else {
          const { data: nm } = await supabase
            .from("next_match")
            .select("equipo1,equipo2,match_iso")
            .eq("id", 1)
            .maybeSingle();
          if (!nm?.match_iso) { if (alive) { setHeader(null); setLoading(false); } return; }
          mIso = nm.match_iso;
          if (alive) setHeader({ equipo1: cap(nm.equipo1 || ""), equipo2: cap(nm.equipo2 || ""), match_iso: mIso });
        }

        if (!header) {
          const { data: mv } = await supabase
            .from("matches_vindeiros")
            .select("equipo1,equipo2")
            .eq("match_iso", mIso)
            .maybeSingle();
          if (mv && alive) setHeader({ equipo1: cap(mv.equipo1 || ""), equipo2: cap(mv.equipo2 || ""), match_iso: mIso });
        }
        if (alive) setMatchIso(mIso);

        /* 2) Oficial (set ids) */
        const ofiQ = await supabase
          .from("alineacion_oficial")
          .select("jugador_id")
          .eq("match_iso", mIso);
        const oficialSet = new Set((ofiQ.data || []).map(r => r.jugador_id).filter(isUUID));

        /* 3) Aliñacións usuarias */
        const all = await supabase
          .from("alineaciones_usuarios")
          .select("user_id, jugador_id, updated_at")
          .eq("match_iso", mIso);
        const aRows = all.data || [];
        if (!aRows.length) { if (alive) { setRows([]); setLoading(false); } return; }

        /* 4) Perfís para nome visible */
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, first_name, nombre, full_name, email");
        const profilesMap = new Map(
          (profs || []).map(p => {
            const label =
              (p.first_name || "").trim() ||
              (p.nombre || "").trim() ||
              (p.full_name || "").trim().split(" ")[0] ||
              (p.email || "").split("@")[0] ||
              "usuaria";
            return [p.id, label];
          })
        );

        /* 5) Catálogo xogadores */
        const { data: js } = await supabase
          .from("jugadores")
          .select("id, nombre, dorsal, foto_url");
        const jMap = new Map((js || []).map(j => [j.id, enrichPlayer(j)]));

        /* 6) Por usuaria → set picks e última hora */
        const byUser = new Map(); // uid -> { picked:Set<uuid>, last:ISOString }
        for (const r of aRows) {
          if (!isUUID(r.user_id) || !isUUID(r.jugador_id)) continue;
          const cur = byUser.get(r.user_id) || { picked: new Set(), last: null };
          cur.picked.add(r.jugador_id);
          const t = r.updated_at ? new Date(r.updated_at).getTime() : 0;
          const lastT = cur.last ? new Date(cur.last).getTime() : 0;
          if (t > lastT) cur.last = r.updated_at || cur.last;
          byUser.set(r.user_id, cur);
        }

        /* 7) Construír filas: ordenar por posición→dorsal→nome e marcar acertos */
        const out = [];
        for (const [uid, { picked, last }] of byUser.entries()) {
          const players = Array.from(picked)
            .map(id => jMap.get(id))
            .filter(Boolean)
            .sort((a, b) => {
              const ra = POS_RANK[a.pos] ?? 9, rb = POS_RANK[b.pos] ?? 9;
              if (ra !== rb) return ra - rb;
              const da = a.dorsal ?? 999, db = b.dorsal ?? 999;
              if (da !== db) return da - db;
              return a.nombre.localeCompare(b.nombre, "gl");
            })
            .map(p => ({ ...p, isHit: oficialSet.has(p.id) }));

          const total = players.reduce((acc, p) => acc + (p.isHit ? 1 : 0), 0);

          out.push({
            timeISO: last,
            timeStr: fmtDateTime(last), // data + hora
            user: profilesMap.get(uid) || "usuaria",
            total,
            players,
          });
        }

        // Orde por data e hora (ascendente)
        out.sort((a, b) => {
          const ta = a.timeISO ? new Date(a.timeISO).getTime() : 0;
          const tb = b.timeISO ? new Date(b.timeISO).getTime() : 0;
          return ta - tb;
        });

        if (alive) setRows(out);
      } catch (e) {
        console.error("[ResultadosUltimaAlineacion] error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Datos de cabeceira
  const { sFecha, sHora } = useMemo(() => {
    if (!header?.match_iso) return { sFecha: "-", sHora: "-" };
    try {
      const d = new Date(header.match_iso);
      return {
        sFecha: d.toLocaleDateString("gl-ES", { day: "2-digit", month: "2-digit", year: "numeric" }),
        sHora: d.toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" }),
      };
    } catch { return { sFecha: "-", sHora: "-" }; }
  }, [header]);

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Resultados da última aliñación</h1>
      <p style={S.sub}>
        Listaxe con todos os resultados presentados en tempo e forma do último partido.
        Os acertos móstranse en celeste.
      </p>

      {header && (
        <section style={S.resumen}>
          <p style={S.resumeTitle}>
            {header ? `${cap(header.equipo1)} vs ${cap(header.equipo2)}` : ""}
          </p>
          <p style={S.resumeLine}>{sFecha} | {sHora}</p>
          <p style={S.resumeMuted}>
            Participantes: <strong>{rows.length}</strong>
          </p>
        </section>
      )}

      {loading && <div style={S.empty}>Cargando…</div>}

      {!loading && (!rows.length || !matchIso) && (
        <div style={S.empty}>
          {matchIso
            ? "Aínda non hai aliñacións de usuarias rexistradas para este encontro."
            : "Non se puido determinar o encontro a comparar."}
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Data e hora</th>
                <th style={S.th}>Usuaria</th>
                <th style={S.th}>Acertos</th>
                <th style={S.th}>Alineación presentada</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={S.td}>{r.timeStr}</td>
                  <td style={S.td}>{r.user}</td>
                  <td style={S.td}>{r.total}</td>
                  <td style={S.tdPlayers}>
                    {r.players.map((p, idx) => (
                      <span
                        key={p.id || idx}
                        style={p.isHit ? S.hit : S.miss}
                      >
                        {p.dorsal != null ? `${String(p.dorsal).padStart(2, "0")} · ` : ""}{p.nombre}
                        {idx < r.players.length - 1 ? "   |   " : ""}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
