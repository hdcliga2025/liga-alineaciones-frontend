// src/components/NavBar.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";

export default function NavBar({ currentPath = "" }) {
  // Ocultar en públicas
  const isPublic = ["/", "/login", "/register"].includes(currentPath || "/");
  if (isPublic) return null;

  // Reloj Europe/Madrid
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Responsive (para agrupar iconos a la derecha en móvil)
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 480 : false
  );
  useEffect(() => {
    const onR = () => setIsNarrow(window.innerWidth <= 480);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const { dateText, timeText } = useMemo(() => {
    const tz = "Europe/Madrid";
    const d = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    const pad = (n) => String(n).padStart(2, "0");
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const dateTextFormatted = `${dd}.${mm}.${yyyy}`;

    const timeTextFormatted = new Intl.DateTimeFormat("gl-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(d);

    return { dateText: dateTextFormatted, timeText: timeTextFormatted };
  }, [now]);

  // ===== Estilos =====
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
      // en móvil dejamos la misma rejilla pero reducimos tipografía del reloj
      gridTemplateColumns: "auto 1fr auto",
      alignItems: "center",
      gap: isNarrow ? 6 : 8,
    },
    left: { display: "flex", alignItems: "center" },
    centerClock: {
      justifySelf: "center",
      textAlign: "center",
      color: "#0ea5e9",
      userSelect: "none",
      fontFamily:
        "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      lineHeight: 1.05,
    },
    date: { fontWeight: 600, fontSize: isNarrow ? 12 : 14, margin: 0 },
    time: { fontWeight: 700, fontSize: isNarrow ? 16 : 18, margin: 0 },
    actions: {
      justifySelf: "end",
      display: "flex",
      alignItems: "center",
      gap: isNarrow ? 8 : 10,
      flexWrap: "nowrap", // → que no salten de línea en móvil
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
    hover === k ? { ...styles.iconBtn, ...styles.iconBtnHover } : styles.iconBtn;

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
          {/* Atrás */}
          <div style={styles.left}>
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
          </div>

          {/* Reloj (centro) */}
          <div style={styles.centerClock} aria-label="Hora de referencia (Madrid)">
            <p style={styles.date}>{dateText}</p>
            <p style={styles.time}>{timeText}</p>
          </div>

          {/* Acciones (derecha, juntos en móvil) */}
          <div style={styles.actions}>
            {/* Notificacións */}
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

            {/* Pechar → logout a Landing */}
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


