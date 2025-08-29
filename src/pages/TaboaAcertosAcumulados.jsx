// src/pages/TaboaAcertosAcumulados.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { route } from "preact-router";

/**
 * Páxina fina que redirixe á vista existente de Clasificación:
 * /clasificacion?view=xeral
 */
export default function TaboaAcertosAcumulados() {
  useEffect(() => {
    route("/clasificacion?view=xeral", true);
  }, []);
  return (
    <main style={{ padding: "1rem" }}>
      <p>Redirixindo á <strong>Táboa de acertos acumulados</strong>…</p>
    </main>
  );
}
