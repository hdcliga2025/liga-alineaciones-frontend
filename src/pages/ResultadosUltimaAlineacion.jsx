// src/pages/ResultadosUltimaAlineacion.jsx
import { h } from "preact";
import { useEffect, useMemo, useState, useCallback } from "preact/hooks";
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

// Nome + primeiro apelido (fallbacks: full_name, nombre, email)
function displayNameFromProfile(profile = {}, fallback = "xogador/a") {
  const first  = (profile.first_name || "").trim();
  const last   = (profile.last_name  || "").trim();
  const full   = (profile.full_name  || "").trim();
  const nombre = (profile.nombre     || "").trim();
  const email  = (profile.email      || "").trim();

  let firstName = first;
  let firstSurname = "";
  if (!firstName && full) {
    const parts = full.split(/\s+/);
    firstName = parts[0] || "";
    firstSurname = parts[1] || "";
  } else if (last) {
    firstSurname = last.split(/\s+/)[0] || "";
  }

  if (firstName) return (firstName + (firstSurname ? " " + firstSurname : "")).trim();
  if (full)      return (full.split(/\s+/).slice(0, 2).join(" ") || "").trim();
  if (nombre)    return nombre;
  if (email)     return (email.split("@")[0] || email).trim();
  return fallback;
}

/* ===== Estilos ===== */
const S = {
  wrap: { padding: "72px 16px 24px", maxWidth: 1080, margin: "0 auto" },
  h1: { font: "700 24px/1.15 Montserrat,system-ui", margin: "0 0 4px" },
  sub: { font: "400 16px/1.35 Montserrat,system-ui", color: "#475569", margin: "0 0 12px" },

  resumen: {
    margin: "0 0 16px",
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #86efac",
    background: "linear-gradient(180deg,#dcfce7,#bbf7d0)",
    color: "#064e3b",
    boxShadow: "0 6px 18px rgba(22,163,74,.18)"
  },
  resumeTitle: { margin: 0, font: "800 19px/1.2 Montserrat,system-ui", letterSpacing: ".2px" },
  resumeLine:  { margin: "4px 0 0", font: "700 15px/1.2 Montserrat,system-ui", color: "#065f46" },
  resumeMuted: { margin: "6px 0 0", font: "700 14px/1.15 Montserrat,system-ui", color: "#065f46" },

  tableWrap: { width: "100%", overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.06)" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    font: "700 13px/1.2 Montserrat,system-ui",
    color: "#0f172a",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    whiteSpace: "nowrap"
  },
  thSep: { borderRight: "1px solid #e2e8f0" },

  td: {
    padding: "8px 10px",
    font: "500 14px/1.35 Montserrat,system-ui",
    color: "#0f172a",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  tdSep: { borderRight: "1px solid #e2e8f0" },

  // Desktop lineup
  tdPlayers: {
    padding: "8px 10px",
    borderBottom: "1px solid #f1f5f9",
    whiteSpace: "normal",
    font: "500 14px/1.35 Montserrat,system-ui",
    color: "#0f172a"
  },

  // ===== Mobile
  tdMobileUser: {
    padding: "8px 10px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 0
  },
  tdMobileUserText: {
    font: "500 12.5px/1.2 Montserrat,system-ui",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "56vw"
  },
  tdMobileScore: {
    padding: "8px 10px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 800,
    color: "#0ea5e9"
  },
  tdMobileAction: {
    padding: "8px 10px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  eyeBtn: {
    width: 28, height: 28,
    display: "grid", placeItems: "center",
    borderRadius: 8, background: "#fff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    cursor: "pointer"
  },
  eyeSvg: { fill: "none", stroke: "#0f172a", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" },

  playerChunk: { whiteSpace: "nowrap", display: "inline-block" },
  hit: { color: "#0ea5e9", fontWeight: 700 },
  miss: { color: "#0f172a", fontWeight: 400 },
  sep: { color: "#0f172a", fontWeight: 400, padding: "0 6px" },

  scoreCell: { fontWeight: 800, color: "#0ea5e9" },

  empty: { padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 12, background: "#eef6ff", color: "#0f172a" },

  // Modal
  modalBg: { position: "fixed", inset: 0, background: "rgba(2,6,23,.45)", display: "grid", placeItems: "center", zIndex: 9999 },
  modal: { width: "min(92vw,540px)", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, boxShadow: "0 18px 48px rgba(0,0,0,.28)", padding: "16px 14px", position: "relative" },
  modalClose: { position: "absolute", right: 8, top: 8, width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "grid", placeItems: "center" },
  modalTitle: { margin: "0 0 8px", font: "800 18px/1.2 Montserrat,system-ui", color: "#0f172a" },
  modalSub: { margin: "0 0 10px", font: "600 14px/1.2 Montserrat,system-ui", color: "#475569" },
  modalLineup: { margin: 0, font: "500 14px/1.35 Montserrat,system-ui", color: "#0f172a", whiteSpace: "normal" }
};

/* ===== Page ===== */
export default function ResultadosUltimaAlineacion() {
  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState(null);
  const [matchIso, setMatchIso] = useState(null);
  const [rows, setRows] = useState([]);

  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);
  const [openIdx, setOpenIdx] = useState(null);

  // Resize eficiente
  useEffect(() => {
    let raf = 0;
    const onR = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setIsMobile(window.innerWidth <= 560)); };
    window.addEventListener("resize", onR);
    return () => { window.removeEventListener("resize", onR); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 1) Partido de referencia
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
        if (alive) setMatchIso(mIso);

        // 2) Carga en paralelo
        const [ofiQ, allUserPicks, profsQ, jugadoresQ, mvQ] = await Promise.all([
          supabase.from("alineacion_oficial").select("jugador_id").eq("match_iso", mIso),
          supabase.from("alineaciones_usuarios").select("user_id, jugador_id, updated_at").eq("match_iso", mIso),
          supabase.from("profiles").select("id, first_name, last_name, full_name, email, nombre"),
          supabase.from("jugadores").select("id, nombre, dorsal, foto_url"),
          supabase.from("matches_vindeiros").select("equipo1,equipo2").eq("match_iso", mIso).maybeSingle()
        ]);

        if (!header && mvQ?.data && alive) {
          setHeader({ equipo1: cap(mvQ.data.equipo1 || ""), equipo2: cap(mvQ.data.equipo2 || ""), match_iso: mIso });
        }

        const oficialSet = new Set((ofiQ.data || []).map(r => r.jugador_id).filter(isUUID));
        const picks = allUserPicks.data || [];
        if (!picks.length) { if (alive) { setRows([]); setLoading(false); } return; }

        const profilesMap = new Map((profsQ.data || []).map(p => [p.id, p]));
        const jMap = new Map((jugadoresQ.data || []).map(j => [j.id, enrichPlayer(j)]));

        // Agrupar por usuaria
        const byUser = new Map(); // uid -> { picked:Set<uuid>, last:ISOString }
        for (const r of picks) {
          if (!isUUID(r.user_id) || !isUUID(r.jugador_id)) continue;
          const cur = byUser.get(r.user_id) || { picked: new Set(), last: null };
          cur.picked.add(r.jugador_id);
          const t = r.updated_at ? new Date(r.updated_at).getTime() : 0;
          const lastT = cur.last ? new Date(cur.last).getTime() : 0;
          if (t > lastT) cur.last = r.updated_at || cur.last;
          byUser.set(r.user_id, cur);
        }

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

          // Nome consistente sempre
          const prof = profilesMap.get(uid) || {};
          const shownName = displayNameFromProfile(prof, "xogador/a");

          out.push({ timeISO: last, timeStr: fmtDateTime(last), user: shownName, total, players });
        }

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
  }, [header]);

  const { sFecha, sHora } = useMemo(() => {
    if (!header?.match_iso) return { sFecha: "-", sHora: "-" };
    try {
      const d = new Date(header.match_iso);
      return {
        sFecha: d.toLocaleDateString("gl-ES", { day: "2-digit", month: "2-digit", year: "numeric" }),
        sHora: d.toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" })
      };
    } catch { return { sFecha: "-", sHora: "-" }; }
  }, [header]);

  const renderLineup = useCallback((list = []) => (
    <span>
      {list.map((p, idx) => (
        <span key={p.id || idx}>
          <span style={{ ...S.playerChunk, ...(p.isHit ? S.hit : S.miss) }}>
            {p.dorsal != null ? `${String(p.dorsal).padStart(2, "0")} · ` : ""}{p.nombre}
          </span>
          {idx < list.length - 1 && <span aria-hidden="true" style={S.sep}>|</span>}
        </span>
      ))}
    </span>
  ), []);

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Resultados da última aliñación</h1>
      <p style={S.sub}>
        Listado con todos os resultados presentados en tempo e forma do último partido.
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
            ? "Aínda no hai aliñacións rexistradas para este encontro."
            : "Non se puido determinar o encontro a comparar."}
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div style={S.tableWrap}>
          <table style={{ ...S.table }}>
            {isMobile && (
              <colgroup>
                <col style={{ width: "62%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
            )}
            <thead>
              {!isMobile ? (
                <tr>
                  <th style={{ ...S.th, ...S.thSep }}>Data e hora</th>
                  <th style={{ ...S.th, ...S.thSep }}>Xogador</th>
                  <th style={{ ...S.th, ...S.thSep }}>Acertos</th>
                  <th style={S.th}>Aliñación presentada</th>
                </tr>
              ) : (
                <tr>
                  <th style={{ ...S.th, ...S.thSep }}>Xogador</th>
                  <th style={{ ...S.th, ...S.thSep }}>Acertos</th>
                  <th style={S.th}>Detalles</th>
                </tr>
              )}
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {!isMobile ? (
                    <>
                      <td style={{ ...S.td, ...S.tdSep }}>{r.timeStr}</td>
                      <td style={{ ...S.td, ...S.tdSep }}>{r.user}</td>
                      <td style={{ ...S.td, ...S.tdSep, ...S.scoreCell }}>{r.total}</td>
                      <td style={S.tdPlayers}>{renderLineup(r.players)}</td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...S.tdSep, ...S.tdMobileUser }}>
                        <span style={S.tdMobileUserText} title={r.user}>{r.user}</span>
                      </td>
                      <td style={{ ...S.tdSep, ...S.tdMobileScore }}>{r.total}</td>
                      <td style={S.tdMobileAction}>
                        <button
                          type="button"
                          style={S.eyeBtn}
                          onClick={() => setOpenIdx(i)}
                          aria-label="Ver detalles"
                          title="Ver detalles"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" style={S.eyeSvg} aria-hidden="true">
                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isMobile && openIdx !== null && rows[openIdx] && (
        <div style={S.modalBg} role="dialog" aria-modal="true" aria-label="Detalles da aliñación">
          <div style={S.modal}>
            <button style={S.modalClose} onClick={() => setOpenIdx(null)} aria-label="Pechar">✕</button>
            <h3 style={S.modalTitle}>Detalles</h3>
            <p style={S.modalSub}><strong>Data e hora:</strong> {rows[openIdx].timeStr}</p>
            <p style={S.modalSub}><strong>Xogador:</strong> {rows[openIdx].user}</p>
            <p style={S.modalSub}><strong>Acertos:</strong> <span style={{ fontWeight: 800, color: "#0ea5e9" }}>{rows[openIdx].total}</span></p>
            <p style={S.modalSub}><strong>Aliñación presentada:</strong></p>
            <p style={S.modalLineup}>{renderLineup(rows[openIdx].players)}</p>
          </div>
        </div>
      )}
    </main>
  );
}

