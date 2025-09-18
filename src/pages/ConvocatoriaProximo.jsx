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
  if (!m) return { dorsalFile: null, nameFile: null, posFile: "" };
  return {
    dorsalFile: parseInt(m[1],10),
    nameFile: safeDecode(m[2].replace(/_/g," ")),
    posFile: (m[3]||"").toUpperCase()
  };
}
function finalFromAll(p = {}) {
  const { dorsalFile, nameFile, posFile } = parseFromFilename(p.foto_url || "");
  return {
    dorsal: dorsalFile ?? (p.dorsal ?? null),
    pos: posFile || "",
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

  // Marco informativo
  const [topVindeiro, setTopVindeiro] = useState(null);   // {equipo1,equipo2,match_iso}
  const [nextMatch, setNextMatch] = useState(null);       // {equipo1,equipo2,match_iso}

  useEffect(() => {
    let alive = true;
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
        if (!alive) return;
        setIsAdmin(admin);

        // Plantilla (no pedimos 'position'; se infiere del nombre del fichero)
        const { data: js } = await supabase
          .from("jugadores")
          .select("id,nombre,dorsal,foto_url")
          .order("dorsal", { ascending: true });
        if (!alive) return;
        setPlayers(js || []);

        // next_match
        const { data: nm } = await supabase
          .from("next_match")
          .select("equipo1,equipo2,match_iso")
          .eq("id",1).maybeSingle();
        if (!alive) return;
        setNextMatch(nm || null);

        // Vindeiros #1
        const { data: top } = await supabase
          .from("matches_vindeiros")
          .select("equipo1,equipo2,match_iso")
          .order("match_iso", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!alive) return;
        setTopVindeiro(top || null);

        // Encontro futuro (para vincular convocatoria a ese id)
        const { data: enc } = await supabase
          .from("encuentros")
          .select("id, titulo, fecha_hora, equipo1, equipo2")
          .gte("fecha_hora", new Date().toISOString())
          .order("fecha_hora", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!alive) return;
        setEncuentro(enc || null);

        if (enc?.id) {
          const { data: cv } = await supabase
            .from("convocatorias")
            .select("jugador_id")
            .eq("partido_id", enc.id);
          const ids = (cv || []).map(r => r.jugador_id);
          if (!alive) return;
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
    return () => { alive = false; };
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

  /* ===== estilos ===== */
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "16px" };
  const h1 = { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" };
  const sub = { margin: "0 0 10px", color: "#475569", fontSize: 15 };

  // Marco informativo (baixo do título)
  const resumenBox = {
    margin: "0 0 14px",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #dbeafe",
    background: "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    color: "#0f172a",
    lineHeight: 1.35
  };
  const resumenGrid = { display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10 };
  const resumeText = { margin: 0, fontSize: 16, fontWeight: 400, letterSpacing: "0.2px" }; // sen bold, un pouco maior
  const resumeText2 = { ...resumeText, opacity: 0.9 };

  const posHeader = {
    margin: "16px 0 10px",
    padding: "2px 4px 8px",
    fontWeight: 700,
    color: "#0c4a6e",
    borderLeft: "4px solid #7dd3fc",
    borderBottom: "2px solid #e2e8f0" // subliñado a todo o ancho
  };
  const grid4 = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 };
  const card = (isOut) => ({
    position: "relative",
    border: "1px solid #eef2ff",
    borderRadius: 16,
    padding: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    background: "#fff",
    cursor: isAdmin ? "pointer" : "default",
    outline: "none",
    userSelect: "none",
    opacity: isOut ? 0.55 : 1
  });
  const frame = { width: "100%", height: 320, borderRadius: 12, overflow: "hidden", background: "#0b1e2a", display: "grid", placeItems: "center", border: "1px solid #e5e7eb" };
  const name = { margin: "8px 0 0", font: "700 15px/1.2 Montserrat, system-ui, sans-serif", color: "#0f172a", textAlign: "center" };
  const meta = { margin: "2px 0 0", color: "#475569", fontSize: 13, textAlign: "center" };

  const BigSaveBtn = ({ disabled }) => (
    <button
      onClick={onConfirm}
      disabled={disabled || saving}
      style={{
        width: "100%",
        padding: "14px 16px",
        borderRadius: 14,
        background: disabled ? "#bae6fd" : "linear-gradient(180deg,#bae6fd,#7dd3fc)",
        color: "#0c4a6e",
        fontWeight: 800,
        border: "1px solid #38bdf8",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: "0 10px 22px rgba(2,132,199,.25)"
      }}
      aria-label="Gardar convocatoria"
    >
      {saving ? "Gardando…" : "GARDAR CONVOCATORIA"}
    </button>
  );

  const SmallSaveBtn = ({ disabled }) => (
    <button
      onClick={onConfirm}
      disabled={disabled || saving}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        background: disabled ? "#bae6fd" : "linear-gradient(180deg,#bae6fd,#7dd3fc)",
        color: "#0c4a6e",
        fontWeight: 800,
        border: "1px solid #38bdf8",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: "0 6px 16px rgba(2,132,199,.20)",
        whiteSpace: "nowrap"
      }}
      aria-label="Gardar convocatoria"
      title="Gardar convocatoria"
    >
      {saving ? "Gardando…" : "GARDAR"}
    </button>
  );

  // Datos do marco (prioridade: Vindeiros #1 → next_match → encontro futuro)
  const source =
    topVindeiro ||
    nextMatch ||
    (encuentro
      ? {
          equipo1: ((encuentro.equipo1 || encontro.titulo || "") + "").toUpperCase(),
          equipo2: ((encuentro.equipo2 || "") + "").toUpperCase(),
          match_iso: encuentro.fecha_hora,
        }
      : null);

  const teamsLine = source ? `${(source.equipo1 || "—").toUpperCase()} vs ${(source.equipo2 || "—").toUpperCase()}` : null;
  const { fecha: sFecha, hora: sHora } = fmtDT(source?.match_iso);

  const canSave = isAdmin && !!encuentro?.id && players.length > 0;

  return (
    <main style={wrap}>
      <h1 style={h1}>Convocatoria oficial</h1>
      <p style={sub}>Lista de xogadores que poderían estar na aliñación para o seguinte partido.</p>

      {/* Marco informativo con botón pequeno á dereita */}
      {source ? (
        <div style={resumenBox} aria-label="Información do próximo partido">
          <div style={resumenGrid}>
            <div>
              <p style={resumeText}>{teamsLine}</p>
              <p style={resumeText2}>{sFecha} | {sHora}</p>
            </div>
            {isAdmin && <SmallSaveBtn disabled={!canSave} />}
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 15 }}>Non hai encontro próximo dispoñíbel.</p>
      )}

      {/* Bloques por posición: non mesturar posicións */}
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
                          alt={`Foto de ${p.nombre}`}
                          style={{ width:"100%", height:"100%", objectFit:"contain" }}
                          loading="lazy"
                          decoding="async"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div style={{ color:"#cbd5e1" }}>Sen foto</div>
                      )}
                    </div>
                    <p style={name}>
                      {p.dorsal != null ? `${String(p.dorsal).padStart(2,"0")} · ` : ""}{p.nombre}
                    </p>
                    <p style={meta}>{p.pos}</p>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Botón grande abaixo de todo */}
      {isAdmin && (
        <div style={{ marginTop: 16 }}>
          <BigSaveBtn disabled={!canSave} />
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
