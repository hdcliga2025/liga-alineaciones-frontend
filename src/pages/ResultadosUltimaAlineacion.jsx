// src/pages/ResultadosUltimaAlineacion.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Utils ===== */
const POS_ORDER = ["POR", "DEF", "CEN", "DEL"];
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

/* ===== Estilos ===== */
const S = {
  wrap: { padding: "72px 16px 24px", maxWidth: 1080, margin: "0 auto" },
  h1: { font: "700 24px/1.15 Montserrat,system-ui", margin: "0 0 4px" },
  sub: { font: "400 14px/1.35 Montserrat,system-ui", color: "#475569", margin: "0 0 12px" },

  resumen: {
    margin: "0 0 12px",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#0f172a",
  },
  resumeTitle: { margin: 0, font: "700 16px/1.2 Montserrat,system-ui" },
  resumeLine: { margin: "2px 0 0", font: "500 14px/1.2 Montserrat,system-ui", color: "#334155" },

  userCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    padding: "12px 12px",
    marginBottom: 12,
  },
  userHeader: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  userName: { margin: 0, font: "700 16px/1.15 Montserrat,system-ui" },
  userScore: {
    margin: 0,
    font: "800 14px/1 Montserrat,system-ui",
    color: "#065f46",
    background: "#bbf7d0",
    border: "1px solid #86efac",
    padding: "5px 9px",
    borderRadius: 999,
  },

  posHeader: {
    margin: "10px 0 6px",
    padding: "2px 4px 6px",
    fontWeight: 700,
    color: "#0c4a6e",
    borderLeft: "4px solid #7dd3fc",
    borderBottom: "2px solid #e2e8f0",
  },
  list: { margin: 0, paddingLeft: 16 },
  li: { font: "500 14px/1.35 Montserrat,system-ui", color: "#0f172a" },

  empty: {
    padding: "12px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    background: "#eef6ff",
    color: "#0f172a",
  },
};

export default function ResultadosUltimaAlineacion() {
  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState(null); // {equipo1, equipo2, match_iso}
  const [matchIso, setMatchIso] = useState(null);

  // Map<jugador_id, jugador>
  const [jugadoresMap, setJugadoresMap] = useState(new Map());

  // resultados por usuaria: Array<{ user_id, display, hits: jugador_id[], hitsByPos: {POR:[],...}, total }>
  const [userResults, setUserResults] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        /* 1) Determinar o partido (usa o último con oficial; se non, next_match) */
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
          if (!nm?.match_iso) {
            if (alive) {
              setHeader(null);
              setLoading(false);
            }
            return;
          }
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

        /* 2) Set oficial por match_iso */
        const ofiQ = await supabase
          .from("alineacion_oficial")
          .select("jugador_id")
          .eq("match_iso", mIso);
        const oficialSet = new Set((ofiQ.data || []).map((r) => r.jugador_id).filter(isUUID));

        /* 3) Traer todas as aliñacións de usuarias por match_iso (soporta filas duplicadas, dedup despois) */
        const all = await supabase
          .from("alineaciones_usuarios")
          .select("user_id, jugador_id")
          .eq("match_iso", mIso);
        const rows = all.data || [];

        /* 4) Perfil/nomes das usuarias implicadas */
        const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(isUUID)));
        let profilesMap = new Map();
        if (userIds.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, first_name, nombre, full_name, email")
            .in("id", userIds);
          profilesMap = new Map(
            (profs || []).map((p) => {
              const label =
                (p.first_name || "").trim() ||
                (p.nombre || "").trim() ||
                (p.full_name || "").trim().split(" ")[0] ||
                (p.email || "").split("@")[0] ||
                "usuaria";
              return [p.id, label];
            })
          );
        }

        /* 5) Traer catálogo de xogadores unha vez e indexar */
        const { data: js } = await supabase
          .from("jugadores")
          .select("id, nombre, dorsal, foto_url");
        const jMap = new Map((js || []).map((j) => [j.id, enrichPlayer(j)]));
        if (alive) setJugadoresMap(jMap);

        /* 6) Construír resultados por usuaria (hits = intersección contra oficialSet) */
        const byUser = new Map(); // user_id -> Set<jugador_id escollidos>
        for (const r of rows) {
          if (!isUUID(r.user_id) || !isUUID(r.jugador_id)) continue;
          if (!byUser.has(r.user_id)) byUser.set(r.user_id, new Set());
          byUser.get(r.user_id).add(r.jugador_id);
        }

        const results = [];
        for (const [uid, pickedSet] of byUser.entries()) {
          const picked = Array.from(pickedSet);
          const hits = picked.filter((id) => oficialSet.has(id));
          const hitsByPos = { POR: [], DEF: [], CEN: [], DEL: [] };

          for (const id of hits) {
            const pj = jMap.get(id);
            if (!pj) continue;
            const pos = pj.pos || "";
            if (hitsByPos[pos]) hitsByPos[pos].push(pj);
          }

          // Ordenar por dorsal e nome en cada grupo
          for (const k of POS_ORDER) {
            hitsByPos[k].sort((a, b) => {
              const da = a.dorsal ?? 999, db = b.dorsal ?? 999;
              if (da !== db) return da - db;
              return a.nombre.localeCompare(b.nombre, "gl");
            });
          }

          results.push({
            user_id: uid,
            display: profilesMap.get(uid) || "usuaria",
            total: hits.length,
            hitsByPos,
          });
        }

        // Ordenar usuarias por total de acertos desc; empate por nome
        results.sort((a, b) => (b.total - a.total) || a.display.localeCompare(b.display, "gl"));

        if (alive) setUserResults(results);
      } catch (e) {
        console.error("[ResultadosUltimaAlineacion] error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Cabecera bonita
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
        Mostramos os acertos individuais de cada persoa participante, agrupados por posición
        (POR, DEF, CEN, DEL) e ordeados por dorsal e nome.
      </p>

      {header && (
        <section style={S.resumen}>
          <p style={S.resumeTitle}>
            {header ? `${cap(header.equipo1)} vs ${cap(header.equipo2)}` : ""}
          </p>
          <p style={S.resumeLine}>{sFecha} | {sHora}</p>
          <p style={{ ...S.resumeLine, marginTop: 6 }}>
            Participantes: <strong>{userResults.length}</strong>
          </p>
        </section>
      )}

      {loading && <div style={S.empty}>Cargando…</div>}

      {!loading && (!userResults.length || !matchIso) && (
        <div style={S.empty}>
          {matchIso
            ? "Aínda non hai aliñacións de usuarias rexistradas para este encontro."
            : "Non se puido determinar o encontro a comparar."}
        </div>
      )}

      {!loading && userResults.length > 0 && userResults.map((u) => (
        <article key={u.user_id} style={S.userCard}>
          <div style={S.userHeader}>
            <h3 style={S.userName}>{u.display}</h3>
            <p style={S.userScore}>{u.total} acertos</p>
          </div>

          {POS_ORDER.map((posKey) => {
            const items = u.hitsByPos[posKey] || [];
            if (!items.length) return null;
            const label =
              posKey === "POR" ? "Porteiros" :
              posKey === "DEF" ? "Defensas" :
              posKey === "CEN" ? "Medios" : "Dianteiros";
            return (
              <section key={posKey}>
                <div style={S.posHeader}>{label}</div>
                <ul style={S.list}>
                  {items.map((p) => (
                    <li key={p.id} style={S.li}>
                      {p.dorsal != null ? `${String(p.dorsal).padStart(2, "0")} · ` : ""}
                      {p.nombre}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </article>
      ))}
    </main>
  );
}
