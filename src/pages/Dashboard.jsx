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

/* Icono xogador rematando — balón afastado (non toca pernas nin bordes) */
const IconPlayerShot = ({ color = "#f59e0b", size = 48 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
    stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
  >
    <circle cx="9.2" cy="5.1" r="2.1" />
    <path d="M9.2 7.4L12.6 10.8" />
    <path d="M11.2 9.2l3.2-1.4" />
    <path d="M9.6 9.4L7.2 8.6" />
    <path d="M12.6 10.8L10.8 16.6" />
    <path d="M12.6 10.8L16.2 12.4" />
    <path d="M16.2 12.4L18.0 13.6" />
    <circle cx="20.1" cy="13.2" r="2.0" />
  </svg>
);

/* Icono trofeo (outline) */
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
            {/* Flecha ▾ á esquerda; xira ao abrir */}
            <span class={`chev chev-left ${open==='partidos' ? 'open' : ''}`} style="color:#22c55e">▾</span>
            <div class="dash-text">
              <h3 class="dash-card-header">Calendario</h3>
              <p class="dash-card-desc">Todos os partidos do Celta na tempada 2025/2026</p>
            </div>
          </a>

          {/* Subgrid Calendario */}
          <div id="sub-partidos" class={`subgrid ${open==='partidos' ? 'open' : ''}`}>
            <a href="/partidos?view=proximo" class="subcard">
              <div class="sub-ico">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                     stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4.5" width="12" height="10" rx="2" />
                  <path d="M6 2.5v3M12 2.5v3M3 8.5h12" />
                  <circle cx="18.5" cy="14.5" r="4" />
                  <path d="M18.5 12.5v2l1.4 1" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Próximo partido</p>
                <p class="sub-desc">Seguinte encontro con data e horario confirmados para xogar a HDCLiga</p>
              </div>
            </a>

            <a href="/partidos?view=proximos" class="subcard">
              <div class="sub-ico">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                     stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4.5" width="12" height="10" rx="2" />
                  <path d="M6 2.5v3M12 2.5v3M3 8.5h12" />
                  <path d="M18 8l3 3-3 3M15 8l3 3-3 3" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Vindeiros encontros</p>
                <p class="sub-desc">Partidos de calquera competición establecidos no calendario</p>
              </div>
            </a>

            <a href="/partidos?view=finalizados" class="subcard">
              <div class="sub-ico">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                     stroke="#22c55e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4.5" width="12" height="10" rx="2" />
                  <path d="M6 2.5v3M12 2.5v3M3 8.5h12" />
                  <path d="M16 14l2 2 3-3" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Partidos finalizados</p>
                <p class="sub-desc">Táboa dos partidos xa rematados co seu resultado</p>
              </div>
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
              <IconPlayerShot color="#f59e0b" />
            </div>
            <span class={`chev chev-left ${open==='alineacions' ? 'open' : ''}`} style="color:#f59e0b">▾</span>
            <div class="dash-text">
              <h3 class="dash-card-header">Xogar ás Aliñacións</h3>
              <p class="dash-card-desc">Aquí é onde demostras o Claudio que levas dentro</p>
            </div>
          </a>

          <div id="sub-alineacions" class={`subgrid ${open==='alineacions' ? 'open' : ''}`}>
            <a href="/haz-tu-11?view=convocatoria" class="subcard">
              <div class="sub-ico">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                     stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="6.5" y="5.5" width="11" height="14" rx="2" />
                  <path d="M9 5.5h6" />
                  <path d="M9 9.5h6M9 12.5h6M9 15.5h6" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Convocatoria oficial</p>
                <p class="sub-desc">Lista comunicada polo club para o seguinte partido</p>
              </div>
            </a>

            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                     stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="5" width="16" height="14" rx="2" />
                  <path d="M12 5v14" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Fai aquí a túa aliñación</p>
                <p class="sub-desc">Escolle o teu once antes do peche</p>
              </div>
            </a>

            <a href="/haz-tu-11?view=oficial" class="subcard">
              <div class="sub-ico">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                     stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 5l2-2h6l2 2 2 2v12H5V7z" />
                  <path d="M10 7v4M14 7v4" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Aliñación oficial do partido</p>
                <p class="sub-desc">O once inicial que cruza automaticamente coa túa aliñación</p>
              </div>
            </a>

            <a href="/haz-tu-11?view=normas" class="subcard">
              <div class="sub-ico">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                     stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4.5 5.5h10a2.5 2.5 0 012.5 2.5v10h-10A2.5 2.5 0 014.5 15V5.5z" />
                  <path d="M7.5 8.5h7M7.5 11.5h7" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Regulamento do xogo</p>
                <p class="sub-desc">Todo o que tes que saber para pasalo ben sen cagala</p>
              </div>
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
            <span class={`chev chev-left ${open==='clasificacions' ? 'open' : ''}`} style="color:#a78bfa">▾</span>
            <div class="dash-text">
              <h3 class="dash-card-header">Clasificacións</h3>
              <p class="dash-card-desc">Resultados por partido e xerais de cada quen</p>
            </div>
          </a>

          <div id="sub-clasificacions" class={`subgrid ${open==='clasificacions' ? 'open' : ''}`}>
            {/* ENLACES ACTUALIZADOS A RUTAS BONITAS */}
            <a href="/resultados-ultima-alineacion" class="subcard">
              <div class="sub-ico">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                     stroke="#a78bfa" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="6" />
                  <path d="M12 12l3-3" />
                  <path d="M15 9l2 2" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Resultados da última aliñación</p>
                <p class="sub-desc">Aquí é onde comprobas os teus acertos e os das túas rivais...</p>
              </div>
            </a>

            <a href="/taboa-acertos-acumulados" class="subcard">
              <div class="sub-ico">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                     stroke="#a78bfa" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 19V9M10 19V5M15 19v-7M20 19v-4" />
                </svg>
              </div>
              <div class="sub-texts">
                <p class="sub-title">Táboa de acertos acumulada</p>
                <p class="sub-desc">Clasificación xeral tras os partidos rematados</p>
              </div>
            </a>
          </div>
        </div>

      </section>
    </div>
  );
}


