// src/components/NavBar.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { ArrowLeft, Bell, UserCircle, CloseX } from "./icons.jsx";

export default function NavBar({ currentPath = "" }) {
  // Ocultar en páxinas públicas
  const isPublic = ["/", "/login", "/register"].includes(currentPath || "/");
  if (isPublic) return null;

  // ===== Contador (fecha fixa provisional) =====
  // Peche aliñacións: 31/08/2025 15:00 CEST = 13:00 UTC
  const TARGET_UTC_MS = Date.UTC(2025, 7, 31, 13, 0, 0);
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

  // Cor sempre celeste; sen parpadeo
  const colorNow = "#0ea5e9";

  // ===== Estilos =====
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 480 : false
  );
  useEffect(() => {
    const onR = () => setIsNarrow(window.innerWidth <= 480);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const fw = 400;                // PC: sen bold; móbil: tamén lixeiro
  const fz = isNarrow ? 17 : 20; // tamaños actuais
  const sx = isNarrow ? 0.84 : 1.28; // móbil máis estreito

  const styles = {
    header: {
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(255,255,255,0.9)", backdropFilter: "saturate(180%) blur(8px)",
      borderBottom: "1px solid #e5e7eb",
    },
    container: {
      maxWidth: 1080, margin: "0 auto", padding: "8px 12px",
      display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center",
      gap: isNarrow ? 6 : 8,
    },
    leftGroup: { display: "flex", alignItems: "center", gap: isNarrow ? 8 : 10, whiteSpace: "nowrap" },
    centerClock: {
      justifySelf: "center", textAlign: "center", userSelect: "none",
      fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      lineHeight: 1.0,
    },
    time: {
      margin: 0, color: colorNow, fontWeight: fw, fontSize: fz,
      transform: `scaleX(${sx})`, transformOrigin: "center",
      letterSpacing: isNarrow ? "0.35px" : "0.6px",
    },
    rightGroup: { justifySelf: "end", display: "flex", alignItems: "center", gap: isNarrow ? 8 : 10, whiteSpace: "nowrap" },
    iconBtn: {
      width: isNarrow ? 36 : 38, height: isNarrow ? 36 : 38,
      display: "grid", placeItems: "center",
      borderRadius: 12, background: "#fff", border: "1px solid #eef2ff",
      boxShadow: "0 4px 14px rgba(0,0,0,.06)", textDecoration: "none", outline: "none",
      transition: "transform .15s ease, box-shadow .15s ease", cursor: "pointer",
    },
    iconBtnHover: { transform: "translateY(-1px)", boxShadow: "0 8px 22px rgba(0,0,0,.10)" },
    spacer: { height: 56 },
  };

  const [hover, setHover] = useState("");
  const btnStyle = (k) =>
    hover === k ? { ...styles.iconBtn, ...styles.iconBtnHover } : styles.iconBtn;

  const stroke = "#0ea5e9";

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
              href="/dashboard" title="Atrás" style={btnStyle("back")}
              onMouseEnter={() => setHover("back")} onMouseLeave={() => setHover("")}
              onClick={onBack} aria-label="Volver á páxina anterior"
            >
              <ArrowLeft size={22} color={stroke} />
            </a>

            <a
              href="/notificacions" title="Notificacións" style={btnStyle("bell")}
              onMouseEnter={() => setHover("bell")} onMouseLeave={() => setHover("")}
              aria-label="Ir a Notificacións"
            >
              <Bell size={22} color={stroke} />
            </a>
          </div>

          {/* CENTRO: contador */}
          <div style={styles.centerClock} aria-label="Peche das aliñacións">
            <p style={styles.time}>{remainStr}</p>
          </div>

          {/* DCHA: Perfil + Pechar */}
          <div style={styles.rightGroup}>
            <a
              href="/perfil" title="Perfil" style={btnStyle("user")}
              onMouseEnter={() => setHover("user")} onMouseLeave={() => setHover("")}
              aria-label="Ir a Perfil"
            >
              <UserCircle size={22} color={stroke} />
            </a>

            <a
              href="/logout?to=/" title="Pechar sesión" style={btnStyle("close")}
              onMouseEnter={() => setHover("close")} onMouseLeave={() => setHover("")}
              aria-label="Pechar sesión"
            >
              <CloseX size={22} color={stroke} />
            </a>
          </div>
        </div>
      </header>

      {/* Empuxe para non tapar contido */}
      <div style={styles.spacer} />
    </>
  );
}




