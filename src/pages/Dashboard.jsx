// src/pages/Dashboard.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import "./Dashboard.css";

/* Iconas SVG inline (ASCII-safe) */
const IconBall = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M12 6l3 2-1 3h-4L9 8l3-2zM8 13l1 4m7-4l-1 4M6 11l2-2m10 2l-2-2"></path>
  </svg>
);
const IconShirt = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M7 5l3-2h4l3 2 3 2-2 3-3-2v11H9V8L6 10 4 7l3-2z"></path>
  </svg>
);
const IconMegaphone = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 12h4l9-4v8l-9-4H3z"></path>
    <path d="M7 16l1.2 2.4A2 2 0 0010 19h1"></path>
    <path d="M18 10.5v3"></path>
  </svg>
);
const IconFlag = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 4v16"></path>
    <path d="M5 5h10l-2 2 2 2H5z"></path>
  </svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="4" y="6" width="16" height="14" rx="2"></rect>
    <path d="M8 4v4M16 4v4M4 10h16"></path>
  </svg>
);
const IconClipboard = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="6" y="7" width="12" height="13" rx="2"></rect>
    <rect x="9" y="4" width="6" height="4" rx="1"></rect>
    <path d="M9 12h6M9 16h4"></path>
  </svg>
);
const IconTarget = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8"></circle>
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 8v2M12 14v2M8 12h2M14 12h2"></path>
  </svg>
);
const IconTrophy = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M7 6h10v2a5 5 0 01-10 0V6z"></path>
    <path d="M5 6h2v1a3 3 0 01-3 3H3V8a2 2 0 012-2zm14 0a2 2 0 012 2v2h-1a3 3 0 01-3-3V6h2z"></path>
    <path d="M12 13v3M8 20h8"></path>
  </svg>
);
const IconBook = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 5h7a3 3 0 013 3v11H8a3 3 0 00-3 3V5z"></path>
    <path d="M12 5h7a3 3 0 013 3v11h-7"></path>
  </svg>
);
const IconGear = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.5 6.5l1.4 1.4M16.1 16.1l1.4 1.4M6.5 17.5l1.4-1.4M16.1 7.9l1.4-1.4"></path>
  </svg>
);

export default function Dashboard() {
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const full = data?.user?.user_metadata?.full_name || "";
      const first = full.trim().split(/\s+/)[0] || "";
      setFirstName(first);
    })();
  }, []);

  return (
    <main class="dash-wrap dash-pill">
      {/* Móbil/tablet: imaxe esquerda + texto dereita (super xuntos)
          PC (>=960px): imaxe centrada enriba + texto semi-bold debaixo */}
      <div class="dash-hero two-cols center-hero">
        <div class="dash-hero-col">
          <img src="/logoHDC.jpg" alt="Logo HDC" class="dash-hero-img fill-col" />
        </div>
        <div class="dash-hero-center">
          <p class="dash-greet">
            Boas {firstName && <strong class="dash-name">{firstName}</strong>}, benvidx á Liga das Aliñacións
          </p>
        </div>
      </div>

      <section class="dash-grid">
        <a class="dash-card" href="/proximo-partido" aria-label="Próximo partido">
          <div class="dash-icon dash-icon--proximo"><IconBall /></div>
          <div class="dash-text">
            <h2 class="dash-card-header">Próximo partido</h2>
            <p class="dash-card-desc">Información do seguinte encontro.</p>
          </div>
        </a>

        <a class="dash-card" href="/alineacion-oficial" aria-label="Aliñación oficial">
          <div class="dash-icon dash-icon--alineacion"><IconShirt /></div>
          <div class="dash-text">
            <h2 class="dash-card-header">Aliñación oficial</h2>
            <p class="dash-card-desc">Once confirmado polo club.</p>
          </div>
        </a>

        <a class="dash-card" href="/convocatoria-oficial" aria-label="Convocatoria oficial">
          <div class="dash-icon dash-icon--convocatoria"><IconMegaphone /></div>
          <div class="dash-text">
            <h2 class="dash-card-header">Convocatoria oficial</h2>
            <p class="dash-card-desc">Lista de xogadores convocados.</p>
          </div>
        </a>

        <a class="dash-card" href="/partidos?f=pasados" aria-label="Partidos pasados">
          <div class="dash-icon dash-icon--pasados"><IconFlag /></div>
          <div class="dash-text">
            <h2 class="dash-card-header">Partidos pasados</h2>
            <p class="dash-card-desc">Resultados e datos dos partidos xa disputados.</p>
          </div>
        </a>

        <a class="dash-card" href="/partidos?f=vindeiros" aria-label="Vindeiros partidos">
          <div class="dash-icon dash-icon--vindeiros"><IconCalendar /></div>
          <div class="dash-text">
            <h2 class="dash-card-header">Vindeiros partidos</h2>
            <p class="dash-card-desc">Calendario e detalles dos seguintes encontros.</p>
          </div>
        </a>

        <a class="dash-card" href="/haz-tu-11" aria-label="Fai o teu 11">
          <div class="dash-icon dash-icon--fai11"><IconClipboard /></div>
          <div class="dash-text">
            <h2 class="dash-card-header">Fai o teu 11</h2>
            <p class="dash-card-desc">Escolle a túa aliñación da xornada.</p>
          </div>
        </a>

        <a class="dash-card" href="/clasificacion?tipo=ultimo" aria-label="Clasificación último partido">
          <div class="dash-icon dash-icon--ultimo"><IconTarget /></div>
          <div class="dash-text">
            <h2 class="dash-card-header">Clasificación individual do último partido</h2>
            <p class="dash-card-desc">Puntuacións dos participantes na última xornada.</p>
          </div>
        </a>

        <a class="dash-card" href="/clasificacion?tipo=xeral" aria-label="Clasificación xeral">
          <div class="dash-icon dash-icon--xeral"><IconTrophy /></div>
          <div class="dash-text">
            <h2 class="dash-card-header">Clasificación xeral</h2>
            <p class="dash-card-desc">Táboa acumulada de toda a liga.</p>
          </div>
        </a>

        <a class="dash-card" href="/instruccions" aria-label="Instrucións, Regras e Premio">
          <div class="dash-icon dash-icon--book"><IconBook /></div>
          <div class="dash-text">
            <h2 class="dash-card-header">Instrucións · Regras · Premio</h2>
            <p class="dash-card-desc">Como xogar, normativa e premio final.</p>
          </div>
        </a>

        <a class="dash-card" href="/axustes" aria-label="Axustes">
          <div class="dash-icon dash-icon--gear"><IconGear /></div>
          <div class="dash-text">
            <h2 class="dash-card-header">Axustes</h2>
            <p class="dash-card-desc">Perfil e opcións da conta.</p>
          </div>
        </a>
      </section>
    </main>
  );
}
