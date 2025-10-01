// src/components/PageLoader.jsx
import { h } from "preact";

/* Comentario técnico (castellano):
   Loader ultraligero para usar como fallback de <Suspense> y en cambios de ruta.
   - Cero dependencias, sólo CSS inline.
   - No crea estado ni hooks → no re-renderiza innecesariamente.
   - Minimiza “pantallas en blanco” durante la carga de chunks (code-splitting).
   UI en galego. */

export default function PageLoader() {
  const wrap = {
    maxWidth: 960,
    margin: "56px auto 0",
    padding: "16px",
  };
  const sk = {
    background: "linear-gradient(90deg, #f1f5f9 0%, #eef2ff 50%, #f1f5f9 100%)",
    backgroundSize: "200% 100%",
    animation: "shine 1.2s ease-in-out infinite",
    borderRadius: 12,
  };

  return (
    <main style={wrap} aria-label="A cargar...">
      <style>
        {`@keyframes shine { 0%{background-position:0% 0} 100%{background-position:200% 0} }`}
      </style>
      <div style={{ ...sk, height: 18, width: 220, marginBottom: 14 }} />
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ ...sk, height: 72 }} />
        <div style={{ ...sk, height: 72 }} />
        <div style={{ ...sk, height: 72 }} />
      </div>
    </main>
  );
}
