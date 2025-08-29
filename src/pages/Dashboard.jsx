// src/pages/Dashboard.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import "./Dashboard.css";

/* Icono calendario (outline) */
const IconCalendar = ({ color = "#22c55e", size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    stroke={color}
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M7 2.5v4M17 2.5v4M3 9h18" />
    <path d="M7.5 12h3M13.5 12h3M7.5 16h3M13.5 16h3" />
  </svg>
);

/* Icono xogador — pernas abertas en “V” e balón centrado entre elas, sen tocar */
const IconPlayerBall = ({ color = "#f59e0b", size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    stroke={color}
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    {/* cabeza */}
    <circle cx="9.4" cy="5.1" r="2.2" />
    {/* tronco lixeiramente curvado (carreira) */}
    <path d="M9.4 7.6C10.5 9 11 9.7 12 11.1" />
    {/* brazos */}
    <path d="M10.7 9.2l3.4-1.5" />
    <path d="M9.5 9.4L7.0 8.5" />
    {/* perna esquerda (apoio) en V */}
    <path d="M12.0 11.1L10.1 13.3" />   {/* muslo */}
    <path d="M10.1 13.3L8.6 16.6" />    {/* tibia cara fóra */}
    {/* perna dereita (chute) abríndose cara fóra */}
    <path d="M12.0 11.1L14.8 13.2" />   {/* muslo */}
    <path d="M14.8 13.2L17.4 16.4" />   {/* tibia cara fóra */}
    {/* balón centrado entre as dúas pernas, sen tocar */}
    <circle cx="13.0" cy="15.2" r="1.6" />
  </svg>
);

const IconTrophy = ({ color = "#a78bfa", size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    stroke={color}
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
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
          .select("first_name")
          .eq("id", uid)
          .maybeSingle();
        const first = (prof?.first_name || "").trim();
        if (alive) setNome(first || "amig@");
      } else {
        if (alive) setNome("amig@");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div class="dash-wrap">
      {/* Hero */}
      <section class="dash-hero two-cols">
        <img
          src="/logoHDC.jpg"
          alt="HDC Logo"
          class="dash-hero-img fill-col"
          decoding="async"
          loading="eager"
        />
        <p class="dash-greet">
          Boas <a class="dash-name">{nome}</a>, benvidx á Liga das Aliñacións
        </p>
      </section>

      {/* Cards */}
      <section class="dash-grid dash-grid--main">
        {/* Calendario */}
        <a href="/partidos" class="main-card">
          <div class="dash-icon" style="border:1px solid rgba(34,197,94,.55);">
            <IconCalendar color="#22c55e" />
          </div>
          <div class="dash-text">
            <h3 class="dash-card-header">Calendario</h3>
            <p class="dash-card-desc">Todos os partidos do Celta na tempada 2025/2026</p>
          </div>
          <span class="chev">›</span>
        </a>

        {/* Xogar ás Aliñacións */}
        <a href="/haz-tu-11" class="main-card">
          <div class="dash-icon" style="border:1px solid rgba(245,158,11,.55);">
            <IconPlayerBall color="#f59e0b" />
          </div>
          <div class="dash-text">
            <h3 class="dash-card-header">Xogar ás Aliñacións</h3>
            <p class="dash-card-desc">Aquí é onde demostras o Claudio que levas dentro</p>
          </div>
          <span class="chev">›</span>
        </a>

        {/* Clasificacións */}
        <a href="/clasificacion" class="main-card">
          <div class="dash-icon" style="border:1px solid rgba(167,139,250,.55);">
            <IconTrophy color="#a78bfa" />
          </div>
          <div class="dash-text">
            <h3 class="dash-card-header">Clasificacións</h3>
            <p class="dash-card-desc">Resultados por partido e xerais de cada quen</p>
          </div>
          <span class="chev">›</span>
        </a>
      </section>
    </div>
  );
}


