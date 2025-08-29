// src/pages/ResultadosUltimaAlineacion.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { route } from "preact-router";

/**
 * Páxina fina que redirixe á vista existente de Clasificación:
 * /clasificacion?view=ultimo
 */
export default function ResultadosUltimaAlineacion() {
  useEffect(() => {
    route("/clasificacion?view=ultimo", true);
  }, []);
  return (
    <main style={{ padding: "1rem" }}>
      <p>Redirixindo á vista de <strong>Resultados da última aliñación</strong>…</p>
    </main>
  );
}
