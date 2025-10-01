// src/components/VersionChecker.jsx
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

/* Comentario técnico:
   - Aprovecha que en Vercel tienes index.html con Cache-Control: no-store.
   - Consulta "/" periódicamente cuando la pestaña está visible.
   - Si el HTML cambia (hash distinto), muestra un banner para recargar.
   - Sin SW ni complejidad: robusto y simple.
*/

async function hashText(t) {
  const msgUint8 = new TextEncoder().encode(t);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function VersionChecker() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const lastHashRef = useRef("");

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch("/", { cache: "no-store" });
        const html = await res.text();
        const hash = await hashText(html);
        if (!alive) return;

        if (!lastHashRef.current) {
          lastHashRef.current = hash; // primera referencia en esta sesión
        } else if (hash && lastHashRef.current && hash !== lastHashRef.current) {
          setHasUpdate(true);
        }
      } catch {}
    };

    const loop = () => { if (!document.hidden) check(); };

    check();
    const id = setInterval(loop, 60000);
    const onVis = () => { if (!document.hidden) check(); };
    document.addEventListener("visibilitychange", onVis);

    return () => { alive = false; clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  if (!hasUpdate) return null;

  const bar = {
    position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 99999,
    background: "linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    border: "1px solid #bae6fd", color: "#0c4a6e",
    borderRadius: 12, padding: "10px 12px",
    boxShadow: "0 8px 24px rgba(2,132,199,.20)",
    font: "600 14px/1.2 Montserrat,system-ui,sans-serif",
    display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10
  };
  const btn = {
    border: "1px solid #0ea5e9",
    background: "linear-gradient(180deg,#38bdf8,#0ea5e9)",
    color: "#fff", borderRadius: 10, padding: "8px 12px", cursor: "pointer",
    boxShadow: "0 6px 18px rgba(14,165,233,.28)", font: "700 13px/1 Montserrat,system-ui,sans-serif"
  };

  return (
    <div style={bar} role="status" aria-live="polite">
      <span>Hai unha versión nova da aplicación.</span>
      <button
        type="button"
        style={btn}
        onClick={() => {
          try { location.reload(); } catch { window.location.href = "/"; }
        }}
      >
        Recargar
      </button>
    </div>
  );
}
