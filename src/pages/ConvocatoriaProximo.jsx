import { h } from "preact";
import { useEffect, useMemo, useState, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Utils ===== */
const cap = (s = "") => (s || "").toUpperCase();

function fmtDT(iso) {
  if (!iso) return { fecha: "-", hora: "-" };
  try {
    const d = new Date(iso);
    return {
      fecha: d.toLocaleDateString("gl-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      hora: d.toLocaleTimeString("gl-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch {
    return { fecha: "-", hora: "-" };
  }
}

function safeDecode(s = "") {
  try {
    return decodeURIComponent(s);
  } catch {
    return s.replace(/%20/g, " ");
  }
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
function finalFromAll(p = {}) {
  const { dorsalFile, nameFile, posFile } = parseFromFilename(p.foto_url || "");
  return {
    dorsal: dorsalFile ?? (p.dorsal ?? null),
    pos: (posFile || "").toUpperCase(),
    nombre: (nameFile || p.nombre || "").trim(),
  };
}

/* ===== Estilos base (algúns dinámicos dentro do compoñente) ===== */
const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: {
    fontFamily:
      "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    fontSize: 24,
    margin: "6px 0 2px",
    color: "#0f172a",
  },
  sub: { margin: "0 0 8px", color: "#475569", fontSize: 16 },
  savedRow: {
    margin: "0 0 16px",
    color: "#475569",
    fontSize: 16,
    fontWeight: 600, // semibold
  },
  resumen: {
    margin: "0 0 14px",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #dbeafe",
    background: "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    color: "#0f172a",
  },
  resumeLine: {
    margin: 0,
    fontSize: 19,
    fontWeight: 400,
    letterSpacing: ".35px",
    lineHeight: 1.5,
  },

  topActions: {
    display: "grid",
    gridTemplateColumns: "7fr 3fr",
    gap: 10,
    marginTop: 10,
  },
  btnSave: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 10,
    background: "linear-gradient(180deg,#bae6fd,#7dd3fc)",
    color: "#0c4a6e",
    fontWeight: 800,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(2,132,199,.25)",
  },
  btnReset: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 10,
    background: "linear-gradient(180deg,#fecaca,#f87171)",
    color: "#7f1d1d",
    fontWeight: 800,
    border: "1px solid #fecaca",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(239,68,68,.22)",
  },

  posHeader: {
    margin: "16px 0 10px",
    padding: "2px 4px 8px",
    fontWeight: 700,
    color: "#0c4a6e",
    borderLeft: "4px solid #7dd3fc",
    borderBottom: "2px solid #e2e8f0",
  },

  // Durante a selección: elixidos en celeste; despois de gardar: limpos.
  card: ({ selected, isSelecting }) => ({
    position: "relative",
    border: selected && isSelecting ? "2px solid #38bdf8" : "1px solid #dbeafe",
    borderRadius: 16,
    padding: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    background:
      selected && isSelecting
        ? "linear-gradient(180deg,#e0f2fe,#bae6fd)"
        : "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    cursor: "pointer",
    userSelect: "none",
    transition: "border-color .12s, background .12s",
  }),
  name: {
    margin: "8px 0 0",
    font: "700 15px/1.2 Montserrat, system-ui, sans-serif",
    color: "#0f172a",
    textAlign: "center",
  },
  meta: { margin: "2px 0 0", color: "#475569", fontSize: 13, textAlign: "center" },

  overlayCenter: (show) => ({
    position: "absolute",
    inset: 0,
    display: show ? "grid" : "none",
    placeItems: "center",
    background: "rgba(2,6,23,.35)",
  }),
  overlayPill: {
    padding: "8px 14px",
    borderRadius: 999,
    backdropFilter: "blur(1px)",
    background: "rgba(59,130,246,.85)",
    color: "#fff",
    fontWeight: 900,
    letterSpacing: 0.5,
    boxShadow: "0 8px 22px rgba(59,130,246,.35)",
  },

  toastInfo: {
    position: "fixed",
    bottom: 18,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#0ea5e9",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 12,
    boxShadow: "0 10px 22px rgba(2,132,199,.35)",
    fontWeight: 700,
    zIndex: 9999,
  },
};

const ConvOverlay = ({ show = false }) => (
  <div style={S.overlayCenter(show)}>
    <span style={S.overlayPill}>CONVOCADO</span>
  </div>
);

export default function ConvocatoriaProximo() {
  const [isAdmin, setIsAdmin] = useState(false);

  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState(new Set()); // IDs convocados
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const toastRef = useRef(null);

  // Cabeceira (desde Vindeiros ou fallback a next_match)
  const [header, setHeader] = useState(null); // {equipo1,equipo2,match_iso}

  // UI: antes de gardar -> selección (amosar todo + overlay nos elixidos)
  //     despois de gardar -> só convocados, limpos.
  const [showOnlyConvocados, setShowOnlyConvocados] = useState(false);

  // Marca de tempo do último gardado (máximo updated_at en convocatoria_publica)
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Responsivo: columnas e altura da foto segundo ancho
  const [cols, setCols] = useState(4);
  const [imgH, setImgH] = useState(320);

  useEffect(() => () => clearTimeout(toastRef.current), []);

  useEffect(() => {
    const applyLayout = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1200;
      if (w <= 560) {
        setCols(2);
        setImgH(220);
      } else if (w <= 900) {
        setCols(3);
        setImgH(260);
      } else {
        setCols(4);
        setImgH(320);
      }
    };
    applyLayout();
    window.addEventListener("resize", applyLayout);
    return () => window.removeEventListener("resize", applyLayout);
  }, []);

  async function fetchLastSaved() {
    try {
      const { data } = await supabase
        .from("convocatoria_publica")
        .select("updated_at");
      const maxTs = (data || [])
        .map((r) => r.updated_at)
        .filter(Boolean)
        .map((t) => new Date(t).getTime())
        .reduce((a, b) => (b > a ? b : a), 0);
      setLastSavedAt(maxTs ? new Date(maxTs) : null);
    } catch {
      setLastSavedAt(null);
    }
  }

  useEffect(() => {
    (async () => {
      // Admin?
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id || null;
      let admin = false;
      if (uid) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role,email")
          .eq("id", uid)
          .maybeSingle();
        const role = (prof?.role || "").toLowerCase();
        admin = role === "admin";
      }
      setIsAdmin(admin);

      // Plantel completo
      const { data: js } = await supabase
        .from("jugadores")
        .select("id,nombre,dorsal,foto_url")
        .order("dorsal", { ascending: true });
      setPlayers(js || []);

      // Cabeceira
      const { data: top } = await supabase
        .from("matches_vindeiros")
        .select("equipo1,equipo2,match_iso")
        .order("match_iso", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (top?.match_iso) {
        setHeader({
          equipo1: cap(top.equipo1 || ""),
          equipo2: cap(top.equipo2 || ""),
          match_iso: top.match_iso,
        });
      } else {
        const { data: nm } = await supabase
          .from("next_match")
          .select("equipo1,equipo2,match_iso")
          .eq("id", 1)
          .maybeSingle();
        if (nm?.match_iso)
          setHeader({
            equipo1: cap(nm.equipo1 || ""),
            equipo2: cap(nm.equipo2 || ""),
            match_iso: nm.match_iso,
          });
        else setHeader(null);
      }

      // Precarga dos convocados e do último gardado
      const { data: pub } = await supabase
        .from("convocatoria_publica")
        .select("jugador_id,updated_at");
      const convSet = new Set((pub || []).map((r) => r.jugador_id));
      setSelected(convSet);

      const maxTs = (pub || [])
        .map((r) => r.updated_at)
        .filter(Boolean)
        .map((t) => new Date(t).getTime())
        .reduce((a, b) => (b > a ? b : a), 0);
      setLastSavedAt(maxTs ? new Date(maxTs) : null);

      // Ao entrar → modo selección (amosar todo e overlays cando se elixen)
      setShowOnlyConvocados(false);
    })().catch((e) => console.error("[ConvocatoriaProximo] init", e));
  }, []);

  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of players || []) {
      const info = finalFromAll(p);
      if (info.pos && g[info.pos]) g[info.pos].push({ ...p, ...info });
    }
    return g;
  }, [players]);

  const visibleIdSet = useMemo(() => {
    if (!showOnlyConvocados) return null; // amosar todos
    return selected;
  }, [showOnlyConvocados, selected]);

  const headerDT = fmtDT(header?.match_iso);

  const toggleSelect = (id) => {
    // Só se pode seleccionar en “modo selección”
    if (!isAdmin || showOnlyConvocados) return;
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  async function saveAndPublish() {
    if (!isAdmin) return;
    setSaving(true);
    try {
      // Persistir convocatoria actual
      await supabase
        .from("convocatoria_publica")
        .delete()
        .neq("jugador_id", "00000000-0000-0000-0000-000000000000");

      const arr = Array.from(selected);
      if (arr.length) {
        const nowIso = new Date().toISOString();
        const rows = arr.map((jid) => ({
          jugador_id: jid,
          updated_at: nowIso,
        }));
        const { error } = await supabase
          .from("convocatoria_publica")
          .insert(rows);
        if (error) throw error;
        setLastSavedAt(new Date(nowIso));
      } else {
        setLastSavedAt(new Date()); // sen xogadores, pero rexistramos o baleiro
      }

      // UI: despois de gardar → só convocados e limpos (sen overlays)
      setShowOnlyConvocados(true);
      setToast("Convocatoria gardada");
      clearTimeout(toastRef.current);
      toastRef.current = setTimeout(() => setToast(""), 1500);
    } catch (e) {
      console.error(e);
      setToast("Erro ao gardar a convocatoria");
      clearTimeout(toastRef.current);
      toastRef.current = setTimeout(() => setToast(""), 2200);
    } finally {
      setSaving(false);
    }
  }

  async function restoreAll() {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await supabase
        .from("convocatoria_publica")
        .delete()
        .neq("jugador_id", "00000000-0000-0000-0000-000000000000");
      setSelected(new Set());
      setShowOnlyConvocados(false);
      setLastSavedAt(null);
      setToast("Convocatoria restabelecida");
      clearTimeout(toastRef.current);
      toastRef.current = setTimeout(() => setToast(""), 1500);
    } catch (e) {
      console.error(e);
      setToast("Erro ao restabelecer");
      clearTimeout(toastRef.current);
      toastRef.current = setTimeout(() => setToast(""), 2200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Convocatoria oficial</h1>
      <p style={S.sub}>Lista de xogadores pre-seleccionados para xogar o partido.</p>

      {/* Marca de tempo do último gardado (para admin e usuarios) */}
      <p style={S.savedRow}>
        {lastSavedAt
          ? (() => {
              const { fecha, hora } = fmtDT(lastSavedAt.toISOString());
              return <>Convocatoria rexistrada: {fecha} ás {hora}</>;
            })()
          : "Convocatoria aínda sen rexistrar"}
      </p>

      {/* Cabeceira resumida */}
      {header && (
        <div style={S.resumen}>
          <p style={S.resumeLine}>
            {cap(header.equipo1)} vs {cap(header.equipo2)}
          </p>
          <p style={{ ...S.resumeLine, opacity: 0.9 }}>
            {headerDT.fecha} | {headerDT.hora}
          </p>

          {isAdmin && (
            <div style={S.topActions}>
              <button
                style={S.btnSave}
                onClick={saveAndPublish}
                disabled={saving}
                aria-label="Gardar convocatoria"
              >
                {saving ? "Gardando…" : "GARDAR CONVOCATORIA"}
              </button>
              <button
                style={S.btnReset}
                onClick={restoreAll}
                disabled={saving}
                aria-label="Restabelecer convocatoria"
                title="Borrar a lista gardada e volver amosar todo o plantel"
              >
                RESTABLECER
              </button>
            </div>
          )}
        </div>
      )}

      {["POR", "DEF", "CEN", "DEL"].map((k) => {
        let arr = grouped[k] || [];
        if (visibleIdSet) arr = arr.filter((p) => visibleIdSet.has(p.id));
        if (!arr.length) return null;

        const label =
          k === "POR"
            ? "Porteiros"
            : k === "DEF"
            ? "Defensas"
            : k === "CEN"
            ? "Medios"
            : "Dianteiros";
        const isSelecting = !showOnlyConvocados;

        // grella responsiva: 2 / 3 / 4 columnas
        const GRID = {
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
          gap: 12,
        };
        const FRAME = {
          width: "100%",
          height: imgH,
          borderRadius: 12,
          overflow: "hidden",
          background: "#0b1e2a",
          display: "grid",
          placeItems: "center",
          border: "1px solid #e5e7eb",
          position: "relative",
        };

        return (
          <section key={k}>
            <div style={S.posHeader}>{label}</div>
            <div style={GRID}>
              {arr.map((p) => {
                const isSel = selected.has(p.id);
                const { dorsal, nombre, pos } = p;
                return (
                  <article
                    key={p.id}
                    style={S.card({ selected: isSel, isSelecting })}
                    onClick={() => toggleSelect(p.id)}
                    title={isSel ? "Convocado" : "Preme para convocar"}
                  >
                    <div style={FRAME}>
                      {p.foto_url ? (
                        <>
                          <img
                            src={p.foto_url}
                            alt={`Foto de ${nombre}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              background: "#0b1e2a",
                            }}
                            loading="lazy"
                            decoding="async"
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                          />
                          {/* Overlay centrado só durante a selección */}
                          <ConvOverlay show={isSelecting && isSel} />
                        </>
                      ) : (
                        <div style={{ color: "#cbd5e1" }}>Sen foto</div>
                      )}
                    </div>
                    <p style={S.name}>
                      {dorsal != null
                        ? `${String(dorsal).padStart(2, "0")} · `
                        : ""}
                      {nombre}
                    </p>
                    <p style={S.meta}>{pos}</p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {toast && (
        <div role="status" aria-live="polite" style={S.toastInfo}>
          {toast}
        </div>
      )}
    </main>
  );
}
