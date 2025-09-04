// src/components/NavBar.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

export default function NavBar({ currentPath = "" }) {
  // Rutas públicas: no renderizar la barra
  const isPublic = ["/", "/login", "/register"].includes(currentPath || "/");
  if (isPublic) return null;

  /* ==============================
     Estado para reloj y robustez
     ============================== */
  const [targetMs, setTargetMs] = useState(null); // cierre = match_iso - 2h
  const [now, setNow] = useState(() => Date.now());

  // Ticker de 1s
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Carga/refresh del target. Importante: nunca lo dejamos en null si hay un fallo puntual.
  useEffect(() => {
    let alive = true;

    async function fetchTarget() {
      try {
        const { data, error } = await supabase
          .from("next_match")
          .select("match_iso")
          .eq("id", 1)
          .maybeSingle();

        if (!alive) return;
        if (error) return; // mantener último valor conocido

        if (data?.match_iso) {
          const ms = new Date(data.match_iso).getTime() - 2 * 3600 * 1000;
          setTargetMs(ms);
        }
        // si no hay match_iso, mantenemos el último valor para que el reloj no se vaya a 00
      } catch {
        // mantener último valor
      }
    }

    // Primer fetch + polling
    fetchTarget();
    const poll = setInterval(fetchTarget, 10000);

    // Cuando el tab vuelve a foreground
    const onVis = () => {
      if (!document.hidden) fetchTarget();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Poll liviano para auto-archivar (funciona aunque nadie visite Finalizados)
  useEffect(() => {
    let alive = true;
    async function tryArchive() {
      try {
        const { data, error } = await supabase.rpc("archive_next_match_if_due");
        // Si archivó algo, refrescamos el target
        if (!error && data) {
          const { data: nm } = await supabase
            .from("next_match")
            .select("match_iso")
            .eq("id", 1)
            .maybeSingle();
          if (!alive) return;
          if (nm?.match_iso) {
            const ms = new Date(nm.match_iso).getTime() - 2 * 3600 * 1000;
            setTargetMs(ms);
          }
        }
      } catch {
        /* ignorar errores de red puntuales */
      }
    }

    tryArchive();
    const poll = setInterval(tryArchive, 15000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, []);

  // String del contador. Evitamos 00 por fallos; si no hay target mostramos 00... pero sin parpadeos.
  const remainStr = useMemo(() => {
    if (!targetMs) return "00D-00H-00M-00S";
    let diff = targetMs - now;
    if (diff <= 0) diff = 0;
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(days)}D-${pad(h)}H-${pad(m)}M-${pad(s)}S`;
  }, [targetMs, now]);

  /* ==============================
     Estilos y UI
     ============================== */
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 480 : false
  );
  useEffect(() => {
    const onR = () => setIsNarrow(window.innerWidth <= 480);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const styles = {
    header: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: "rgba(255,255,255,0.9)",
      backdropFilter: "saturate(180%) blur(8px)",
      borderBottom: "1px solid #e5e7eb",
    },
    container: {
      maxWidth: 1080,
      margin: "0 auto",
      padding: "8px 12px",
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      alignItems: "center",
      gap: isNarrow ? 6 : 8,
    },
    leftGroup: {
      display: "flex",
      alignItems: "center",
      gap: isNarrow ? 8 : 10,
      whiteSpace: "nowrap",
    },
    centerClock: {
      justifySelf: "center",
      textAlign: "center",
      userSelect: "none",
      fontFamily:
        "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      lineHeight: 1.0,
    },
    time: {
      margin: 0,
      color: "#0ea5e9", // siempre celeste
      fontWeight: 400, // sin bold
      fontSize: isNarrow ? 17 : 20,
      transform: `scaleX(${isNarrow ? 0.89 : 1.3})`,
      transformOrigin: "center",
      letterSpacing: isNarrow ? "0.35px" : "0.6px",
      whiteSpace: "nowrap",
    },
    rightGroup: {
      justifySelf: "end",
      display: "flex",
      alignItems: "center",
      gap: isNarrow ? 8 : 10,
      whiteSpace: "nowrap",
    },
    iconBtn: {
      width: isNarrow ? 36 : 38,
      height: isNarrow ? 36 : 38,
      display: "grid",
      placeItems: "center",
      borderRadius: 12,
      background: "#fff",
      border: "1px solid #eef2ff",
      boxShadow: "0 4px 14px rgba(0,0,0,.06)",
      textDecoration: "none",
      outline: "none",
      transition: "transform .15s ease, box-shadow .15s ease",
      cursor: "pointer",
    },
    iconBtnHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 8px 22px rgba(0,0,0,.10)",
    },
    spacer: { height: 56 },
  };

  const [hover, setHover] = useState("");
  const btnStyle = (k) =>
    hover === k
      ? { ...styles.iconBtn, ...styles.iconBtnHover }
      : styles.iconBtn;

  const stroke = "#0ea5e9";
  const strokeW = 1.8;
  const common = {
    fill: "none",
    stroke,
    strokeWidth: strokeW,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const onBack = (e) => {
    e.preventDefault();
    try {
      if (history.length > 1) history.back();
      else location.href = "/dashboard";
    } catch {
      location.href = "/dashboard";
    }
  };

  return (
    <>
      <header style={styles.header}>
        <div style={styles.container}>
          {/* IZQUIERDA: Atrás + Notificacións */}
          <div style={styles.leftGroup}>
            <a
              href="/dashboard"
              title="Atrás"
              style={btnStyle("back")}
              onMouseEnter={() => setHover("back")}
              onMouseLeave={() => setHover("")}
              onClick={onBack}
              aria-label="Volver á páxina anterior"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" {...common}>
                <path d="M4 12h16" />
                <path d="M10 6l-6 6 6 6" />
              </svg>
            </a>

            <a
              href="/notificacions"
              title="Notificacións"
              style={btnStyle("bell")}
              onMouseEnter={() => setHover("bell")}
              onMouseLeave={() => setHover("")}
              aria-label="Ir a Notificacións"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" {...common}>
                <path d="M12 3a5 5 0 00-5 5v2.5c0 .7-.27 1.37-.75 1.87L5 14h14l-1.25-1.63A2.5 2.5 0 0117 10.5V8a5 5 0 00-5-5z" />
                <path d="M9.5 18a2.5 2.5 0 005 0" />
              </svg>
            </a>
          </div>

          {/* CENTRO: Contador SIEMPRE celeste */}
          <div style={styles.centerClock} aria-label="Peche das aliñacións">
            <p style={styles.time}>{remainStr}</p>
          </div>

          {/* DERECHA: Perfil + Logout */}
          <div style={styles.rightGroup}>
            <a
              href="/perfil"
              title="Perfil"
              style={btnStyle("user")}
              onMouseEnter={() => setHover("user")}
              onMouseLeave={() => setHover("")}
              aria-label="Ir a Perfil"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" {...common}>
                <circle cx="12" cy="8" r="3.2" />
                <path d="M4.5 19.5a7.5 7.5 0 0115 0" />
              </svg>
            </a>

            <a
              href="/logout?to=/"
              title="Pechar sesión"
              style={btnStyle("close")}
              onMouseEnter={() => setHover("close")}
              onMouseLeave={() => setHover("")}
              aria-label="Pechar sesión"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" {...common}>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Empuje para no tapar contenido */}
      <div style={styles.spacer} />
    </>
  );
}




