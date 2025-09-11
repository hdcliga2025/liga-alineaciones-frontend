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

// Silueta fallback (SVG outline, en liña co estilo da app)
function Silhouette({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="16" r="8" stroke="#94a3b8" stroke-width="2" />
      <path d="M8 42a16 16 0 0 1 32 0" stroke="#94a3b8" stroke-width="2" />
    </svg>
  );
}

export default function HazTu11() {
  const [tab, setTab] = useState("ALL");
  const [q, setQ] = useState("");
  const [imgError, setImgError] = useState({});
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [encuentrosAbiertos, setEncuentrosAbiertos] = useState([]);
  const [encuentroSeleccionado, setEncuentroSeleccionado] = useState(null);
  const [convocatoria, setConvocatoria] = useState([]);
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState([]);

  // Obtener todos los jugadores de la base de datos
  useEffect(() => {
    const fetchJugadores = async () => {
      const { data, error } = await supabase
        .from('jugadores')
        .select('*')
        .order('dorsal', { ascending: true });

      if (!error) setJugadores(data);
      setLoading(false);
    };
    fetchJugadores();
  }, []);

  // Obtener encuentros abiertos para predicciones
  useEffect(() => {
    const fetchEncuentrosAbiertos = async () => {
      const { data, error } = await supabase
        .from('encuentros')
        .select('*')
        .order('fecha_hora', { ascending: true });

      if (!error) setEncuentrosAbiertos(data);
    };
    fetchEncuentrosAbiertos();
  }, []);

  // Obtener convocatoria cuando se selecciona un encuentro
  const handleSeleccionEncuentro = async (encuentroId) => {
    setEncuentroSeleccionado(encuentroId);
    setLoading(true);
    
    const { data, error } = await supabase
      .from('convocatorias')
      .select(`
        jugador_id,
        jugadores:jugador_id (id, nombre, dorsal, position, foto_url)
      `)
      .eq('partido_id', encuentroId);

    if (!error) {
      const jugadoresConvocados = data.map(item => item.jugadores);
      setConvocatoria(jugadoresConvocados);
      
      // Filtrar jugadores para mostrar solo los convocados
      const jugadoresFiltrados = jugadores.filter(jugador => 
        jugadoresConvocados.some(conv => conv.id === jugador.id)
      );
      setJugadores(jugadoresFiltrados);
    }
    setLoading(false);
  };

  // Manejar selección de jugadores
  const toggleJugador = (jugador) => {
    const alreadySelected = jugadoresSeleccionados.some(j => j.id === jugador.id);
    
    if (alreadySelected) {
      setJugadoresSeleccionados(prev => prev.filter(j => j.id !== jugador.id));
    } else if (jugadoresSeleccionados.length < 11) {
      setJugadoresSeleccionados(prev => [...prev, jugador]);
    }
  };

  // Enviar predicción
  const enviarPrediccion = async () => {
    const jugadoresIds = jugadoresSeleccionados.map(j => j.id);
    const user = (await supabase.auth.getUser()).data.user;

    const { error } = await supabase
      .from('alineaciones_predicciones')
      .insert({
        partido_id: encuentroSeleccionado,
        jugadores_ids: jugadoresIds,
        user_id: user.id
      });

    if (error) {
      console.error('Error enviando predicción:', error);
      alert('Erro ao enviar a predicción');
    } else {
      alert('Predicción enviada correctamente!');
      setJugadoresSeleccionados([]);
    }
  };

  // Filtrar jugadores por posición y búsqueda
  const filtered = useMemo(() => {
    const byPos = tab === "ALL" ? jugadores : jugadores.filter(p => p.position === tab);
    const query = (q || "").trim().toLowerCase();
    if (!query) return byPos;
    return byPos.filter(p =>
      `${p.dorsal} ${p.nombre}`.toLowerCase().includes(query)
    );
  }, [tab, q, jugadores]);

  // --- estilos inline ---
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "16px" };
  const h1 = {
    fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    fontSize: 24, margin: "6px 0 2px", color: "#0f172a"
  };
  const sub = { margin: "0 0 12px", color: "#475569", fontSize: 14 };
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
  const search = {
    flex: 1, padding: "10px 12px", borderRadius: 14,
    border: "1px solid #e5e7eb", outline: "none",
    fontSize: 14
  };
  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12
  };
  const card = (seleccionado) => ({
    display: "grid", gridTemplateColumns: "72px 1fr", gap: 10, alignItems: "center",
    background: seleccionado ? "#e3f2fd" : "#fff",
    border: seleccionado ? "2px solid #2196f3" : "1px solid #eef2ff",
    borderRadius: 16,
    padding: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    cursor: "pointer",
    transition: "all 0.2s ease"
  });
  const avatarBox = {
    width: 72, height: 72, borderRadius: 14,
    display: "grid", placeItems: "center",
    background: "linear-gradient(180deg,#f8fafc,#eef2ff)",
    border: "1px solid #e5e7eb", overflow: "hidden"
  };
  const name = { margin: 0, font: "700 15px/1.2 Montserrat, system-ui, sans-serif", color: "#0f172a" };
  const meta = { margin: "4px 0 0", color: "#475569", fontSize: 13 };

  // Selector de encuentro
  const selectorEncuentro = {
    marginBottom: '20px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    width: '100%',
    fontSize: '16px'
  };

  // Responsivo
  if (typeof window !== "undefined" && window.innerWidth >= 560) {
    grid.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  }
  if (typeof window !== "undefined" && window.innerWidth >= 960) {
    grid.gridTemplateColumns = "repeat(4, minmax(0, 1fr))";
  }

  if (loading) return <main style={wrap}>Cargando…</main>;

  return (
    <main style={wrap}>
      <h1 style={h1}>Fai o teu 11</h1>
      <p style={sub}>Selecciona un partido e elixe os 11 xogadores titulares</p>

      {/* Selector de encuentro */}
      <select 
        onChange={(e) => handleSeleccionEncuentro(e.target.value)}
        style={selectorEncuentro}
        value={encuentroSeleccionado || ''}
      >
        <option value="">Selecciona un partido</option>
        {encuentrosAbiertos.map(encuentro => (
          <option key={encuentro.id} value={encuentro.id}>
            {encuentro.titulo} - {new Date(encuentro.fecha_hora).toLocaleDateString('gl-ES')}
          </option>
        ))}
      </select>

      {encuentroSeleccionado && (
        <>
          {/* Tabs posición */}
          <div style={tabs} role="tablist" aria-label="Filtrar por posición">
            {POS_TABS.map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                style={tabBtn(tab === t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Busca */}
          <div style={searchRow}>
            <input
              type="search"
              placeholder="Buscar por nome ou dorsal…"
              value={q}
              onInput={(e) => setQ(e.currentTarget.value)}
              style={search}
              aria-label="Buscar xogadores"
            />
          </div>

          {/* Contador de seleccionados */}
          <div style={{ marginBottom: '15px', fontWeight: 'bold', color: '#0c4a6e' }}>
            Xogadores seleccionados: {jugadoresSeleccionados.length}/11
          </div>

          {/* Grid xogadores */}
          <section style={grid} aria-live="polite">
            {filtered.map((p) => {
              const isSelected = jugadoresSeleccionados.some(j => j.id === p.id);
              return (
                <article 
                  key={p.id} 
                  style={card(isSelected)}
                  onClick={() => toggleJugador(p)}
                >
                  <div style={avatarBox}>
                    {p.foto_url ? (
                      <img
                        src={p.foto_url}
                        alt={`Foto de ${p.nombre}`}
                        width={72}
                        height={72}
                        decoding="async"
                        loading="lazy"
                        onError={() => setImgError((m) => ({ ...m, [p.foto_url]: true }))}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Silhouette />
                    )}
                  </div>
                  <div>
                    <p style={name}>
                      {p.dorsal != null ? `${String(p.dorsal).padStart(2,"0")} · ` : ""}{p.nombre}
                    </p>
                    <p style={meta}>{p.position}</p>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Botón de envío */}
          {jugadoresSeleccionados.length > 0 && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={enviarPrediccion}
                disabled={jugadoresSeleccionados.length !== 11}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: jugadoresSeleccionados.length === 11 ? '#007bff' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: jugadoresSeleccionados.length === 11 ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
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