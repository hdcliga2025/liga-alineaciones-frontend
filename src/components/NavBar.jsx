// src/components/NavBar.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";

export default function NavBar({ currentPath = "" }) {
  // Ocultar en páxinas públicas
  const isPublic = ["/", "/login", "/register"].includes(currentPath || "/");
  if (isPublic) return null;

  // ===== Contador regresivo: peche aliñacións =====
  // Partido: 31/08/2025 17:00 (Europe/Madrid, CEST)
  // Peche:   2h antes => 31/08/2025 15:00 CEST = 13:00 UTC
  const TARGET_UTC_MS = Date.UTC(2025, 7, 31, 13, 0, 0); // 7 = agosto
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { remainStr } = useMemo(() => {
    let diff = TARGET_UTC_MS - now;
    if (diff <= 0) return { remainStr: "00D-00H-00M-00S" };
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return { remainStr: `${pad(days)}D-${pad(h)}H-${pad(m)}M-${pad(s)}S` };
  }, [now]);

  // Parpadeo cada 15s: celeste ↔ negro
  const blinkPhase = Math.floor(now / 15000) % 2;
  const colorNow = blinkPhase === 0 ? "#0ea5e9" : "#0f172a";

  // ===== Estilos =====
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 480 : false
  );
  useEffect(() => {
    const onR = () => setIsNarrow(window.innerWidth <= 480);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // Ajustes:
  // - MÓVIL: más estrecho (~2 caracteres menos de ancho) y algo más alto
  // - ESCRITORIO: un poco menos bold
  const fw = isNarrow ? 400 : 500;       // antes 600 en desktop -> 500
  const fz = isNarrow ? 19 : 20;         // móvil algo más alto
  const sx = isNarrow ? 0.72 : 1.34;     // móvil MUCHO más estrecho; desktop igual

  const styles = {
    header: {
      position: "fixed",
      top: 0, left: 0, right: 0,
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
      display: "flex", alignItems: "center",
      gap: isNarrow ? 8 : 10, whiteSpace: "nowrap",
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
      color: colorNow,
      fontWeight: fw,
      fontSize: fz,
      transform: `scaleX(${sx})`,
      transformOrigin: "center",
      letterSpacing: isNarrow ? "0.35px" : "0.6px",
    },
    rightGroup: {
      justifySelf: "end",
      display: "flex", alignItems: "center",
      gap: isNarrow ? 8 : 10, whiteSpace: "nowrap",
    },
    iconBtn: {
      width: isNarrow ? 36 : 38,
      height: isNarrow ? 36 : 38,
      display: "grid", placeItems: "center",
      borderRadius: 12, background: "#fff",
      border: "1px solid #eef2ff",
      boxShadow: "0 4px 14px rgba(0,0,0,.06)",
      textDecoration: "none", outline: "none",
      transition: "transform .15s ease, box-shadow .15s ease",
      cursor: "pointer",
    },
    iconBtnHover: { transform: "translateY(-1px)", boxShadow: "0 8px 22px rgba(0,0,0,.10)" },
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
          {/* IZQ: Atrás + Notificacións */}
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

          {/* CENTRO: Só contador */}
          <div style={styles.centerClock} aria-label="Peche das aliñacións">
            <p style={styles.time}>{remainStr}</p>
          </div>

          {/* DCHA: Perfil + Pechar */}
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

      {/* Empuje para non tapar contido */}
      <div style={styles.spacer} />
    </>
  );
}




