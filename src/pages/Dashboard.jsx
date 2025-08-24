// src/pages/Dashboard.jsx
import { h } from "preact";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <main class="dash-wrap">
      <h1 class="dash-title">Panel principal</h1>

      <section class="dash-grid">
        {/* NUEVAS CARDS */}
        <a class="dash-card dash-card--media" href="/partidos?f=vindeiros">
          <div class="dash-media dash-media--proximo" aria-hidden="true">⚽</div>
          <div class="dash-body">
            <div class="dash-card-header">Próximo partido</div>
            <p class="dash-card-desc">Información do seguinte encontro.</p>
            <span class="dash-card-cta">Ver</span>
          </div>
        </a>

        <a class="dash-card dash-card--media" href="/alineacion-oficial">
          <div class="dash-media dash-media--alineacion" aria-hidden="true">👕</div>
          <div class="dash-body">
            <div class="dash-card-header">Aliñación oficial</div>
            <p class="dash-card-desc">Once confirmado polo club.</p>
            <span class="dash-card-cta">Ver</span>
          </div>
        </a>

        <a class="dash-card dash-card--media" href="/convocatoria-oficial">
          <div class="dash-media dash-media--convocatoria" aria-hidden="true">📣</div>
          <div class="dash-body">
            <div class="dash-card-header">Convocatoria oficial</div>
            <p class="dash-card-desc">Lista de xogadores convocados.</p>
            <span class="dash-card-cta">Ver</span>
          </div>
        </a>

        {/* EXISTENTES (ahora con el mismo estilo “media izquierda + texto derecha”) */}
        <a class="dash-card dash-card--media" href="/partidos?f=pasados">
          <div class="dash-media dash-media--pasados" aria-hidden="true">🏁</div>
          <div class="dash-body">
            <div class="dash-card-header">Partidos pasados</div>
            <p class="dash-card-desc">Resultados e datos dos partidos xa disputados.</p>
            <span class="dash-card-cta">Ver</span>
          </div>
        </a>

        <a class="dash-card dash-card--media" href="/partidos?f=vindeiros">
          <div class="dash-media dash-media--vindeiros" aria-hidden="true">🗓️</div>
          <div class="dash-body">
            <div class="dash-card-header">Vindeiros partidos</div>
            <p class="dash-card-desc">Calendario e detalles dos seguintes encontros.</p>
            <span class="dash-card-cta">Ver</span>
          </div>
        </a>

        <a class="dash-card dash-card--media" href="/haz-tu-11">
          <div class="dash-media dash-media--fai11" aria-hidden="true">📝</div>
          <div class="dash-body">
            <div class="dash-card-header">Fai o teu 11</div>
            <p class="dash-card-desc">Escolle a túa aliñación da xornada.</p>
            <span class="dash-card-cta">Escoller</span>
          </div>
        </a>

        <a class="dash-card dash-card--media" href="/clasificacion?tipo=ultimo">
          <div class="dash-media dash-media--ultimo" aria-hidden="true">🎯</div>
          <div class="dash-body">
            <div class="dash-card-header">Clasificación individual do último partido</div>
            <p class="dash-card-desc">Puntuacións dos participantes na última xornada.</p>
            <span class="dash-card-cta">Ver</span>
          </div>
        </a>

        <a c

// deploy-bump 2025-08-25T00:26:12

// deploy-bump 2025-08-25T00:28:00
