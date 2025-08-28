// src/components/NavBar.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";

export default function NavBar({ currentPath = "" }) {
  // Ocultar en rutas públicas
  const isPublic = ["/", "/login", "/register"].includes(currentPath || "/");
  if (isPublic) return null;

  // Reloj Europe/Madrid
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { dateText, timeText } = useMemo(() => {
    const tz = "Europe/Madrid";
    // intenta gl-ES; si no, usa es-ES
    const dateFmt =
      new Intl.DateTimeFormat("gl-ES", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: tz,
      }) || new Intl.DateTimeFormat("es-ES", { timeZone: tz });
    const timeFmt = new Intl.DateTimeFormat("gl-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz,
    });

    const d = dateFmt.format(now);
    const t = timeFmt.format(now);
    // Capitaliza primera letra de la fecha
    const cap = d.charAt(0).toUpperCase() + d.slice(1);
    return { dateText: cap, timeText: t };
  }, [now]);

  // Estilos inline (sin dependencias externas)
  const styles = {
    header: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      // fondo muy transparente + blur
      background: "rgba(255,255,255,0.9)",
      backdropFilter: "saturate(180%) blur(8px)",
      borderBottom: "1px solid #e5e7eb",
    },
    container: {
      maxWidth: 1080,
      margin: "0 auto",
      padding: "8px 12px",
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      gap: 8,
    },
    centerClock: {
      justifySelf: "center",
      textAlign: "center",
      lineHeight: 1.05,
      color: "#0ea5e9", // celeste
      fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      userSelect: "none",
    },
    date: { fontWeight: 600, fontSize: 14, opacity: 0.95, margin: 0 },
    time: { fontWeight: 700, fontSize: 18, margin: 0 },
    actions: {
      justifySelf: "end",
      display: "flex",
      gap: 10,
      alignItems: "center",
    },
    iconBtn: {
      width: 38,
      height: 38,
      display: "grid",
      placeItems: "center",
      borderRadius: 12,
      background: "#fff",
      border: "1px solid #eef2ff",
      boxShadow: "0 4px 14px rgba(0,0,0,.06)",
      textDecoration: "none",
      outline: "none",
      transition: "transform .15s ease, box-shadow .15s ease",
    },
    iconBtnHover: {
      transform: "translateY(-1px)",
      boxShadow: "0 8px 22px rgba(0,0,0,.10)",
    },
    spacer: { height: 56 }, // altura aproximada del header
  };

  // Pequeño efecto hover sin CSS global
  const [hover, setHover] = useState("");
  const btnStyle = (k) =>
    hover === k ? { ...styles.iconBtn, ...styles.iconBtnHover } : styles.iconBtn;

  // Iconos estilo línea, coherentes con los del login/registro
  const stroke = "#0ea5e9"; // celeste
  const strokeW = 1.8;
  const common = { fill: "none", stroke: stroke, strokeWidth: strokeW, strokeLinecap: "round", strokeLinejoin: "round" };

  return (
    <>
      <header style={styles.header}>
        <div style={styles.container}>
          <div /> {/* hueco lado izquierdo (logo si lo quisieras en el futuro) */}

          {/* Reloj centrado */}
          <div style={styles.centerClock} aria-label="Hora de referencia (Madrid)">
            <p style={styles.date}>{dateText}</p>
            <p style={styles.time}>{timeText}</p>
          </div>

          {/* Acciones derecha */}
          <div style={styles.actions}>
            {/* Notificación */}
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

            {/* Perfil */}
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

            {/* Pechar (X) → logout a Landing */}
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

      {/* Empuje para que o contido non quede tapado polo header fixo */}
      <div style={styles.spacer} />
    </>
  );
}
