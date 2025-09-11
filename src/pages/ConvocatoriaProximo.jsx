import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const POSICIONES = {
  POR: "PORTEIROS",
  DEF: "DEFENSAS", 
  MED: "CENTROCAMPISTAS",
  DEL: "DELANTEROS"
};

// Función optimizada para nombres de archivo
const generarNombreArchivo = (jugador) => {
  try {
    const nombreNormalizado = jugador.nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    return `${jugador.dorsal}-${nombreNormalizado}-${jugador.posicion}.jpg`;
  } catch (error) {
    return `${jugador.dorsal}.jpg`;
  }
};

// Manejador de errores de imagen optimizado
const handleImageError = (e, jugador) => {
  e.target.src = `https://fotos-celta-2025.vercel.app/${jugador.dorsal}.jpg`;
  e.target.onerror = () => {
    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='20' fill='%23e5e7eb'/%3E%3C/svg%3E";
    e.target.onerror = null;
  };
};

export default function ConvocatoriaProximo() {
  const [jugadores, setJugadores] = useState([]);
  const [convocados, setConvocados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [proximoPartido, setProximoPartido] = useState(null);

  // Precargar imágenes para mejor rendimiento
  useEffect(() => {
    if (jugadores.length > 0) {
      jugadores.forEach(jugador => {
        if (jugador.dorsal) {
          const img = new Image();
          img.src = `https://fotos-celta-2025.vercel.app/${generarNombreArchivo(jugador)}`;
        }
      });
    }
  }, [jugadores]);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        // Verificar si es admin
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email === 'hdcliga@gmail.com' || user?.email === 'hdcliga2@gmail.com') {
          setIsAdmin(true);
        }

        // Cargar jugadores
        const { data: jugadoresData } = await supabase
          .from('jugadores')
          .select('*')
          .order('dorsal', { ascending: true });

        setJugadores(jugadoresData || []);

        // Cargar próximo partido
        const { data: partidoData } = await supabase
          .from('next_match')
          .select('*')
          .eq('id', 1)
          .single();

        setProximoPartido(partidoData);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleConvocado = (jugador) => {
    if (!isAdmin) return;
    
    setConvocados(prev => 
      prev.includes(jugador.id) 
        ? prev.filter(id => id !== jugador.id)
        : [...prev, jugador.id]
    );
  };

  const guardarConvocatoria = async () => {
    if (!isAdmin || convocados.length === 0) return;

    try {
      const partidoId = proximoPartido?.uuid_id;
      
      if (!partidoId) {
        alert('Error: No hay partido configurado');
        return;
      }

      const convocatoriaInserts = convocados.map(jugadorId => ({
        partido_id: partidoId,
        jugador_id: jugadorId
      }));

      const { error } = await supabase
        .from('convocatorias')
        .insert(convocatoriaInserts);

      if (error) throw error;

      alert(`✅ Convocatoria gardada con ${convocados.length} xogadores`);
      setConvocados([]);

    } catch (error) {
      console.error('Error saving convocatoria:', error);
      alert('❌ Erro ao gardar a convocatoria');
    }
  };

  if (loading) return <div style={{ padding: "72px 16px", textAlign: "center" }}>Cargando...</div>;

  return (
    <main style={{ padding: "72px 16px 24px", maxWidth: 1200, margin: "0 auto" }}>
      {/* TÍTULO Y LEYENDA */}
      <h1 style={{ fontFamily: "Montserrat, system-ui", fontWeight: 700, fontSize: 28, marginBottom: 8 }}>
        Convocatoria
      </h1>
      <p style={{ fontFamily: "Montserrat, system-ui", color: "#64748b", marginBottom: 32 }}>
        Xogadores pre-seleccionados para o próximo partido
      </p>

      {/* INFORMACIÓN DEL PRÓXIMO PARTIDO */}
      {proximoPartido && (
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 20,
          marginBottom: 32,
          fontFamily: "Montserrat, system-ui"
        }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#0f172a", fontSize: 18 }}>
            {proximoPartido.team1} vs {proximoPartido.team2}
          </h3>
          <p style={{ margin: "4px 0", color: "#475569" }}>
            <strong>Competición:</strong> {proximoPartido.competition}
          </p>
          <p style={{ margin: "4px 0", color: "#475569" }}>
            <strong>Lugar:</strong> {proximoPartido.venue}
          </p>
          <p style={{ margin: "4px 0", color: "#475569" }}>
            <strong>Data:</strong> {new Date(proximoPartido.kickoff_utc).toLocaleDateString('gl-ES')}
          </p>
          <p style={{ margin: "4px 0", color: "#475569" }}>
            <strong>Hora:</strong> {new Date(proximoPartido.kickoff_utc).toLocaleTimeString('gl-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}

      {/* JUGADORES POR POSICIÓN */}
      {isAdmin && Object.entries(POSICIONES).map(([key, label]) => {
        const jugadoresPosicion = jugadores.filter(j => j.posicion === key);
        if (jugadoresPosicion.length === 0) return null;
        
        return (
          <div key={key} style={{ marginBottom: 32 }}>
            <h2 style={{
              fontFamily: "Montserrat, system-ui",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: 16,
              borderBottom: "2px solid #0ea5e9",
              paddingBottom: 4
            }}>
              {label}
            </h2>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12
            }}>
              {jugadoresPosicion.map(jugador => (
                <div
                  key={jugador.id}
                  onClick={() => toggleConvocado(jugador)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    border: convocados.includes(jugador.id) 
                      ? "3px solid #ef4444" 
                      : "1px solid #e5e7eb",
                    borderRadius: 8,
                    background: convocados.includes(jugador.id) ? "#fef2f2" : "#fff",
                    cursor: isAdmin ? "pointer" : "default",
                    transition: "all 0.2s"
                  }}
                >
                  <img
                    src={`https://fotos-celta-2025.vercel.app/${generarNombreArchivo(jugador)}`}
                    alt={jugador.nombre}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 8,
                      objectFit: "cover"
                    }}
                    onError={(e) => handleImageError(e, jugador)}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontFamily: "Montserrat, system-ui" }}>
                      {jugador.nombre}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 14, fontFamily: "Montserrat, system-ui" }}>
                      #{jugador.dorsal} • {jugador.posicion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* BOTÓN GUARDAR */}
      {isAdmin && convocados.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <button
            onClick={guardarConvocatoria}
            style={{
              width: "100%",
              padding: "16px",
              background: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              fontFamily: "Montserrat, system-ui"
            }}
          >
            GARDAR CONVOCATORIA ({convocados.length} xogadores)
          </button>
          
          <p style={{ 
            textAlign: "center", 
            color: "#64748b", 
            marginTop: 12,
            fontFamily: "Montserrat, system-ui" 
          }}>
            Os xogadores seleccionados desaparecerán da lista após gardar
          </p>
        </div>
      )}

      {!isAdmin && (
        <div style={{ 
          textAlign: "center", 
          padding: 40, 
          color: "#64748b",
          fontFamily: "Montserrat, system-ui" 
        }}>
          ⚠️ Solo os administradores poden xestionar a convocatoria
        </div>
      )}
    </main>
  );
}