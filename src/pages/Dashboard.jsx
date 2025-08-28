// src/pages/Dashboard.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import "./Dashboard.css";

/* Icons outline coherentes — aumentamos tamaño interno y cambiamos “aliñacións” por xogador con balón */
const IconBall = ({ color = "#22c55e", size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M7 7l3 2M17 7l-3 2M7 17l3-2M17 17l-3-2" />
  </svg>
);

/* Novo icono: xogador con balón (outline) */
const IconPlayerBall = ({ color = "#f59e0b", size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    {/* cabeza */}
    <circle cx="9" cy="5.5" r="2.2" />
    {/* tronco y brazo */}
    <path d="M10 8l2.5 2.5" />
    <path d="M12.5 10.5l3-1.5" />
    {/* pierna de apoio e equilibrio */}
    <path d="M10 8l-2 4-3 2" />
    {/* perna que vai ao balón */}
    <path d="M12.5 10.5l2.5 4.5" />
    {/* balón */}
    <circle cx="18" cy="18" r="1.8" />
    {/* golpeo/pe: unión ó balón */}
    <path d="M15 15.2l2.7 1.8" />
  </svg>
);

const IconTrophy = ({ color = "#a78bfa", size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
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
    return () => { alive = false; };
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
        <a href="/partidos" class="main-card">
          <div class="dash-icon" style="border:1px solid rgba(34,197,94,.55);">
            <IconBall color="#22c55e" />
          </div>
          <div class="dash-text">
            <h3 class="dash-card-header">Calendario</h3>
            <p class="dash-card-desc">Próximos, Vindeiros, Finalizados</p>
          </div>
          <span class="chev">›</span>
        </a>

        <a href="/haz-tu-11" class="main-card">
          <div class="dash-icon" style="border:1px solid rgba(245,158,11,.55);">
            <IconPlayerBall color="#f59e0b" />
          </div>
          <div class="dash-text">
            <h3 class="dash-card-header">Xogar ás Aliñacións</h3>
            <p class="dash-card-desc">
              Convocatoria, Fai o teu 11, Aliñación oficial, Normas
            </p>
          </div>
          <span class="chev">›</span>
        </a>

        <a href="/clasificacion" class="main-card">
          <div class="dash-icon" style="border:1px solid rgba(167,139,250,.55);">
            <IconTrophy color="#a78bfa" />
          </div>
          <div class="dash-text">
            <h3 class="dash-card-header">Clasificacións</h3>
            <p class="dash-card-desc">Último partido e Xeral</p>
          </div>
          <span class="chev">›</span>
        </a>
      </section>
    </div>
  );
}

