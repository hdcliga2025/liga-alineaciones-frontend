// src/pages/ConvocatoriaProximo.jsx
import { h, Component } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== ErrorBoundary local ===== */
class PageErrorBoundary extends Component {
  constructor(props){ super(props); this.state = { error: null }; }
  componentDidCatch(err){ this.setState({ error: err }); console.error("[Convocatoria] error:", err); }
  render(props, state){
    if (state.error) {
      return (
        <main style={{ maxWidth: 980, margin:"40px auto", padding:16, fontFamily:"Montserrat,system-ui,sans-serif", color:"#0f172a" }}>
          <h2 style={{ margin:"0 0 8px" }}>Produciuse un erro nesta páxina</h2>
          <p style={{ margin:"0 0 12px", color:"#475569" }}>Téntao de novo. Se persiste, avísanos.</p>
          <pre style={{ whiteSpace:"pre-wrap", background:"#fff7ed", border:"1px solid #ffedd5", padding:12, borderRadius:12, color:"#9a3412" }}>
            {String((state.error && state.error.stack) || state.error)}
          </pre>
        </main>
      );
    }
    return props.children;
  }
}

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
  return { dorsal: dorsalFile ?? (p.dorsal ?? null), pos: posFile || canonPos(p.posicion || p.position || ""), nombre: (nameFile || p.nombre || "").trim() };
}

/* ===== Páxina ===== */
function Page() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState([]);
  const [source, setSource]  = useState(null); // cabecera (vindeiros → next_match → null)
  const [convIds, setConvIds] = useState([]);  // ids YA convocados (si existía)
  const [discarded, setDiscarded] = useState(new Set()); // ids descartados por el admin (clic)
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  /* ===== init: permisos, cabecera y plantilla ===== */
  useEffect(() => {
    let alive = true;
    (async () => {
      // 1) ¿admin?
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

      // 2) cabecera (si hay algo en vindeiros, lo usamos; si no, next_match)
      const [topV, nm] = await Promise.all([
        supabase
          .from("matches_vindeiros")
          .select("equipo1,equipo2,match_iso")
          .order("match_iso", { ascending: true })
          .limit(1).maybeSingle(),
        supabase
          .from("next_match")
          .select("equipo1,equipo2,match_iso")
          .eq("id",1).maybeSingle()
      ]);
      const head =
        topV?.data ||
        nm?.data ||
        null;
      if (!alive) return;
      setSource(head);

      // 3) plantilla completa (pocos campos)
      const { data: js } = await supabase
        .from("jugadores")
        .select("id, nombre, dorsal, posicion, position, foto_url")
        .order("dorsal", { ascending: true });
      if (!alive) return;
      setPlayers(js || []);

      // 4) si YA había una convocatoria publicada → precargarla
      const { data: pub } = await supabase
        .from("convocatoria_publica")
        .select("jugador_id");
      const publicados = (pub || []).map(r => r.jugador_id);
      if (!alive) return;

      setConvIds(publicados);
      // OJO: todos activos por defecto.
      // Solo marcamos como descartados si EXISTE una publicación previa:
      if (admin && publicados.length) {
        const allIds = new Set((js || []).map(p => p.id));
        const convSet = new Set(publicados);
        const dif = new Set(Array.from(allIds).filter(id => !convSet.has(id)));
        setDiscarded(dif); // descartar los que NO estaban en la última publicación
      } else {
        setDiscarded(new Set()); // todos activos
      }
    })();
    return () => { alive = false; };
  }, []);

  /* ===== agrupado por posición ===== */
  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of players || []) {
      const info = finalFromAll(p);
      if (info.pos && g[info.pos]) g[info.pos].push({ ...p, ...info });
    }
    return g;
  }, [players]);

  /* ===== acciones ===== */
  const toggleDiscard = (id) => {
    if (!isAdmin) return;
    setDiscarded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const onConfirm = async () => {
    if (!isAdmin || !players?.length) return;

    if (!source?.equipo1 || !source?.equipo2 || !source?.match_iso) {
      // Criterio simple: si hay cabecera en esta página, hay partido abierto.
      // Si no la hay, avisamos bonito y celeste:
      alert("Non hai encabezado do encontro. Entra en Vindeiros/Próximo e estableceo.");
      return;
    }

    const ok1 = confirm("Vas gardar a convocatoria oficial para todas as persoas. Continuar?");
    if (!ok1) return;
    const ok2 = confirm("Estás segura/o? Isto substituirá a convocatoria publicada.");
    if (!ok2) return;

    setSaving(true);
    try {
      const allIds = players.map(p => p.id);
      const convocados = allIds.filter(id => !discarded.has(id)); // ACTIVO = non descartado

      // 1) escribe tabla pública simple (visible para todes)
      await supabase.from("convocatoria_publica").delete().neq("jugador_id", -1);
      if (convocados.length) {
        const rows = convocados.map(jid => ({ jugador_id: jid, updated_at: new Date().toISOString() }));
        const { error } = await supabase.from("convocatoria_publica").insert(rows);
        if (error) throw error;
      }

      // 2) feedback
      setToast("Convocatoria publicada");
      setTimeout(() => setToast(""), 2600);
    } catch (e) {
      console.error("save err:", e);
      setToast("Erro ao gardar");
      setTimeout(() => setToast(""), 2600);
    } finally { setSaving(false); }
  };

  /* ===== estilos ===== */
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "16px" };
  const h1 = { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" };
  const sub = { margin: "0 0 10px", color: "#475569", fontSize: 15 };

  // Marco informativo (celeste degradado) + botón
  const resumenBox = {
    margin: "0 0 14px",
    padding: "14px 14px",
    borderRadius: 14,
    border: "1px solid #cfe8ff",
    background: "linear-gradient(180deg, #e0f2fe, #b9e6fe)",
    color: "#0f172a",
  };
  const resumeTop = { display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:10 };
  const teams = { fontSize: 20, fontWeight: 600, letterSpacing: ".3px" };
  const line = { margin: "6px 0 0", fontSize: 16, color: "#0f172a" };
  const small = { fontWeight: 600, color: "#0f172a" };
  const miniBtn = {
    padding: "10px 14px",
    borderRadius: 12,
    background: "linear-gradient(180deg,#bae6fd,#7dd3fc)",
    color: "#0c4a6e",
    fontWeight: 800,
    border: "1px solid #38bdf8",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(2,132,199,.22)",
  };

  const posHeader = { margin: "18px 0 8px", padding: "2px 4px", fontWeight: 700, color: "#0c4a6e", borderLeft: "4px solid #7dd3fc" };
  const underline = { height:1, background:"#e2e8f0", margin:"10px 0 12px" };

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
  });
  const frame = { width: "100%", height: 320, borderRadius: 12, overflow: "hidden", background: "#0b1e2a", display: "grid", placeItems: "center", border: "1px solid #e5e7eb" };
  const name = { margin: "8px 0 0", font: "700 15px/1.2 Montserrat, system-ui, sans-serif", color: "#0f172a", textAlign: "center" };
  const meta = { margin: "2px 0 0", color: "#475569", fontSize: 13, textAlign: "center" };

  // Ensombrecido MUY visible
  const Cross = ({ show=false }) => show ? (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position:"absolute", inset:10, borderRadius:12, pointerEvents:"none" }}>
      <rect x="0" y="0" width="100" height="100" fill="rgba(220,38,38,.25)" rx="12" />
      <path d="M10 10 L90 90 M90 10 L10 90" stroke="rgba(220,38,38,.95)" strokeWidth="9" strokeLinecap="round" />
    </svg>
  ) : null;

  // Botón barra inferior (full width)
  const bottomBar = {
    position:"sticky", bottom:0, left:0, right:0,
    background:"linear-gradient(180deg,#e0f2fe,#b9e6fe)",
    borderTop:"1px solid #cfe8ff", padding:"12px 16px",
    marginTop:16,
  };
  const bigBtn = {
    display:"block", width:"100%", textAlign:"center",
    padding:"14px 16px", borderRadius:14,
    background:"linear-gradient(180deg,#bae6fd,#7dd3fc)",
    color:"#0c4a6e", fontWeight:800, border:"1px solid #38bdf8",
    cursor: saving ? "wait" : "pointer", boxShadow:"0 10px 22px rgba(2,132,199,.25)"
  };

  // Datos cabecera
  const teamsLine = source ? `${(source.equipo1 || "—").toUpperCase()} vs ${(source.equipo2 || "—").toUpperCase()}` : null;
  const { fecha: sFecha, hora: sHora } = fmtDT(source?.match_iso);

  return (
    <main style={wrap}>
      <h1 style={h1}>Convocatoria oficial</h1>
      <p style={sub}>Lista de xogadores que poderían estar na aliñación para o seguinte partido.</p>

      {/* Marco informativo + botón pequeno á dereita */}
      <div style={resumenBox} aria-label="Información do próximo partido">
        <div style={resumeTop}>
          <div>
            <div style={teams}>{teamsLine || "—"}</div>
            <div style={line}><span style={small}>{sFecha || "—"}</span> · <span style={small}>{sHora || "—"}</span></div>
          </div>
          {isAdmin && (
            <button onClick={onConfirm} disabled={saving} style={miniBtn} aria-label="Gardar convocatoria">
              {saving ? "Gardando…" : "Gardar convocatoria"}
            </button>
          )}
        </div>
      </div>

      {/* POR/DEF/CEN/DEL: cabeceira + subliñado + grillas de 4 */}
      {(["POR","DEF","CEN","DEL"]).map((k) => {
        const arr = (grouped[k] || []);
        if (!arr.length) return null;
        const label = k === "POR" ? "Porteiros" : k === "DEF" ? "Defensas" : k === "CEN" ? "Medios" : "Dianteiros";
        return (
          <section key={k}>
            <div style={posHeader}>{label}</div>
            <div style={underline} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(0, 1fr))", gap: 12 }}>
              {arr.map((p) => {
                const out = discarded.has(p.id);
                // número de dorsal fino y gris claro
                const overlayNum = p.dorsal != null ? (
                  <span style={{
                    position:"absolute", top:8, left:10,
                    fontWeight:800, fontSize:26, color:"#a3aab5",
                    textShadow:"0 1px 2px rgba(0,0,0,.35)", letterSpacing:"1px",
                    userSelect:"none"
                  }}>{String(p.dorsal).padStart(2,"0")}</span>
                ) : null;

                return (
                  <article
                    key={p.id}
                    style={card(out)}
                    onClick={() => toggleDiscard(p.id)}
                    aria-pressed={out ? "true" : "false"}
                    title={isAdmin ? (out ? "Descartado (clic para restaurar)" : "Clic para descartar") : undefined}
                  >
                    <div style={{ ...frame, position:"relative" }}>
                      {p.foto_url ? (
                        <img
                          src={p.foto_url}
                          alt={`Foto de ${p.nombre}`}
                          style={{ width:"100%", height:"100%", objectFit:"cover" }}
                          loading="lazy"
                          decoding="async"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div style={{ color:"#cbd5e1" }}>Sen foto</div>
                      )}
                      {overlayNum}
                    </div>

                    <Cross show={out} />
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

      {/* barra inferior “GARDAR CONVOCATORIA” */}
      {isAdmin && (
        <div style={bottomBar}>
          <button onClick={onConfirm} disabled={saving} style={bigBtn} aria-label="Gardar convocatoria">
            {saving ? "Gardando…" : "GARDAR CONVOCATORIA"}
          </button>
        </div>
      )}

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

/* ===== Export ===== */
export default function ConvocatoriaProximo() {
  return (
    <PageErrorBoundary>
      <Page />
    </PageErrorBoundary>
  );
}
