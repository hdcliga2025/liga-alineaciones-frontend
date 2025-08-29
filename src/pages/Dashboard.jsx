// src/pages/Dashboard.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import "./Dashboard.css";

/* Icono calendario (outline) */
const IconCalendar = ({ color = "#22c55e", size = 40 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
    stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
  >
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M7 2.5v4M17 2.5v4M3 9h18" />
    <path d="M7.5 12h3M13.5 12h3M7.5 16h3M13.5 16h3" />
  </svg>
);

/* Icono xogador con balón (más grande y de silueta clara) */
const IconPlayerBall = ({ color = "#f59e0b", size = 44 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
    stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
  >
    {/* cabeza */}
    <circle cx="9.5" cy="5.2" r="2.2" />
    {/* tronco inclinado */}
    <path d="M9.5 7.8L12.2 11.3" />
    {/* brazos */}
    <path d="M10.8 9.4l3.2-1.4" />
    <path d="M9.8 9.6L7 8.6" />
    {/* perna de apoio */}
    <path d="M12.2 11.3L10.4 16.8" />
    {/* perna que chuta (estirada cara ao balón) */}
    <path d="M12.2 11.3L17 14.6" />
    {/* balón máis grande */}
    <circle cx="19" cy="15.6" r="2.2" />
    {/* contacto pé-balón */}
    <path d="M16.6 13.8l1.6 1.6" />
  </svg>
);

const IconTrophy = ({ color = "#a78bfa", size = 40 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
    stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
  >
    <path d="M8 4h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4V4z" />
    <path d="M16 7h3a3 3 0 0 1-3 3M8 7H5a3 3 0 0 0 3 3" />
    <path d="M12 11v4M9 20h6M10 18h4" />
  </svg>
);

export default function Dashboard() {
  const [nome, setNome] = useState("amig@");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const uid = s?.session?.user?.id || null;
      if (uid) {
        const { data: prof } = await supabase
          .from("profiles")
          .s



