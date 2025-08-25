// src/pages/Dashboard.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import "./Dashboard.css";

/* --- Iconas SVG inline (ASCII-safe) --- */
const IcoBall = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M12 6l3 2-1 3h-4L9 8l3-2zM8 13l1 4m7-4l-1 4M6 11l2-2m10 2l-2-2"></path>
  </svg>
);
const IcoShirt = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M7 5l3-2h4l3 2 3 2-2 3-3-2v11H9V8L6 10 4 7l3-2z"></path>
  </svg>
);
const IcoTrophy = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M7 6h10v2a5 5 0 01-10 0V6z"></path>
    <path d="M5 6h2v1a3 3 0 01-3 3H3V8a2 2 0 012-2zm14 0a2 2 0 012 2v2h-1a3 3 0 01-3-3V6h2z"></path>
    <path d="M12 13v3M8 20h8"></path>
  </svg>
);
const IcoGear = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.5 6.5l1.4 1.4M16.1 16.1l1.4 1.4M6.5 17.5l1.4-1.4M16.1 7.9l1.4-1.4"></path>
  </svg>
);

/* Sub-iconas */
const IcoCalendar = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="4" y="6" width="16" height="14" rx="2"></rect>
    <path d="M8 4v4M16 4v4M4 10h16"></path>
  </svg>
);
const IcoFlag = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 4v16M5 5h10l-2 2 2 2H5z"></path>
  </svg>
);
const IcoMegaphone = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 12h4l9-4v8l-9-4H3z"></path>
    <path d="M7 16l1.2 2.4A2 2 0 0010 19h1"></path>
  </svg>
);
const IcoClipboard = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="6" y="7" width="12" height="13" rx="2"></rect>
    <rect x="9" y="4" width="6" height="4" rx="1"></rect>
  </svg>
);
const IcoBook = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 5h7a3 3 0 013 3v11H8a3 3 0 00-3 3V5z"></path>
    <path d="M12 5h7a3 3 0 013 3v11h-7"></path>
  </svg>
);
const IcoTarget = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8"></circle>
    <circle cx="12" cy="12" r="4"></circle>
  </svg>
);
const IcoUser = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4"></circle>
    <path d="M6 20a6 6 0 0112 0"></path>
  </svg>
);
const IcoAlert = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 9v4M12 17h.01"></path>
    <path d="M10.3 3.5l-8 14A2 2 0 004 21h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z"></path>
  </svg>
);
const IcoMessage = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15a4 4 0 01-4 4H8l-5 3 1-4a4 4 0 01-1-3V7a4 4 0 014-4h10a4 4 0 014 4z"></path>
  </svg>
);

export default function Dashboard() {
  const [firstName, setFirstName] = useState("");
  const [open, setOpen] = useState({
    partidos: false,
    alineacions: false,
    clasificacions: false,
    axustes: false,
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const full = data?.user?.user_metadata?.full_name || "";
      setFirstName(full.trim().split(/\s+/)[0] || "");
    })();
  }, []);

  const toggle = (k) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  return (
    <main class="dash-wrap">
      <div class="dash-hero two-cols center-hero">
        <div class="dash-hero-col">
          <img src="/logoHDC.jpg" alt="Logo HDC" class="dash-hero-img fill-col" />
        </div>
        <div class="dash-hero-center">
          <p class="dash-greet">
            Boas <span class="dash-name">{firstName}</span>, benvidx á Liga das Aliñacións
          </p>
        </div>
      </div>

      <section class="dash-grid dash-grid--main">
        {/* 1) Partidos do Celta */}
        <div class="main-block">
          <button class="main-card" onClick={() => toggle("partidos")} aria-expanded={open.partidos} aria-controls="sub-partidos">
            <div class="dash-icon dash-icon--ball"><IcoBall /></div>
            <div class="dash-text">
              <h2 class="dash-card-header">Partidos do Celta</h2>
              <p class="dash-card-desc">Calendario e resultados</p>
            </div>
            <span class={`chev ${open.partidos ? "open" : ""}`} aria-hidden="true">▾</span>
          </button>

          <div id="sub-partidos" class={`subgrid ${open.partidos ? "open" : ""}`}>
            <a class="subcard" href="/proximo-partido">
              <div class="sub-ico sub-ico--calendar"><IcoCalendar /></div>
              <div class="sub-texts">
                <div class="sub-title">Próximo partido</div>
                <div class="sub-desc">Detalle do seguinte encontro</div>
              </div>
            </a>
            <a class="subcard" href="/vindeiros-partidos">
              <div class="sub-ico sub-ico--calendar"><IcoCalendar /></div>
              <div class="sub-texts">
                <div class="sub-title">Vindeiros partidos</div>
                <div class="sub-desc">Axenda dos seguintes partidos</div>
              </div>
            </a>
            <a class="subcard" href="/partidos-finalizados">
              <div class="sub-ico sub-ico--flag"><IcoFlag /></div>
              <div class="sub-texts">
                <div class="sub-title">Partidos finalizados</div>
                <div class="sub-desc">Resultados e incidencias</div>
              </div>
            </a>
          </div>
        </div>

        {/* 2) Aliñacións */}
        <div class="main-block">
          <button class="main-card" onClick={() => toggle("alineacions")} aria-expanded={open.alineacions} aria-controls="sub-alineacions">
            <div class="dash-icon dash-icon--shirt"><IcoShirt /></div>
            <div class="dash-text">
              <h2 class="dash-card-header">Aliñacións</h2>
              <p class="dash-card-desc">Convocatoria, once e o teu 11</p>
            </div>
            <span class={`chev ${open.alineacions ? "open" : ""}`} aria-hidden="true">▾</span>
          </button>

          <div id="sub-alineacions" class={`subgrid ${open.alineacions ? "open" : ""}`}>
            <a class="subcard" href="/convocatoria-proximo">
              <div class="sub-ico sub-ico--meg"><IcoMegaphone /></div>
              <div class="sub-texts">
                <div class="sub-title">Convocatoria próximo partido</div>
                <div class="sub-desc">Lista oficial de convocados</div>
              </div>
            </a>
            <a class="subcard" href="/haz-tu-11">
              <div class="sub-ico sub-ico--clip"><IcoClipboard /></div>
              <div class="sub-texts">
                <div class="sub-title">Fai o teu 11</div>
                <div class="sub-desc">Escolle a túa aliñación</div>
              </div>
            </a>
            <a class="subcard" href="/alineacion-oficial">
              <div class="sub-ico sub-ico--shirt"><IcoShirt /></div>
              <div class="sub-texts">
                <div class="sub-title">Aliñación oficial</div>
                <div class="sub-desc">Once confirmado polo club</div>
              </div>
            </a>
            <a class="subcard" href="/instruccions">
              <div class="sub-ico sub-ico--book"><IcoBook /></div>
              <div class="sub-texts">
                <div class="sub-title">Normas do concurso</div>
                <div class="sub-desc">Regras e funcionamento</div>
              </div>
            </a>
          </div>
        </div>

        {/* 3) Clasificacións */}
        <div class="main-block">
          <button class="main-card" onClick={() => toggle("clasificacions")} aria-expanded={open.clasificacions} aria-controls="sub-clasificacions">
            <div class="dash-icon dash-icon--trophy"><IcoTrophy /></div>
            <div class="dash-text">
              <h2 class="dash-card-header">Clasificacións</h2>
              <p class="dash-card-desc">Resultados do xogo</p>
            </div>
            <span class={`chev ${open.clasificacions ? "open" : ""}`} aria-hidden="true">▾</span>
          </button>

          <div id="sub-clasificacions" class={`subgrid ${open.clasificacions ? "open" : ""}`}>
            <a class="subcard" href="/clasificacion?tipo=ultimo">
              <div class="sub-ico sub-ico--tgt"><IcoTarget /></div>
              <div class="sub-texts">
                <div class="sub-title">Clasificación último partido</div>
                <div class="sub-desc">Puntuación por última xornada</div>
              </div>
            </a>
            <a class="subcard" href="/clasificacion?tipo=xeral">
              <div class="sub-ico sub-ico--trophy"><IcoTrophy /></div>
              <div class="sub-texts">
                <div class="sub-title">Clasificación xeral</div>
                <div class="sub-desc">Acumulado da tempada</div>
              </div>
            </a>
          </div>
        </div>

        {/* 4) Axustes */}
        <div class="main-block">
          <button class="main-card" onClick={() => toggle("axustes")} aria-expanded={open.axustes} aria-controls="sub-axustes">
            <div class="dash-icon dash-icon--gear"><IcoGear /></div>
            <div class="dash-text">
              <h2 class="dash-card-header">Axustes</h2>
              <p class="dash-card-desc">Conta e contacto</p>
            </div>
            <span class={`chev ${open.axustes ? "open" : ""}`} aria-hidden="true">▾</span>
          </button>

          <div id="sub-axustes" class={`subgrid ${open.axustes ? "open" : ""}`}>
            <a class="subcard" href="/axustes">
              <div class="sub-ico sub-ico--user"><IcoUser /></div>
              <div class="sub-texts">
                <div class="sub-title">Modificar datos</div>
                <div class="sub-desc">Perfil e preferencias</div>
              </div>
            </a>
            <a class="subcard" href="/incidencia">
              <div class="sub-ico sub-ico--alert"><IcoAlert /></div>
              <div class="sub-texts">
                <div class="sub-title">Comunicar incidencia</div>
                <div class="sub-desc">Soporte e reporte de erros</div>
              </div>
            </a>
            <a class="subcard" href="/propostas">
              <div class="sub-ico sub-ico--msg"><IcoMessage /></div>
              <div class="sub-texts">
                <div class="sub-title">Propostas e/ou comentarios</div>
                <div class="sub-desc">Melloras e feedback</div>
              </div>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
