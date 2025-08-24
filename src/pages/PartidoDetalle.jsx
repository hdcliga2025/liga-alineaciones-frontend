import { h } from "preact";
import { Link } from "preact-router";

// Misma fonte de datos de proba (en real vén de Supabase)
const partidosDemo = [
  {
    id: "1",
    local: "Mallorca",
    visitante: "Celta",
    competicion: "A Liga",
    fechaISO: "2025-08-23T17:00:00",
  },
  {
    id: "2",
    local: "Celta",
    visitante: "Betis",
    competicion: "A Liga",
    fechaISO: "2025-09-01T19:30:00",
  },
  {
    id: "3",
    local: "Celta",
    visitante: "AZ Alkmaar",
    competicion: "Europa League",
    fechaISO: "2025-09-18T21:00:00",
  },
];

export default function PartidoDetalle({ id }) {
  const partido = partidosDemo.find((p) => p.id === id);

  if (!partido) {
    return (
      <div class="container">
        <h1 class="title">Partido non atopado</h1>
        <Link href="/partidos" class="btn">Volver aos partidos</Link>
      </div>
    );
  }

  return (
    <div class="container">
      <h1 class="title">
        {partido.local} — {partido.visitante}
      </h1>
      <p class="subtitle">Competición: {partido.competicion}</p>
      <p class="subtitle">Data e hora: {new Date(partido.fechaISO).toLocaleString()}</p>

      <div class="grid-2">
        <div class="panel">
          <h2 class="panel-title">Convocatoria (imaxe)</h2>
          <div class="placeholder">
            Aquí vai a imaxe da convocatoria (lado esquerdo).
          </div>
        </div>

        <div class="panel">
          <h2 class="panel-title">Xogadores (28 slots)</h2>
          <div class="placeholder">
            Aquí irá a grella cos 28 xogadores (foto, dorsal, posición).
          </div>
          <div class="mt">
            <Link href={`/partidos/${partido.id}/alin`} class="btn">
              Fai a túa aliñación
            </Link>
          </div>
        </div>
      </div>

      <div class="mt">
        <Link href="/partidos" class="btn btn-secondary">← Volver á lista</Link>
      </div>
    </div>
  );
}
