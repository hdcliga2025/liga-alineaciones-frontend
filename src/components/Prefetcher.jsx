// src/components/Prefetcher.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";

/* Comentario técnico (castellano):
   Prefetch minimalista que dispara import() de las vistas más probables
   cuando el navegador está ocioso. Objetivos:
   - No bloquear primera pintura.
   - Reducir latencia al navegar a páginas comunes.
   - Sin estado, sin dependencias → robusto y simple.

   Estratexia:
   - Ignoramos rutas públicas (/, /login, /register) para non gastar datos antes de entrar.
   - Usamos requestIdleCallback; se non existe, fallback con setTimeout.
   - Cancelamos listeners en unmount.
*/

const lazyImports = [
  () => import("../pages/ProximoPartido.jsx"),
  () => import("../pages/VindeirosPartidos.jsx"),
  () => import("../pages/PartidosFinalizados.jsx"),
  () => import("../pages/HazTu11.jsx"),
  () => import("../pages/AlineacionOficial.jsx"),
  () => import("../pages/ResultadosUltimaAlineacion.jsx"),
  () => import("../pages/Clasificacion.jsx"),
  () => import("../pages/Perfil.jsx"),
];

const rIC =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? window.requestIdleCallback
    : (cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 700);

export default function Prefetcher({ currentPath }) {
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      const base = (currentPath || "").split("?")[0];
      if (base === "/" || base === "/login" || base === "/register") return;

      rIC(async () => {
        for (const job of lazyImports) {
          if (cancelled) break;
          try { await job(); } catch {}
        }
      });
    };

    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });

    const onVis = () => { if (!document.hidden) run(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.removeEventListener("load", run);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [currentPath]);

  return null;
}
