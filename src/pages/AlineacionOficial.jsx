// src/pages/AlineacionOficial.jsx
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const cap = (s = "") => (s || "").toUpperCase();
const isUUID = (v = "") =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
const pad2 = (n) => String(n).padStart(2, "0");

/* ---------------------------- UTILIDADES FECHA ---------------------------- */
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
      hora: d.toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch {
    return { fecha: "-", hora: "-" };
  }
}

/* ----------------------- PARSEO NOMBRE/DORSAL DESDE FOTO ------------------ */
function safeDecode(s = "") {
  try {
    return decodeURIComponent(s);
  } catch {
    return s.replace(/%20/g, " ");
  }
}
function parseFromFilename(url = "") {
  const last = (url.split("?")[0].split("#")[0].split("/").pop() || "").trim();
  const m = last.match(
    /^(\d+)-(.+)-(POR|DEF|CEN|DEL)\.(jpg|jpeg|png|webp)$/i
  );
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

/* ------------------- AJUSTE DE TEXTO (SOLO MÓVIL, 2 LÍNEAS) --------------- */
function useFitText2Lines(ref, opts) {
  const {
    min = 11,
    max = 15,
    lineHeight = 1.2,
    maxLines = 2,
    initial = 14,
    deps = [],
  } = opts || {};
  const [fontSize, setFontSize] = useState(initial);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.whiteSpace = "normal";
    el.style.overflow = "hidden";
    el.style.display = "block";
    el.style.textOverflow = "clip";
    el.style.lineHeight = String(lineHeight);
    el.style.wordBreak = "break-word";

    let low = min, high = max;
    let best = Math.max(min, Math.min(high, initial));

    const fits = (sizePx) => {
      el.style.fontSize = sizePx + "px";
      const oneLine = sizePx * lineHeight;
      const maxH = oneLine * maxLines + 0.5;
      return el.scrollHeight <= maxH && el.clientHeight <= maxH;
    };

    if (fits(best)) low = best; else high = best;
    while (high - low > 0.25) {
      const mid = (low + high) / 2;
      if (fits(mid)) low = mid; else high = mid;
    }
    best = Math.floor(low * 10) / 10;
    el.style.fontSize = best + "px";
    setFontSize(best);

    // Si ni en mínimo cabe, aplicamos elipsis como último recurso
    if (!fits(min)) {
      el.style.display = "-webkit-box";
      el.style.webkitBoxOrient = "vertical";
      el.style.webkitLineClamp = String(maxLines);
      el.style.textOverflow = "ellipsis";
    }

    let raf = 0;
    const onR = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setFontSize((s) => s));
    };
    window.addEventListener("resize", onR);
    document.addEventListener("visibilitychange", onR);
    return () => {
      window.removeEventListener("resize", onR);
      document.removeEventListener("visibilitychange", onR);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { fontSize };
}

/* --------------------------------- ESTILOS -------------------------------- */
const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: {
    fontFamily:
      "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    fontSize: 24,
    margin: "6px 0 2px",
    color: "#0f172a",
  },
  sub: { margin: "0 0 12px", color: "#475569", fontSize: 16 },

  // Cuadro de texto (resumen rojo) con MÁS profundidad (sombra externa + leve inset)
  resumen: {
    margin: "0 0 12px",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "linear-gradient(180deg,#fee2e2,#fecaca)",
    color: "#7f1d1d",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,.75), 0 12px 28px rgba(239,68,68,.22), 0 2px 0 rgba(239,68,68,.18)",
  },
  resumeLine: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: ".35px",
    lineHeight: 1.45,
  },
  resumeTeams: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: ".4px",
    lineHeight: 1.45,
  },

  posHeader: {
    margin: "14px 0 10px",
    padding: "2px 4px 8px",
    fontWeight: 700,
    color: "#7f1d1d",
    borderLeft: "4px solid #fecaca",
    borderBottom: "2px solid #fecaca",
  },

  grid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile
      ? "repeat(3, minmax(0,1fr))"
      : "repeat(4, minmax(0,1fr))",
    gap: 12,
  }),

  card: (picked) => ({
    position: "relative",
    border: "1px solid #fecaca",
    borderRadius: 16,
    padding: 10,
    background: picked ? "linear-gradient(180deg,#fee2e2,#fecaca)" : "#fff",
    boxShadow: picked
      ? "0 0 0 2px rgba(239,68,68,.25), 0 8px 26px rgba(239,68,68,.18)"
      : "0 2px 8px rgba(0,0,0,.06)",
  }),

  frame: (isMobile) => ({
    width: "100%",
    height: isMobile ? 172 : 320,
    borderRadius: 12,
    overflow: "hidden",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
    border: "1px solid #e5e7eb",
    position: "relative",
  }),
  img: (isMobile) => ({
    width: "100%",
    height: "100%",
    objectFit: isMobile ? "cover" : "contain",
    background: "#ffffff",
  }),

  /* Desktop: estilo previo con clamp + elipsis */
  nameDesktop: {
    margin: "8px 0 0",
    font: "700 15px/1.2 Montserrat, system-ui, sans-serif",
    color: "#0f172a",
    textAlign: "center",
    display: "-webkit-box",
    WebkitLineClamp: "2",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    wordBreak: "break-word",
  },
  /* Móvil: el tamaño lo decide el hook */
  nameMobileBase: {
    margin: "8px 0 0",
    fontWeight: 700,
    fontFamily: "Montserrat, system-ui, sans-serif",
    lineHeight: 1.2,
    color: "#0f172a",
    textAlign: "center",
  },

  meta: { margin: "2px 0 0", color: "#475569", fontSize: 13, textAlign: "center" },

  rowBtns: {
    display: "grid",
    gridTemplateColumns: "85% 15%",
    gap: 8,
    alignItems: "stretch",
    marginTop: 10,
  },

  /* Botones principales: MÁS ROJO + PROFUNDIDAD */
  btnLoad: (isMobile) => ({
    width: "100%",
    padding: isMobile ? "9px 12px" : "12px 16px",
    borderRadius: 12,
    background: "linear-gradient(180deg,#ffe9e9,#fca5a5)",
    border: "1px solid #ef4444",
    color: "#7f1d1d",
    fontWeight: 800,
    fontSize: isMobile ? 14 : 16,
    letterSpacing: 0.4,
    cursor: "pointer",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,.8), 0 4px 10px rgba(239,68,68,.22), 0 1px 0 rgba(239,68,68,.25)",
    transition: "transform .06s ease, box-shadow .2s ease",
    willChange: "transform",
  }),

  btnTrash: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    background: "linear-gradient(180deg,#ffffff,#fee2e2)",
    color: "#7f1d1d",
    border: "1px solid #ef4444",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,.9), 0 3px 8px rgba(239,68,68,.18), 0 1px 0 rgba(239,68,68,.18)",
    transition: "transform .06s ease, box-shadow .2s ease",
    willChange: "transform",
  },

  btnBottom: (isMobile) => ({
    width: "100%",
    padding: isMobile ? "9px 12px" : "12px 16px",
    borderRadius: 12,
    background: "linear-gradient(180deg,#ffe9e9,#fca5a5)",
    border: "1px solid #ef4444",
    color: "#7f1d1d",
    fontWeight: 800,
    fontSize: isMobile ? 14 : 16,
    letterSpacing: 0.4,
    cursor: "pointer",
    marginTop: 14,
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,.8), 0 4px 10px rgba(239,68,68,.22), 0 1px 0 rgba(239,68,68,.25)",
    transition: "transform .06s ease, box-shadow .2s ease",
    willChange: "transform",
  }),

  counter: {
    position: "absolute",
    left: "50%",
    top: "78%",
    transform: "translate(-50%,-50%)",
    fontFamily: "Montserrat, system-ui, sans-serif",
    fontWeight: 900,
    fontSize: 30,
    color: "#0c4a6e",
    background: "rgba(56,189,248,.55)",
    padding: "6px 12px",
    borderRadius: 999,
    letterSpacing: 1.1,
    userSelect: "none",
    pointerEvents: "none",
  },

  upLabel: {
    margin: "8px 0 0",
    font: "600 15px/1.35 Montserrat,system-ui,sans-serif",
    color: "#0f172a",
  },
  // Color alterna ROJO ↔ NEGRO cada 3s
  upValue: (blinkOn) => ({
    margin: "2px 0 0",
    font: "700 15px/1.35 Montserrat,system-ui,sans-serif",
    color: blinkOn ? "#7f1d1d" : "#0f172a",
    transition: "color .25s ease",
  }),

  okBadgeDesktop: {
    position: "absolute",
    top: 8,
    right: 8,
    background: "rgba(56,189,248,.95)",
    color: "#fff",
    borderRadius: 999,
    padding: "3px 7px",
    font: "700 12px/1 Montserrat,system-ui,sans-serif",
    boxShadow: "0 2px 8px rgba(56,189,248,.35)",
    userSelect: "none",
    pointerEvents: "none",
  },
  /* SOLO MÓVIL: más pequeño y pegado */
  okBadgeMobile: {
    position: "absolute",
    top: 3,
    right: 3,
    background: "rgba(56,189,248,.98)",
    color: "#fff",
    borderRadius: 999,
    padding: "2px 6px",
    font: "700 10.5px/1 Montserrat,system-ui,sans-serif",
    boxShadow: "0 1px 4px rgba(56,189,248,.35)",
    userSelect: "none",
    pointerEvents: "none",
  },
};

/* ------------------------- NOMBRE 2 LÍNEAS EN MÓVIL ------------------------ */
function NameMobileTwoLines({ text }) {
  const ref = useRef(null);
  const { fontSize } = useFitText2Lines(ref, {
    min: 11,
    max: 14,
    initial: 13.5,
    lineHeight: 1.2,
    maxLines: 2,
    deps: [text],
  });
  return (
    <p
      ref={ref}
      style={{
        ...S.nameMobileBase,
        fontSize: fontSize,
        maxHeight: fontSize ? `${fontSize * 1.2 * 2 + 0.5}px` : undefined,
      }}
    >
      {text}
    </p>
  );
}

/* --------------------------------- VISTA ---------------------------------- */
export default function AlineacionOficial() {
  const [header, setHeader] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 560 : false
  );
  const [sel, setSel] = useState(new Set());
  const [lastCounterId, setLastCounterId] = useState(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [blinkOn, setBlinkOn] = useState(true); // parpadeo 3s ROJO↔NEGRO
  const audioCtxRef = useRef(null);
  const max11 = 11;

  // Parpadeo cada 3s (antes 2s)
  useEffect(() => {
    const id = setInterval(() => setBlinkOn((v) => !v), 3000);
    return () => clearInterval(id);
  }, []);

  // Resize → móvil/desktop
  useEffect(() => {
    let raf = 0;
    const onR = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIsMobile(window.innerWidth <= 560));
    };
    window.addEventListener("resize", onR);
    return () => {
      window.removeEventListener("resize", onR);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id || null;
        if (uid) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", uid)
            .maybeSingle();
          setIsAdmin(((prof?.role) || "").toLowerCase() === "admin");
        }
      } catch {}

      const { data: top } = await supabase
        .from("matches_vindeiros")
        .select("id,equipo1,equipo2,match_iso")
        .order("match_iso", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (top?.match_iso) {
        setHeader({
          equipo1: cap(top.equipo1 || ""),
          equipo2: cap(top.equipo2 || ""),
          match_iso: top.match_iso,
          encuentro_id: top.id,
        });
        await preloadOfficial(top.match_iso);
      } else {
        const { data: nm } = await supabase
          .from("next_match")
          .select("equipo1,equipo2,match_iso")
          .eq("id", 1)
          .maybeSingle();
        if (nm?.match_iso) {
          setHeader({
            equipo1: cap(nm.equipo1 || ""),
            equipo2: cap(nm.equipo2 || ""),
            match_iso: nm.match_iso,
            encuentro_id: null,
          });
          await preloadOfficial(nm.match_iso);
        }
      }

      const { data: js } = await supabase
        .from("jugadores")
        .select("id, nombre, dorsal, foto_url")
        .order("dorsal", { ascending: true });
      setPlayers(js || []);
    })();
  }, []);

  async function preloadOfficial(iso) {
    try {
      const { data: ofi } = await supabase
        .from("alineacion_oficial")
        .select("jugador_id,updated_at")
        .eq("match_iso", iso);

      if (ofi && ofi.length) {
        setSel(new Set(ofi.map((r) => r.jugador_id)));
        const last = ofi.reduce(
          (acc, r) => (!acc || r.updated_at > acc ? r.updated_at : acc),
          null
        );
        if (last) setLastSavedAt(last);
      } else {
        setSel(new Set());
        setLastSavedAt(null);
      }
    } catch {}
  }

  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of players || []) {
      const { pos } = finalFromAll(p);
      if (pos && g[pos]) g[pos].push(p);
    }
    return g;
  }, [players]);

  function playBeep() {
    try {
      const ctx =
        audioCtxRef.current ||
        new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.14);
    } catch {}
  }

  function togglePick(id) {
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else {
        if (n.size >= max11) return prev;
        n.add(id);
      }
      return n;
    });
    setLastCounterId(id);
    playBeep();
  }

  function showToast(m, ms = 2600) {
    setToast(m);
    setTimeout(() => setToast(""), ms);
  }

  async function resolveEncuentroId(iso) {
    const a = await supabase
      .from("matches_vindeiros")
      .select("id")
      .eq("match_iso", iso)
      .maybeSingle();
    if (a?.data?.id) return a.data.id;
    return null;
  }

  async function loadOfficial() {
    if (!isAdmin) {
      showToast("Só admins poden gardar a aliñación oficial.");
      return;
    }
    if (sel.size !== 11) {
      showToast("Escolle 11 xogadores.");
      return;
    }
    if (!header?.match_iso) {
      showToast("Falta o partido de referencia.");
      return;
    }

    setSaving(true);
    try {
      const iso = header.match_iso;
      const encuentro_id =
        header.encuentro_id || (await resolveEncuentroId(iso));
      if (!encuentro_id) {
        showToast("Crea o encontro en Vindeiros antes de gardar.");
        setSaving(false);
        return;
      }

      const ids = [...sel];
      const invalid = ids.filter((id) => !isUUID(id));
      if (invalid.length) {
        const byId = new Map(players.map((p) => [p.id, p]));
        const names = invalid.map((id) => byId.get(id)?.nombre || String(id));
        showToast(`IDs non-UUID en xogadores: ${names.join(", ")}`);
        setSaving(false);
        return;
      }

      const check = await supabase
        .from("jugadores")
        .select("id")
        .in("id", ids);
      const okSet = new Set((check.data || []).map((r) => r.id));
      if (okSet.size !== ids.length) {
        const missing = ids.filter((id) => !okSet.has(id));
        showToast(`Xogadores inexistentes: ${missing.join(", ")}`);
        setSaving(false);
        return;
      }

      await supabase
        .from("alineacion_oficial")
        .delete()
        .eq("encuentro_id", encuentro_id);

      const now = new Date().toISOString();
      const rows = ids.map((jid) => ({
        jugador_id: jid,
        match_iso: iso,
        encuentro_id,
        updated_at: now,
        jugadores_ids: [],
      }));

      const ins = await supabase.from("alineacion_oficial").insert(rows);
      if (ins.error) throw ins.error;

      setLastSavedAt(now);
      showToast("Aliñación oficial gardada.");
    } catch (e) {
      const msg = [e?.code, e?.message, e?.details, e?.hint]
        .filter(Boolean)
        .join(" | ");
      console.error("[AlineacionOficial] save error:", e);
      showToast(`Erro gardando: ${msg || "descoñecido"}`, 5200);
    } finally {
      setSaving(false);
    }
  }

  function resetAll() {
    setSel(new Set());
    setLastCounterId(null);
  }

  const baseText = "GRAVAR ALIÑACIÓN OFICIAL";
  const loadLabel =
    sel.size === 11 ? `${baseText}` : `${baseText} | ${sel.size}/11`;

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Aliñación oficial</h1>
      <p style={S.sub}>Os once xogadores que saen de inicio neste partido.</p>

      {header && (
        <div style={S.resumen}>
          <p style={S.resumeTeams}>
            <strong>{cap(header.equipo1)}</strong> vs{" "}
            <strong>{cap(header.equipo2)}</strong>
          </p>
          <p style={{ ...S.resumeLine, opacity: 0.9 }}>
            {fmtDT(header?.match_iso).fecha} | {fmtDT(header?.match_iso).hora}
          </p>

          {/* Parpadeo cada 3s con cambio de color ROJO ↔ NEGRO */}
          <p style={S.upLabel}>Aliñación oficial subida:</p>
          <p style={S.upValue(blinkOn)}>
            {lastSavedAt
              ? `${fmtDT(lastSavedAt).fecha} ás ${fmtDT(lastSavedAt).hora}`
              : "-"}
          </p>

          <div style={S.rowBtns}>
            <button
              style={S.btnLoad(isMobile)}
              onClick={loadOfficial}
              disabled={sel.size !== 11 || saving}
              onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {saving ? "Gardando…" : loadLabel}
            </button>
            <button
              style={S.btnTrash}
              onClick={resetAll}
              title="Restablecer"
              aria-label="Restablecer"
              onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 6h18"
                  stroke="#7f1d1d"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M8 6V4h8v2"
                  stroke="#7f1d1d"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M19 6l-1 14H6L5 6"
                  stroke="#7f1d1d"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M10 11v6M14 11v6"
                  stroke="#7f1d1d"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {["POR", "DEF", "CEN", "DEL"].map((k) => {
        const arr = grouped[k] || [];
        if (!arr.length) return null;
        const label =
          k === "POR"
            ? "Porteiros"
            : k === "DEF"
            ? "Defensas"
            : k === "CEN"
            ? "Medios"
            : "Dianteiros";
        return (
          <section key={k}>
            <div style={S.posHeader}>{label}</div>
            <div style={S.grid(isMobile)}>
              {arr.map((p) => {
                const { dorsal, nombre, pos } = finalFromAll(p);
                const picked = sel.has(p.id);
                const nameLine =
                  (dorsal != null ? `${pad2(dorsal)} · ` : "") + nombre;
                return (
                  <article
                    key={p.id}
                    style={S.card(picked)}
                    onClick={() => togglePick(p.id)}
                  >
                    <div style={S.frame(isMobile)}>
                      <img
                        src={p.foto_url}
                        alt={`Foto de ${nombre}`}
                        style={S.img(isMobile)}
                        loading="lazy"
                        decoding="async"
                      />
                      {lastCounterId === p.id && (
                        <span style={S.counter}>{`${sel.size}/11`}</span>
                      )}
                      {picked && (
                        <span
                          style={isMobile ? S.okBadgeMobile : S.okBadgeDesktop}
                        >
                          OK
                        </span>
                      )}
                    </div>

                    {/* SOLO MÓVIL: autoajuste 2 líneas; DESKTOP: estilo previo */}
                    {isMobile ? (
                      <NameMobileTwoLines text={nameLine} />
                    ) : (
                      <p style={S.nameDesktop}>{nameLine}</p>
                    )}

                    <p style={S.meta}>{pos}</p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <button
        style={S.btnBottom(isMobile)}
        onClick={loadOfficial}
        disabled={sel.size !== 11 || saving}
        onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        {saving ? "Gardando…" : loadLabel}
      </button>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
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
            maxWidth: "92vw",
            textAlign: "center",
            zIndex: 9999,
          }}
        >
          {toast}
        </div>
      )}
    </main>
  );
}

