import { h } from "preact";
import { Link } from "preact-router";

// ⚠️ De momento estático para probar la navegación.
// Solo partidos onde participa o Celta.
const partidosDemo = [
  {
    id: "1",
    local: "Mallorca",
    visitante: "Celta",
    competicion: "A Liga",
    // 23 agosto 2025, 17:00
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

export default function Partidos() {
  return (
    <div class="container">
      <h1 class="title">Partidos do Celta</h1>

      <ul class="list">
        {partidosDemo.map((p) => (
          <li key={p.id} class="card">
            <div class="card-body">
              <div class="card-title">
                {p.local} — {p.visitante}
              </div>
              <div class="card-meta">
                <span>Competición: {p.competicion}</span>
                <span>Data e hora: {new Date(p.fechaISO).toLocaleString()}</span>
              </div>
              <div class="card-actions">
                <Link href={`/partidos/${p.id}`} class="btn btn-secondary">
                  Ver detalle
                </Link>
                <Link href={`/partidos/${p.id}/alin`} class="btn">
                  Fai a túa aliñación
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
