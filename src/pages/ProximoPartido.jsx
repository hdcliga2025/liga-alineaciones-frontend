// src/pages/ProximoPartido.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const ESCUDO_SRC = "/escudo.png";

/* ===== Layout base ===== */
const WRAP = { maxWidth: 880, margin: "0 auto", padding: "16px" };

/* Panel principal */
const PANEL = {
  position: "relative",
  border: "1px solid #cfe8ff",
  borderRadius: 18,
  background: "#fff",
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: "18px 16px",
};

const TOP_BOX = {
  background: "linear-gradient(180deg, rgba(224,242,254,0.55), rgba(191,219,254,0.45))",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: "14px 12px",
  marginBottom: 12,
};

/* ==== TITULO EQUIPO1 vs EQUIPO2 ==== */
const TITLE_LINE_BASE = {
  margin: "0 0 8px 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  letterSpacing: ".3px",
  color: "#0f172a",
  lineHeight: 1.08,
  fontSize: 30,
  fontWeight: 700,
};
const TITLE_LINE = (isMobile) => ({
  ...TITLE_LINE_BASE,
  fontSize: isMobile ? 22 : 30, // móvil 5% más grande que antes (21px → 22px)
});

const TEAM_NAME = { fontWeight: 700, textTransform: "uppercase" };
const VS_STYLE_BASE = { fontWeight: 600, fontSize: 22, margin: "0 8px" };
const VS_STYLE = (isMobile) => ({
  ...VS_STYLE_BASE,
  fontSize: isMobile ? 17 : 22,
});

const LINE_GRAY = {
  margin: "6px 0 0",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  fontSize: 19,
  color: "#64748b",
  fontWeight: 600,
};

/* ===== Banner METEO ===== */
const BLEED_WRAP = {
  width: "100vw",
  marginLeft: "50%",
  transform: "translateX(-50%)",
};
const METEO_BANNER = (isMobile) => ({
  position: "relative",
  width: "100%",
  padding: isMobile ? "22px 14px" : "26px 20px",
  background: "linear-gradient(180deg, rgba(224,242,254,0.9), rgba(191,219,254,0.9))",
  borderTop: "1px solid #bae6fd",
  borderBottom: "1px solid #93c5fd",
});
const METEO_BAR = (isMobile) => ({
  display: "flex",
  gap: isMobile ? 20 : 28,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  maxWidth: 1000,
  margin: isMobile ? "10px auto 0" : "0 auto", // espacio debajo de METEO|Lugar
  color: "#0f172a",
  fontSize: isMobile ? 22 : 22, // móvil 20% más grande (18 → 22)
  fontWeight: 700,
});
const METEO_LEGEND_TOP = (isMobile) => ({
  position: "absolute",
  top: 6,
  left: "50%",
  transform: "translateX(-50%)",
  fontSize: isMobile ? 12 : 13,
  fontWeight: 800,
  color: "#0284c7",
  letterSpacing: ".3px",
});
const METEO_SUBLEGEND_AFTER = (isMobile) => ({
  textAlign: "center",
  marginTop: isMobile ? 0 : 8, // quitada línea de espacio en móvil
  fontSize: isMobile ? 11 : 12,
  fontWeight: 600,
  color: "#475569",
  letterSpacing: ".2px",
});

/* ==== Utilidades (se mantienen igual) ==== */
function toLongGalician(dateObj) {
  try {
    return new Intl.DateTimeFormat("gl-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Europe/Madrid",
    }).format(dateObj);
  } catch {
    return dateObj?.toLocaleDateString("gl-ES") || "";
  }
}
const capFirst = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* … resto del archivo idéntico, solo cambiamos estilos … */
