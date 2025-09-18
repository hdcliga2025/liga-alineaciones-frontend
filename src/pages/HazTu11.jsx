// src/pages/HazTu11.jsx
import { h } from "preact";
import { useMemo, useState, useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const POS_TABS = [
  { key: "ALL",  label: "Todos" },
  { key: "POR",  label: "Porteiros" },
  { key: "DEF",  label: "Defensas" },
  { key: "CEN",  label: "Medios" },
  { key: "DEL",  label: "Dianteiros" },
];

function Silhouette({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="16" r="8" stroke="#94a3b8" strokeWidth="2" />
      <path d="M8 42a16 16 0 0 1 32 0" stroke="#94a3b8" strokeWidth="2" />
    </svg>
  );
}

function safeDecode(s = "") {
  try { return decodeURIComponent(s); }
  catch { return s.replace(/%20/g, " "); }
}

// NN-Nombre-POR|DEF|CEN|DEL.(jpg|jpeg|png|webp)
function parseFromFilename(url = "") {
  try {
    const last = (url.split("?")[0].split("#")[0].split("/").pop() || "").trim();
    const m = last.match(/^(\d+)-(.+)-(POR|DEF|CEN|DEL)\.(jpg|jpeg|png|webp)$/i);
    if (!m) return { dorsalFile: null, nameFile: null, posFile: null };
    const dorsal = parseInt(m[1], 10);
    const rawName = m[2].replace(/_/g, " ").trim();
    const name = safeDecode(rawName);
    const pos = m[3].toUpperCase();
    return { dorsalFile: dorsal, nameFile: name, posFile: pos };
  } catch {
    return { dorsalFile: null, nameFile: null, posFile: null };
  }
}

function canonPosBD(val = "") {
  const s = String(val).trim().toUpperCase();
  if (["POR","PORTERO","PORTEROS","PORTEIRO","PORTEIROS","GK"].includes(s)) return "POR";
  if (["DEF","DEFENSA","DEFENSAS","DF","LATERAL","CENTRAL"].includes(s)) return "DEF";
  if (["CEN","MED","MEDIO","MEDIOS","MC","MCD","MCO","CENTROCAMPISTA","CENTROCAMPISTAS"].includes(s)) return "CEN";
  if (["DEL","DELANTERO","DELANTEROS","FW","DC","EXTREMO","PUNTA"].includes(s)) return "DEL";
  return null;
}

// fichero > BD
function finalFromAll(p = {}) {
  const { dorsalFile, nameFile, posFile } = parseFromFilename(p.foto_url || "");
  const dorsal = dorsalFile != null ? dorsalFile : (p.dorsal ?? null);
  const pos = posFile || canonPosBD(p.position || "") || "";
  const nombre = (nameFile || p.nombre || "").trim();
  return { dorsal, pos, nombre };
}

// Overlays
const OVERLAY_SET = new Set([29, 32, 39, 16, 12, 4]);
const NEEDS_MASK   = new Set([4]);
const IMG_H = 320;

function ImgWithOverlay({ src, alt, dorsal }) {
  const showNumber = OVERLAY_SET.has(Number(dorsal));
  const showMask   = NEEDS_MASK.has(Number(dorsal));
  const displayNumber = Number(dorsal) === 4 ? "4" : String(dorsal ?? "").padStart(2, "0");

  return (
    <div style={{
      position:"relative",
      width:"100%", height: IMG_H,
      borderRadius:12, display:"grid", placeItems:"center",
      background:"#f8fafc", border:"1px solid #e5e7eb", overflow:"hidden"
    }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          style={{ width:"100%", height:"100%", objectFit:"contain", background:"#0b1e2a" }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      ) : (
        <Silhouette size={120} />
      )}

      {showMask && (
        <div style={{
          position:"absolute", top: 8, left: 8,
          width: 88, height: 62, background: "#0b1e2a", opacity: 0.98, borderRadius: 8
        }}/>
      )}

      {showNumber && dorsal != null && (
        <span style={{
          position:"absolute", top: 18, left: 24,
          fontFamily:"Montserrat, system-ui, sans-serif",
          fontWeight: 700, fontSize: 52, lineHeight: 1,
          color: "#9aa4b2",
          WebkitTextStroke: "0.35px rgba(0,0,0,0.15)",
          textShadow:"0 1px 2px rgba(0,0,0,.22), 0 0 8px rgba(0,0,0,.16)",
          letterSpacing:"1px", userSelect:"none"
        }}>
          {displayNumber}
        </span>
      )}
    </div>
  );
}

export default function HazTu11() {
  const view = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("view")
    : null;
  const isConvocatoria = view === "convocatoria";

  const [tab, setTab] = useState("ALL");
  const [q, setQ] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [encuentrosAbiertos, setEncuentrosAbiertos] = useState([]);
  const [encuentroSeleccionado, setEncuentroSeleccionado] = useState(null);
  const [convocatoria, setConvocatoria] = useState([]);
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState([]);

  // 🔹 Marco informativo (convocatoria): Vindeiros #1 → next_match
  const [topVindeiro, setTopVindeiro] = useState(null); // {equipo1,equipo2,match_iso}
  const [nextMatch, setNextMatch] = useState(null);     // {equipo1,equipo2,match_iso}

  function fmtDT(iso) {
    try {
      const d = new Date(iso);
      const fecha = d.toLocaleDateString("gl-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
      const hora  = d.toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" });
      return { fecha, hora };
    } catch {
      return { fecha: "-", hora: "-" };
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('jugadores')
          .select('*')
          .order('dorsal', { ascending: true });
        if (error) throw error;
        setJugadores(data || []);
      } catch (e) {
        console.error("load jugadores:", e);
        setJugadores([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isConvocatoria) {
      (async () => {
        try {
          const { data: top } = await supabase
            .from("matches_vindeiros")
            .select("equipo1,equipo2,match_iso")
            .order("match_iso", { ascending: true })
            .limit(1)
            .maybeSingle();
          setTopVindeiro(top || null);

          const { data: nm } = await supabase
            .from("next_match")
            .select("equipo1,equipo2,match_iso")
            .eq("id", 1)
            .maybeSingle();
          setNextMatch(nm || null);
        } catch (e) {
          console.error("marco informativo:", e);
        }
      })();
    }
  }, [isConvocatoria]);

  useEffect(() => {
    if (isConvocatoria) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('encuentros')
          .select('*')
          .order('fecha_hora', { ascending: true });
        if (error) throw error;
        setEncuentrosAbiertos(data || []);
      } catch (e) {
        console.error("load encuentros:", e);
        setEncuentrosAbiertos([]);
      }
    })();
  }, [isConvocatoria]);

  const handleSeleccionEncuentro = async (encuentroId) => {
    setEncuentroSeleccionado(encuentroId);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('convocatorias')
        .select(`
          jugador_id,
          jugadores:jugador_id (id, nombre, dorsal, position, foto_url)
        `)
        .eq('partido_id', encuentroId);
      if (error) throw error;

      const jugadoresConvocados = (data || []).map(item => item.jugadores).filter(Boolean);
      setConvocatoria(jugadoresConvocados);

      // Mostrar só os convocados
      const jugadoresFiltrados = (jugadores || []).filter(j =>
        jugadoresConvocados.some(c => c && c.id === j.id)
      );
      setJugadores(jugadoresFiltrados);
    } catch (e) {
      console.error("load convocatoria:", e);
      setConvocatoria([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleJugador = (jugador) => {
    const already = jugadoresSeleccionados.some(j => j.id === jugador.id);
    if (already) setJugadoresSeleccionados(prev => prev.filter(j => j.id !== jugador.id));
    else if (jugadoresSeleccionados.length < 11) setJugadoresSeleccionados(prev => [...prev, jugador]);
  };

  const enviarPrediccion = async () => {
    try {
      const jugadoresIds = jugadoresSeleccionados.map(j => j.id);
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userData?.user;
      if (!user || !user.id) throw new Error("Sesión non válida");

      if (!encuentroSeleccionado) {
        alert("Escolle primeiro un partido.");
        return;
      }
      if (jugadoresIds.length !== 11) {
        alert("Debes escoller exactamente 11 xogadores.");
        return;
      }

      const { error } = await supabase
        .from('alineaciones_predicciones')
        .insert({ partido_id: encuentroSeleccionado, jugadores_ids: jugadoresIds, user_id: user.id });

      if (error) throw error;
      alert('Predicción enviada correctamente!');
      setJugadoresSeleccionados([]);
    } catch (e) {
      console.error("enviarPrediccion:", e);
      alert('Erro ao enviar a predicción');
    }
  };

  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "16px" };
  const h1 = { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" };
  const sub = { margin: "0 0 12px", color: "#475569", fontSize: 14 };

  // ===== VISTA CONVOCATORIA =====
  if (isConvocatoria) {
    const grouped = useMemo(() => {
      try {
        const g = { POR: [], DEF: [], CEN: [], DEL: [] };
        for (const p of jugadores || []) {
          const { pos } = finalFromAll(p);
          if (pos && g[pos]) g[pos].push(p);
        }
        return g;
      } catch (e) {
        console.error("group convocatoria:", e);
        return { POR: [], DEF: [], CEN: [], DEL: [] };
      }
    }, [jugadores]);

    const posHeader = { margin: "16px 0 10px", padding: "2px 4px", fontWeight: 700, color: "#0c4a6e", borderLeft: "4px solid #7dd3fc" };
    const grid3 = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 };
    const card = { display: "grid", gridTemplateRows: `${IMG_H}px auto`, background: "#fff", border: "1px solid #eef2ff", borderRadius: 16, padding: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)", alignItems: "center", textAlign: "center" };
    const name = { margin: "8px 0 0", font: "700 15px/1.2 Montserrat, system-ui, sans-serif", color: "#0f172a" };
    const meta = { margin: "2px 0 0", color: "#475569", fontSize: 13 };

    // 🔹 Marco informativo (fuente: topVindeiro → nextMatch)
    const src = topVindeiro || nextMatch;
    const teamsLine = src ? `${(src.equipo1 || "—").toUpperCase()} vs ${(src.equipo2 || "—").toUpperCase()}` : null;
    const { fecha: mFecha, hora: mHora } = fmtDT(src?.match_iso);
    const resumenBox = {
      margin: "0 0 14px",
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px solid #dbeafe",
      background: "#f8fafc",
      color: "#0f172a",
      fontSize: 15,
      lineHeight: 1.25
    };
    const resumeLine = { margin: 0 };
    const bold = { fontWeight: 800 };

    if (loading) return <main style={wrap}>Cargando…</main>;

    return (
      <main style={wrap}>
        <h1 style={h1}>Convocatoria oficial</h1>
        <p style={{ ...sub, fontSize: 15 }}>
          Lista de xogadores que poderían estar na aliñación para o seguinte partido.
        </p>

        {/* Marco informativo baixo o subtítulo */}
        {src ? (
          <div style={resumenBox} aria-label="Información do próximo partido">
            <p style={resumeLine}><span style={bold}>{teamsLine}</span></p>
            <p style={resumeLine}><span style={bold}>{mFecha}</span> | <span style={bold}>{mHora}</span></p>
          </div>
        ) : null}

        {["POR","DEF","CEN","DEL"].map((k) => {
          const arr = grouped[k] || [];
          if (!arr.length) return null;
          const label = k === "POR" ? "Porteiros" : k === "DEF" ? "Defensas" : k === "CEN" ? "Medios" : k === "DEL" ? "Dianteiros" : k;
          return (
            <section key={k}>
              <div style={posHeader}>{label}</div>
              <div style={grid3}>
                {arr.map((p) => {
                  const { dorsal, pos, nombre } = finalFromAll(p);
                  return (
                    <article key={p.id} style={card}>
                      <ImgWithOverlay src={p.foto_url} alt={`Foto de ${nombre}`} dorsal={dorsal} />
                      <div>
                        <p style={name}>
                          {dorsal != null ? `${String(dorsal).padStart(2,"0")} · ` : ""}{nombre}
                        </p>
                        <p style={meta}>{pos}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    );
  }

  // ===== VISTA NORMAL (sin cambios relevantes)
  const tabs = { display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0 14px" };
  const tabBtn = (active) => ({
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: active ? "linear-gradient(180deg,#bae6fd,#7dd3fc)" : "#fff",
    color: active ? "#0c4a6e" : "#0f172a",
    fontWeight: 700, cursor: "pointer", boxShadow: active ? "0 8px 22px rgba(2,132,199,.25)" : "0 4px 12px rgba(0,0,0,.06)"
  });
  const searchRow = { display: "flex", gap: 10, alignItems: "center", marginBottom: 12 };
  const search = { flex: 1, padding: "10px 12px", borderRadius: 14, border: "1px solid #e5e7eb", outline: "none", fontSize: 14 };
  const grid = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 };
  const card2 = (seleccionado) => ({
    display: "grid", gridTemplateColumns: `${IMG_H}px 1fr`, gap: 10, alignItems: "center",
    background: seleccionado ? "#e3f2fd" : "#fff",
    border: seleccionado ? "2px solid #2196f3" : "1px solid #eef2ff",
    borderRadius: 16,
    padding: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    cursor: "pointer",
    transition: "all 0.2s ease"
  });
  const name2 = { margin: 0, font: "700 15px/1.2 Montserrat, system-ui, sans-serif", color: "#0f172a" };
  const meta2 = { margin: "4px 0 0", color: "#475569", fontSize: 13 };
  const selectorEncuentro = { marginBottom: '20px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', width: '100%', fontSize: '16px' };

  if (typeof window !== "undefined" && window.innerWidth >= 560) grid.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
  if (typeof window !== "undefined" && window.innerWidth >= 960) grid.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";

  const jugadoresFiltrados = useMemo(() => {
    try {
      const byPos = tab === "ALL" ? jugadores : (jugadores || []).filter(p => finalFromAll(p).pos === tab);
      const query = (q || "").trim().toLowerCase();
      if (!query) return byPos;
      return byPos.filter(p => {
        const { dorsal, nombre } = finalFromAll(p);
        return `${dorsal ?? ""} ${nombre}`.toLowerCase().includes(query);
      });
    } catch (e) {
      console.error("HazTu11 filter error:", e);
      return [];
    }
  }, [tab, q, jugadores]);

  if (loading) return <main style={wrap}>Cargando…</main>;

  return (
    <main style={wrap}>
      <h1 style={h1}>Fai o teu 11</h1>
      <p style={sub}>Selecciona un partido e elixe os 11 xogadores titulares</p>

      <select onChange={(e) => handleSeleccionEncuentro(e.target.value)} style={selectorEncuentro} value={encuentroSeleccionado || ''}>
        <option value="">Selecciona un partido</option>
        {encuentrosAbiertos.map(encuentro => (
          <option key={encuentro.id} value={encuentro.id}>
            {encuentro.titulo} - {new Date(encuentro.fecha_hora).toLocaleDateString('gl-ES')}
          </option>
        ))}
      </select>

      {encuentroSeleccionado && (
        <>
          <div style={tabs} role="tablist" aria-label="Filtrar por posición">
            {POS_TABS.map(t => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={searchRow}>
            <input type="search" placeholder="Buscar por nome ou dorsal…" value={q} onInput={(e) => setQ(e.currentTarget.value)} style={search} aria-label="Buscar xogadores" />
          </div>

          <div style={{ marginBottom: '15px', fontWeight: 'bold', color: '#0c4a6e' }}>
            Xogadores seleccionados: {jugadoresSeleccionados.length}/11
          </div>

          <section style={grid} aria-live="polite">
            {jugadoresFiltrados.map((p) => {
              const { dorsal, pos, nombre } = finalFromAll(p);
              const seleccionado = jugadoresSeleccionados.some(j => j.id === p.id);
              return (
                <article key={p.id} style={card2(seleccionado)} onClick={() => toggleJugador(p)}>
                  <ImgWithOverlay src={p.foto_url} alt={`Foto de ${nombre}`} dorsal={dorsal} />
                  <div>
                    <p style={name2}>
                      {dorsal != null ? `${String(dorsal).padStart(2,"0")} · ` : ""}{nombre}
                    </p>
                    <p style={meta2}>{pos}</p>
                  </div>
                </article>
              );
            })}
          </section>

          {jugadoresSeleccionados.length > 0 && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={enviarPrediccion}
                disabled={jugadoresSeleccionados.length !== 11}
                style={{ padding: '12px 24px', backgroundColor: jugadoresSeleccionados.length === 11 ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', cursor: jugadoresSeleccionados.length === 11 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '16px' }}
              >
                Enviar Aliñación ({jugadoresSeleccionados.length}/11)
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
