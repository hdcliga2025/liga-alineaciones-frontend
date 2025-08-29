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

/* Icono xogador (chut): balón afastado das pernas, sen achegarse ao bordo do icono */
const IconPlayerBall = ({ color = "#f59e0b", size = 48 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
    stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
  >
    {/* cabeza */}
    <circle cx="9.4" cy="5.1" r="2.2" />
    {/* tronco inclinado (carreira) */}
    <path d="M9.4 7.6C10.5 9 11 9.7 12 11.1" />
    {/* brazos */}
    <path d="M10.8 9.2l3.4-1.5" />
    <path d="M9.5 9.4L7.0 8.5" />
    {/* perna de apoio */}
    <path d="M12.0 11.1L10.4 16.8" />
    {/* perna que chuta (estirada cara adiante) */}
    <path d="M12.0 11.1L16.9 13.9" />
    {/* balón separado das pernas e lonxe dos bordes */}
    <circle cx="19.2" cy="14.6" r="2.0" />
    {/* pequeno trazo de movemento */}
    <path d="M17.4 13.0l1.2 1.0" />
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
  const [open, setOpen] = useState(""); // '', 'partidos', 'alineacions', 'clasificacions'
  const toggle = (k) => setOpen((cur) => (cur === k ? "" : k));

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

      {/* Grid principal con bloques desplegables */}
      <section class="dash-grid dash-grid--main">

        {/* ===== Calendario ===== */}
        <div class={`main-block ${open==='partidos' ? 'open--partidos' : ''}`}>
          <a
            href="#partidos"
            class="main-card"
            onClick={(e)=>{e.preventDefault(); toggle('partidos');}}
          >
            <div class="dash-icon" style="border:1px solid rgba(34,197,94,.55);">
              <IconCalendar color="#22c55e" />
            </div>
            <div class="dash-text">
              <h3 class="dash-card-header">Calendario</h3>
              <p class="dash-card-desc">Todos os partidos do Celta na tempada 2025/2026</p>
            </div>
            <span class={`chev ${open==='partidos' ? 'open' : ''}`}>›</span>
          </a>

          {/* Subgrid de Calendario — colores ya definidos en Dashboard.css (#sub-partidos.open ...) */}
          <div id="sub-partidos" class={`subgrid ${open==='partidos' ? 'open' : ''}`}>
            <a href="/partidos?view=proximo" class="subcard">
              <div class="sub-ico sub-ico--calendar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="#166534" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4.5" width="18" height="16" rx="2" />
                  <path d="M7 2.5v4M17 2.5v4M3 9h18" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Próximo partido</p>
                <p class="sub-desc">Seguinte encontro con horario confirmado para xogar a HDC Liga</p>
              </div>
              <span class="chev">›</span>
            </a>

            <a href="/partidos?view=proximos" class="subcard">
              <div class="sub-ico sub-ico--calendar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="#166534" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4.5" width="18" height="16" rx="2" />
                  <path d="M7 2.5v4M17 2.5v4M3 9h18" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Próximos partidos</p>
                <p class="sub-desc">Partidos de calquera competición establecidos no calendario</p>
              </div>
              <span class="chev">›</span>
            </a>

            <a href="/partidos?view=finalizados" class="subcard">
              <div class="sub-ico sub-ico--flag">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="#166534" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 3v18" />
                  <path d="M6 4h10l-2 4 2 4H6" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Partidos finalizados</p>
                <p class="sub-desc">Histórico de partidos finalizados con resultado</p>
              </div>
              <span class="chev">›</span>
            </a>
          </div>
        </div>

        {/* ===== Xogar ás Aliñacións ===== */}
        <div class={`main-block ${open==='alineacions' ? 'open--alineacions' : ''}`}>
          <a
            href="#alineacions"
            class="main-card"
            onClick={(e)=>{e.preventDefault(); toggle('alineacions');}}
          >
            <div class="dash-icon" style="border:1px solid rgba(245,158,11,.55);">
              <IconPlayerBall color="#f59e0b" />
            </div>
            <div class="dash-text">
              <h3 class="dash-card-header">Xogar ás Aliñacións</h3>
              <p class="dash-card-desc">Aquí é onde demostras o Claudio que levas dentro</p>
            </div>
            <span class={`chev ${open==='alineacions' ? 'open' : ''}`}>›</span>
          </a>

          {/* Subgrid Alineacións — colores ámbar via #sub-alineacions.open */}
          <div id="sub-alineacions" class={`subgrid ${open==='alineacions' ? 'open' : ''}`}>
            <a href="/haz-tu-11?view=convocatoria" class="subcard">
              <div class="sub-ico sub-ico--flag"></div>
              <div class="sub-texts">
                <p class="sub-title">Convocatoria</p>
                <p class="sub-desc">Lista oficial para a xornada</p>
              </div>
              <span class="chev">›</span>
            </a>

            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico sub-ico--tgt"></div>
              <div class="sub-texts">
                <p class="sub-title">Fai o teu 11</p>
                <p class="sub-desc">Escolle o teu once antes do peche</p>
              </div>
              <span class="chev">›</span>
            </a>

            <a href="/haz-tu-11?view=oficial" class="subcard">
              <div class="sub-ico sub-ico--meg"></div>
              <div class="sub-texts">
                <p class="sub-title">Aliñación oficial</p>
                <p class="sub-desc">Once confirmado polo club</p>
              </div>
              <span class="chev">›</span>
            </a>

            <a href="/haz-tu-11?view=normas" class="subcard">
              <div class="sub-ico sub-ico--book"></div>
              <div class="sub-texts">
                <p class="sub-title">Normas</p>
                <p class="sub-desc">Como xogar e puntuación</p>
              </div>
              <span class="chev">›</span>
            </a>
          </div>
        </div>

        {/* ===== Clasificacións ===== */}
        <div class={`main-block ${open==='clasificacions' ? 'open--clasificacions' : ''}`}>
          <a
            href="#clasificacions"
            class="main-card"
            onClick={(e)=>{e.preventDefault(); toggle('clasificacions');}}
          >
            <div class="dash-icon" style="border:1px solid rgba(167,139,250,.55);">
              <IconTrophy color="#a78bfa" />
            </div>
            <div class="dash-text">
              <h3 class="dash-card-header">Clasificacións</h3>
              <p class="dash-card-desc">Resultados por partido e xerais de cada quen</p>
            </div>
            <span class={`chev ${open==='clasificacions' ? 'open' : ''}`}>›</span>
          </a>

          {/* Subgrid Clasificacións — cores violeta via #sub-clasificacions.open */}
          <div id="sub-clasificacions" class={`subgrid ${open==='clasificacions' ? 'open' : ''}`}>
            <a href="/clasificacion?view=ultimo" class="subcard">
              <div class="sub-ico sub-ico--tgt"></div>
              <div class="sub-texts">
                <p class="sub-title">Último partido</p>
                <p class="sub-desc">Resultados e ranking da última xornada</p>
              </div>
              <span class="chev">›</span>
            </a>

            <a href="/clasificacion?view=xeral" class="subcard">
              <div class="sub-ico sub-ico--book"></div>
              <div class="sub-texts">
                <p class="sub-title">Xeral</p>
                <p class="sub-desc">Clasificación acumulada da tempada</p>
              </div>
              <span class="chev">›</span>
            </a>
          </div>
        </div>

      </section>
    </div>
  );
}


