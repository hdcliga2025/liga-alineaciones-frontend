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

  // Fuentes de partido
  const [topVindeiro, setTopVindeiro] = useState(null); // matches_vindeiros #1
  const [nextMatch, setNextMatch] = useState(null);     // next_match (ProximoPartido)
  const [encuentro, setEncuentro] = useState(null);     // encuentros (futuro con id)

  // Convocatoria actual (si existe) y descartes locales
  const [convIds, setConvIds] = useState([]);
  const [discarded, setDiscarded] = useState(new Set());

  // UI
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null); // {title, body, actionText?, onAction?, onClose?}

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

        // Plantilla
        const { data: js } = await supabase
          .from("jugadores")
          .select("id,nombre,dorsal,foto_url")
          .order("dorsal", { ascending: true });
        if (!alive) return;
        setPlayers(js || []);

        // next_match (es la “fuente oficial” del ProximoPartido)
        const { data: nm } = await supabase
          .from("next_match")
          .select("equipo1,equipo2,match_iso,lugar,competition")
          .eq("id",1).maybeSingle();
        if (!alive) return;
        setNextMatch(nm || null);

        // primer vindeiro (por si no hay next_match)
        const { data: top } = await supabase
          .from("matches_vindeiros")
          .select("equipo1,equipo2,match_iso")
          .order("match_iso", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!alive) return;
        setTopVindeiro(top || null);

        // encontro futuro con id (para vincular convocatorias)
        const { data: enc } = await supabase
          .from("encuentros")
          .select("id, titulo, fecha_hora, equipo1, equipo2")
          .gte("fecha_hora", new Date().toISOString())
          .order("fecha_hora", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!alive) return;
        setEncuentro(enc || null);

        // si existe, carga la convocatoria actual y calcula descartes por defecto
        if (enc?.id) {
          const { data: cv } = await supabase
            .from("convocatorias")
            .select("jugador_id")
            .eq("partido_id", enc.id);
          const ids = (cv || []).map(r => r.jugador_id);
          if (!alive) return;
          setConvIds(ids);

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

  // “Partido abierto”: cualquiera de estas fuentes sirve para el encabezado
  const source =
    nextMatch ||
    topVindeiro ||
    (encuentro
      ? {
          equipo1: ((encuentro.equipo1 || encuentro.titulo || "") + "").toUpperCase(),
          equipo2: ((encuentro.equipo2 || "") + "").toUpperCase(),
          match_iso: encuentro.fecha_hora,
        }
      : null);

  const teamsLine = source ? `${(source.equipo1 || "—").toUpperCase()} vs ${(source.equipo2 || "—").toUpperCase()}` : null;
  const { fecha: sFecha, hora: sHora } = fmtDT(source?.match_iso);

  // Agrupación por posición. Si no admin, mostramos sólo convocados.
  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of players || []) {
      const info = finalFromAll(p);
      if (info.pos && g[info.pos]) g[info.pos].push({ ...p, ...info });
    }
    if (!isAdmin && convIds.length) {
      for (const k of Object.keys(g)) g[k] = g[k].filter(p => convIds.includes(p.id));
    }
    return g;
  }, [players, convIds, isAdmin]);

  // Toggle descartado
  const toggleDiscard = (id) => {
    if (!isAdmin) return;
    setDiscarded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // Intentar crear automaticamente un encuentro desde next_match
  async function ensureEncuentroFromNextMatch() {
    if (encuentro?.id) return encuentro;
    if (!isAdmin) return null;
    if (!nextMatch?.equipo1 || !nextMatch?.equipo2 || !nextMatch?.match_iso) return null;

    const titulo = `${(nextMatch.equipo1||"").toUpperCase()} vs ${(nextMatch.equipo2||"").toUpperCase()}`.trim();
    const payload = {
      titulo,
      fecha_hora: nextMatch.match_iso,
      equipo1: (nextMatch.equipo1 || "").toUpperCase(),
      equipo2: (nextMatch.equipo2 || "").toUpperCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("encuentros")
      .insert(payload)
      .select("id, titulo, fecha_hora, equipo1, equipo2")
      .single();
    if (error) {
      console.error("crear encontro desde next_match:", error);
      return null;
    }
    setEncuentro(data);
    return data;
  }

  // Guardar (doble confirmación). Si no hay encuentro con id, intentamos crearlo con next_match.
  const onConfirm = async () => {
    if (!isAdmin) return;

    let enc = encuentro;
    if (!enc?.id) {
      if (nextMatch?.equipo1 && nextMatch?.equipo2 && nextMatch?.match_iso) {
        setModal({
          title: "Crear encontro a partir de Próximo Partido",
          body: "Detectamos un Próximo Partido. Imos crear o encontro correspondente para asociar a convocatoria.",
          actionText: "Continuar",
          onAction: async () => {
            setModal(null);
            const created = await ensureEncuentroFromNextMatch();
            if (!created?.id) {
              setModal({
                title: "Non foi posíbel crear o encontro",
                body: "Revisa a sección Calendario e intenta de novo.",
                onClose: () => setModal(null)
              });
              return;
            }
            // tras crear, relanzamos o gardado:
            await reallySave(created.id);
          },
          onClose: () => setModal(null),
        });
        return;
      } else {
        setModal({
          title: "Falta encontro aberto",
          body: "Non atopamos datos suficientes para asociar a convocatoria. Vai a Calendario e crea/abre o encontro futuro.",
          onClose: () => setModal(null),
        });
        return;
      }
    } else {
      await reallySave(enc.id);
    }
  };

  async function reallySave(partidoId) {
    const ok1 = window.confirm("Vas gardar a convocatoria deste encontro. ¿Confirmas?");
    if (!ok1) return;
    const ok2 = window.confirm("Publicar para usuarias/os agora mesmo. ¿Última confirmación?");
    if (!ok2) return;

    setSaving(true);
    try {
      const allIds = players.map(p => p.id);
      const convocados = allIds.filter(id => !discarded.has(id));
      await supabase.from("convocatorias").delete().eq("partido_id", partidoId);
      if (convocados.length) {
        const rows = convocados.map(jid => ({ partido_id: partidoId, jugador_id: jid }));
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
  }

  /* ===== estilos ===== */
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "16px" };
  const h1 = { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" };
  const sub = { margin: "0 0 10px", color: "#475569", fontSize: 15 };

  // Cabecera celeste con botón pequeño a la derecha
  const resumenCard = {
    margin:"0 0 14px",
    padding:"12px 14px",
    borderRadius:12,
    border:"1px solid #dbeafe",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    color:"#0f172a"
  };
  const resumeText = { margin: 0, fontSize: 19, fontWeight: 400, letterSpacing: "0.35px", lineHeight: 1.5 };

  const posHeader = {
    margin: "16px 0 10px",
    padding: "2px 4px 8px",
    fontWeight: 700,
    color: "#0c4a6e",
    borderLeft: "4px solid #7dd3fc",
    borderBottom: "2px solid #e2e8f0"
  };
  const card = (isOut) => ({
    position: "relative",
    border: isOut ? "2px solid rgba(220,38,38,.8)" : "1px solid #eef2ff",
    borderRadius: 16,
    padding: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    background: "#fff",
    cursor: isAdmin ? "pointer" : "default",
    outline: "none",
    userSelect: "none"
  });
  const frame = { width: "100%", height: 320, borderRadius: 12, overflow: "hidden", background: "#0b1e2a", display: "grid", placeItems: "center", border: "1px solid #e5e7eb", position: "relative" };
  const name = { margin: "8px 0 0", font: "700 15px/1.2 Montserrat, system-ui, sans-serif", color: "#0f172a", textAlign: "center" };
  const meta = { margin: "2px 0 0", color: "#475569", fontSize: 13, textAlign: "center" };

  // Dorsais 29,32,39 finos e gris
  const OVERLAY_SET = new Set([29, 32, 39]);
  const NumberOverlay = ({ dorsal }) => {
    if (!OVERLAY_SET.has(Number(dorsal))) return null;
    return (
      <span
        style={{
          position: "absolute",
          top: 8,
          left: 10,
          fontFamily: "Montserrat, system-ui, sans-serif",
          fontWeight: 600,
          fontSize: 36,
          lineHeight: 1,
          color: "#9aa4b2",
          textShadow: "0 1px 2px rgba(0,0,0,.25)",
          userSelect: "none",
          pointerEvents: "none",
          letterSpacing: "0.5px"
        }}
      >
        {dorsal}
      </span>
    );
  };

  // Ensombrecido centrado con degradado vermello suave
  const Shade = ({ show=false }) => show ? (
    <>
      <div style={{
        position:"absolute", inset:0,
        background:"rgba(2,6,23,.58)"
      }}/>
      <div style={{
        position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        padding:"10px 14px",
        borderRadius:999,
        fontWeight:800, fontSize:12, letterSpacing:.4, color:"#fff",
        background:"linear-gradient(180deg, rgba(248,113,113,.95), rgba(239,68,68,.85))",
        boxShadow:"0 10px 24px rgba(0,0,0,.25)"
      }}>
        DESCARTADO
      </div>
    </>
  ) : null;

  const SaveBtn = ({ small=false }) => (
    <button
      onClick={onConfirm}
      disabled={saving || !isAdmin}
      style={{
        width: small ? "auto" : "100%",
        padding: small ? "10px 12px" : "14px 16px",
        borderRadius: 14,
        background: "linear-gradient(180deg,#bae6fd,#7dd3fc)",
        color: "#0c4a6e",
        fontWeight: 800,
        border: "1px solid #38bdf8",
        cursor: saving || !isAdmin ? "not-allowed" : "pointer",
        boxShadow: small ? "0 6px 16px rgba(2,132,199,.20)" : "0 10px 22px rgba(2,132,199,.25)",
        whiteSpace: "nowrap"
      }}
      aria-label="Gardar convocatoria"
      title="Gardar convocatoria"
    >
      {saving ? "Gardando…" : "GARDAR CONVOCATORIA"}
    </button>
  );

  return (
    <main style={wrap}>
      <h1 style={h1}>Convocatoria oficial</h1>
      <p style={sub}>Lista de xogadores que poderían estar na aliñación para o seguinte partido.</p>

      {/* Cabecera resumida + botón pequeno á dereita */}
      {source ? (
        <div style={resumenCard} aria-label="Información do próximo partido">
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:10 }}>
            <div>
              <p style={resumeText}>{teamsLine}</p>
              <p style={{...resumeText, opacity:.9}}>{sFecha} | {sHora}</p>
            </div>
            {isAdmin && <SaveBtn small />}
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 15 }}>Non hai encontro próximo dispoñíbel.</p>
      )}

      {/* Bloques por posición (4 columnas, non mesturar) */}
      {(["POR","DEF","CEN","DEL"]).map((k) => {
        const arr = (grouped[k] || []);
        if (!arr.length) return null;
        const label = k === "POR" ? "Porteiros" : k === "DEF" ? "Defensas" : k === "CEN" ? "Medios" : "Dianteiros";
        return (
          <section key={k}>
            <div style={posHeader}>{label}</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:12 }}>
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
                        <>
                          <img
                            src={p.foto_url}
                            alt={`Foto de ${nombre}`}
                            style={{ width:"100%", height:"100%", objectFit:"contain", background:"#0b1e2a" }}
                            loading="lazy"
                            decoding="async"
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                          />
                          <NumberOverlay dorsal={dorsal} />
                          <Shade show={out} />
                        </>
                      ) : (
                        <div style={{ color:"#cbd5e1" }}>Sen foto</div>
                      )}
                    </div>
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

      {/* Botón grande abaixo */}
      {isAdmin && (
        <div style={{ marginTop: 16 }}>
          <SaveBtn />
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

      {/* Modal celeste propio */}
      {modal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(2,6,23,.45)", display:"grid", placeItems:"center", zIndex:1000
        }}>
          <div style={{
            width:"min(520px, 92vw)",
            background:"#fff",
            border:"1px solid #cfe8ff",
            borderRadius:16,
            boxShadow:"0 20px 40px rgba(0,0,0,.25)",
            overflow:"hidden"
          }}>
            <div style={{
              padding:"14px 16px",
              background:"linear-gradient(180deg, rgba(224,242,254,0.9), rgba(191,219,254,0.85))",
              borderBottom:"1px solid #bfdbfe",
              color:"#0f172a",
              fontWeight:800,
              letterSpacing:".2px"
            }}>
              {modal.title || "Información"}
            </div>
            <div style={{ padding:"14px 16px", color:"#0f172a" }}>
              <p style={{ margin:0, lineHeight:1.45 }}>{modal.body}</p>
            </div>
            <div style={{ padding:"12px 16px", display:"flex", gap:10, justifyContent:"flex-end", background:"#f8fafc", borderTop:"1px solid #e5e7eb" }}>
              {modal.onAction && (
                <button
                  onClick={modal.onAction}
                  style={{
                    padding:"10px 14px", borderRadius:12, fontWeight:800,
                    background:"linear-gradient(180deg,#bae6fd,#7dd3fc)", color:"#0c4a6e",
                    border:"1px solid #38bdf8", cursor:"pointer"
                  }}
                >
                  {modal.actionText || "Continuar"}
                </button>
              )}
              <button
                onClick={modal.onClose || (()=>setModal(null))}
                style={{
                  padding:"10px 14px", borderRadius:12, fontWeight:700,
                  background:"#fff", color:"#0f172a", border:"1px solid #e5e7eb", cursor:"pointer"
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
