// src/pages/ConvocatoriaProximo.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Utils ===== */
function fmtDT(iso) {
  try {
    const d = new Date(iso);
    const fecha = d.toLocaleDateString("gl-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    const hora  = d.toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" });
    return { fecha, hora };
  } catch { return { fecha: "-", hora: "-" }; }
}
function safeDecode(s = "") { try { return decodeURIComponent(s); } catch { return s.replace(/%20/g, " "); } }
// NN-Nome-POR|DEF|CEN|DEL.(jpg|jpeg|png|webp)
function parseFromFilename(url = "") {
  const last = (url.split("?")[0].split("#")[0].split("/").pop() || "").trim();
  const m = last.match(/^(\d+)-(.+)-(POR|DEF|CEN|DEL)\.(jpg|jpeg|png|webp)$/i);
  if (!m) return { dorsalFile: null, nameFile: null, posFile: null };
  return { dorsalFile: parseInt(m[1],10), nameFile: safeDecode(m[2].replace(/_/g," ")), posFile: m[3].toUpperCase() };
}
function canonPos(val="") {
  const s = String(val).trim().toUpperCase();
  if (["POR","PORTERO","PORTEIRO","GK","PORTEIROS"].includes(s)) return "POR";
  if (["DEF","DEFENSA","DF","LATERAL","CENTRAL","DEFENSAS"].includes(s)) return "DEF";
  if (["CEN","MED","MEDIO","MC","MCD","MCO","CENTROCAMPISTA","CENTROCAMPISTAS","MEDIOS"].includes(s)) return "CEN";
  if (["DEL","DELANTERO","FW","DC","EXTREMO","PUNTA","DELANTEROS"].includes(s)) return "DEL";
  return "";
}
function finalFromAll(p = {}) {
  const { dorsalFile, nameFile, posFile } = parseFromFilename(p.foto_url || "");
  return {
    dorsal: dorsalFile ?? (p.dorsal ?? null),
    pos: posFile || canonPos(p.posicion || p.position || ""),
    nombre: (nameFile || p.nombre || "").trim()
  };
}

/* ===== Página ===== */
export default function ConvocatoriaProximo() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState([]);
  const [encuentro, setEncuentro] = useState(null);
  const [convIds, setConvIds] = useState([]);
  const [discarded, setDiscarded] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Marco informativo (orde: Vindeiros #1 → next_match → encontro)
  const [topVindeiro, setTopVindeiro] = useState(null);
  const [nextMatch, setNextMatch] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        // Admin?
        const { data: sess } = await supabase.auth.getSession();
        const email = (sess?.session?.user?.email || "").toLowerCase();
        const uid   = sess?.session?.user?.id || null;
        let admin = false;
        if (uid) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("role,email")
            .eq("id", uid)
            .maybeSingle();
          const role = (prof?.role || "").toLowerCase();
          const em   = (prof?.email || email || "").toLowerCase();
          admin = role === "admin" || ["hdcliga@gmail.com","hdcliga2@gmail.com"].includes(em);
        }
        setIsAdmin(admin);

        // Plantilla completa
        const { data: js } = await supabase
          .from("jugadores")
          .select("id, nombre, dorsal, posicion, position, foto_url")
          .order("dorsal", { ascending: true });
        setPlayers(js || []);

        // next_match
        const { data: nm } = await supabase
          .from("next_match")
          .select("equipo1,equipo2,match_iso")
          .eq("id",1).maybeSingle();
        setNextMatch(nm || null);

        // Vindeiros #1
        const { data: top } = await supabase
          .from("matches_vindeiros")
          .select("equipo1,equipo2,match_iso")
          .order("match_iso", { ascending: true })
          .limit(1)
          .maybeSingle();
        setTopVindeiro(top || null);

        // Encontro futuro para vincular convocatoria
        const { data: enc } = await supabase
          .from("encuentros")
          .select("id, titulo, fecha_hora, equipo1, equipo2")
          .gte("fecha_hora", new Date().toISOString())
          .order("fecha_hora", { ascending: true })
          .limit(1)
          .maybeSingle();
        setEncuentro(enc || null);

        if (enc?.id) {
          const { data: cv } = await supabase
            .from("convocatorias")
            .select("jugador_id")
            .eq("partido_id", enc.id);
          const ids = (cv || []).map(r => r.jugador_id);
          setConvIds(ids);

          // pre-marca descartes (admin: “todos menos convocados”)
          if (admin && js?.length) {
            const allIds = new Set(js.map(p => p.id));
            const convSet = new Set(ids);
            setDiscarded(new Set([...allIds].filter(id => !convSet.has(id))));
          }
        }
      } catch (e) {
        console.error("[Convocatoria] init:", e);
      }
    })();
  }, []);

  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of players || []) {
      const info = finalFromAll(p);
      if (info.pos && g[info.pos]) g[info.pos].push({ ...p, ...info });
    }
    // usuario normal → solo convocados (si existen)
    if (!isAdmin && convIds.length) {
      for (const k of Object.keys(g)) g[k] = g[k].filter(p => convIds.includes(p.id));
    }
    return g;
  }, [players, convIds, isAdmin]);

  const toggleDiscard = (id) => {
    if (!isAdmin) return;
    setDiscarded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const onConfirm = async () => {
    if (!isAdmin || !encuentro?.id || !players?.length) return;
    setSaving(true);
    try {
      const allIds = players.map(p => p.id);
      const convocados = allIds.filter(id => !discarded.has(id));
      await supabase.from("convocatorias").delete().eq("partido_id", encuentro.id);
      if (convocados.length) {
        const rows = convocados.map(jid => ({ partido_id: encuentro.id, jugador_id: jid }));
        const { error } = await supabase.from("convocatorias").insert(rows);
        if (error) throw error;
      }
      setConvIds(convocados);
      setToast("Convocatoria gardada");
      setTimeout(() => setToast(""), 3000);
    } catch (e) {
      console.error("save err:", e);
      setToast("Erro ao gardar");
      setTimeout(() => setToast(""), 3000);
    } finally { setSaving(false); }
  };

  /* ===== Estilos ===== */
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "16px" };
  const h1 = { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" };
  const sub = { margin: "0 0 10px", color: "#475569", fontSize: 15 };

  // Marco informativo
  const infoBox = {
    margin: "0 0 14px",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #cfe8ff",
    background: "linear-gradient(135deg,#dff3ff,#9dd8ff)",
    color: "#0f172a",
    lineHeight: 1.25,
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    alignItems: "center"
  };
  const infoTexts = { display: "grid", gap: 2 };
  const infoLine = { margin: 0, fontSize: 16, fontWeight: 500 };   // sin bold pesado
  const infoLine2 = { margin: 0, fontSize: 15, fontWeight: 500 };

  const confirmSmall = {
    padding: "10px 14px",
    borderRadius: 12,
    background: "linear-gradient(180deg,#bae6fd,#7dd3fc)",
    color: "#0c4a6e",
    fontWeight: 800,
    border: "1px solid #38bdf8",
    cursor: saving ? "wait" : "pointer",
    boxShadow: "0 10px 22px rgba(2,132,199,.25)"
  };

  const posHeader = { margin: "16px 0 10px", padding: "2px 4px", fontWeight: 700, color: "#0c4a6e", borderLeft: "4px solid #7dd3fc" };
  const grid4 = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 };
  if (typeof window !== "undefined" && window.innerWidth >= 640) grid4.gridTemplateColumns = "repeat(3, minmax(0,1fr))";
  if (typeof window !== "undefined" && window.innerWidth >= 960) grid4.gridTemplateColumns = "repeat(4, minmax(0,1fr))";

  const card = (isOut) => ({
    position: "relative",
    border: "1px solid #eef2ff",
    borderRadius: 16,
    padding: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    background: "#fff",
    cursor: isAdmin ? "pointer" : "default",
    outline: "none",
    userSelect: "none"
  });
  const frame = { width: "100%", height: 320, borderRadius: 12, overflow: "hidden", background: "#ffffff", display: "grid", placeItems: "center", border: "1px solid #e5e7eb" };
  const name = { margin: "8px 0 0", font: "700 15px/1.2 Montserrat, system-ui, sans-serif", color: "#0f172a", textAlign: "center" };
  const meta = { margin: "2px 0 0", color: "#475569", fontSize: 13, textAlign: "center" };

  const Cross = ({ show=false }) => show ? (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position:"absolute", inset:10, borderRadius:12, pointerEvents:"none" }}>
      <rect x="0" y="0" width="100" height="100" fill="rgba(220,38,38,.18)" rx="12" />
      <path d="M10 10 L90 90 M90 10 L10 90" stroke="rgba(220,38,38,.85)" strokeWidth="8" strokeLinecap="round" />
    </svg>
  ) : null;

  const ConfirmBtn = ({ disabled, full = false }) => (
    <button
      onClick={onConfirm}
      disabled={disabled || saving}
      style={{
        ...(full
          ? {
              gridColumn: "1 / -1",
              padding: "14px 16px",
              borderRadius: 14,
              background: disabled ? "#bae6fd" : "linear-gradient(180deg,#bae6fd,#7dd3fc)",
              color: "#0c4a6e",
              fontWeight: 800,
              border: "1px solid #38bdf8",
              cursor: disabled ? "not-allowed" : "pointer",
              boxShadow: "0 10px 22px rgba(2,132,199,.25)",
              marginTop: 12
            }
          : confirmSmall
        )
      }}
      aria-label="Confirmar convocatoria"
    >
      {saving ? "Gardando…" : "CONFIRMAR"}
    </button>
  );

  const { fecha, hora } = fmtDT(
    (topVindeiro?.match_iso ?? nextMatch?.match_iso) ??
    (encuentro?.fecha_hora ?? null)
  );
  const eq1 = (topVindeiro?.equipo1 ?? nextMatch?.equipo1 ?? (encuentro?.equipo1 || encuentro?.titulo) ?? "—") + "";
  const eq2 = (topVindeiro?.equipo2 ?? nextMatch?.equipo2 ?? encuentro?.equipo2 ?? "—") + "";

  return (
    <main style={wrap}>
      <h1 style={h1}>Convocatoria oficial</h1>
      <p style={sub}>Lista de xogadores que poderían estar na aliñación para o seguinte partido.</p>

      {/* Marco informativo con botón a la derecha */}
      <section style={infoBox} aria-label="Información do próximo partido">
        <div style={infoTexts}>
          <p style={infoLine}>{eq1.toUpperCase()} vs {eq2.toUpperCase()}</p>
          <p style={infoLine2}>{fecha} | {hora}</p>
        </div>
        {isAdmin && <ConfirmBtn disabled={!encuentro?.id || !players.length} />}
      </section>

      {/* Bloques por posición (non se mesturan) */}
      {(["POR","DEF","CEN","DEL"]).map((k) => {
        const arr = (grouped[k] || []);
        if (!arr.length) return null;
        const label = k === "POR" ? "Porteiros" : k === "DEF" ? "Defensas" : k === "CEN" ? "Medios" : "Dianteiros";
        return (
          <section key={k}>
            <div style={posHeader}>{label}</div>
            <div style={grid4}>
              {arr.map((p) => {
                const out = discarded.has(p.id);
                const { dorsal, nombre, pos } = p;
                return (
                  <article
                    key={p.id}
                    style={card(out)}
                    onClick={() => toggleDiscard(p.id)}
                    aria-pressed={out ? "true" : "false"}
                    title={isAdmin ? (out ? "Descartado (clic para restaurar)" : "Clic para descartar") : undefined}
                  >
                    <div style={frame}>
                      {p.foto_url ? (
                        <img
                          src={p.foto_url}
                          alt={`Foto de ${nombre}`}
                          style={{ width:"100%", height:"100%", objectFit:"contain", background:"#ffffff" }}
                          loading="lazy"
                          onError={(e)=>{ e.currentTarget.alt = "Imaxe non dispoñíbel"; }}
                        />
                      ) : (
                        <div style={{ color:"#cbd5e1" }}>Sen foto</div>
                      )}
                    </div>
                    <Cross show={out} />
                    <p style={name}>
                      {dorsal != null ? `${String(dorsal).padStart(2,"0")} · ` : ""}{nombre}
                    </p>
                    <p style={meta}>{pos}</p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Botón confirmar grande ao final */}
      {isAdmin && (
        <div style={{ marginTop: 10 }}>
          <ConfirmBtn disabled={!encuentro?.id || !players.length} full />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position:"fixed", bottom:18, left:"50%", transform:"translateX(-50%)",
            background:"#0ea5e9", color:"#fff", padding:"10px 16px",
            borderRadius:12, boxShadow:"0 10px 22px rgba(2,132,199,.35)", fontWeight:700
          }}
        >
          {toast}
        </div>
      )}
    </main>
  );
}
