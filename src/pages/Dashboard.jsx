// src/pages/Dashboard.jsx
import { h } from "preact";
import "./Dashboard.css";

/**
 * Panel principal
 * - Cards clicables (sin botones internos).
 * - Icono grande a la izquierda (emojis con escapes Unicode, 100% ASCII-safe).
 * - Grid de 2 columnas también en móvil.
 */
export default function Dashboard() {
  return (
    <main class="dash-wrap">
      <h1 class="dash-title">Panel principal</h1>

      <section class="dash-grid">
        {/* NUEVAS */}
        <a class="dash-card" href="/proximo-partido" aria-label="Próximo partido">
          <div class="dash-icon dash-icon--proximo" aria-hidden="true">{'\u26BD'}</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Próximo partido</h2>
            <p class="dash-card-desc">Información do seguinte encontro.</p>
          </div>
        </a>

        <a class="dash-card" href="/alineacion-oficial" aria-label="Aliñación oficial">
          <div class="dash-icon dash-icon--alineacion" aria-hidden="true">{'\uD83D\uDC55'}</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Aliñación oficial</h2>
            <p class="dash-card-desc">Once confirmado polo club.</p>
          </div>
        </a>

        <a class="dash-card" href="/convocatoria-oficial" aria-label="Convocatoria oficial">
          <div class="dash-icon dash-icon--convocatoria" aria-hidden="true">{'\uD83D\uDCE3'}</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Convocatoria oficial</h2>
            <p class="dash-card-desc">Lista de xogadores convocados.</p>
          </div>
        </a>

        {/* EXISTENTES */}
        <a class="dash-card" href="/partidos?f=pasados" aria-label="Partidos pasados">
          <div class="dash-icon dash-icon--pasados" aria-hidden="true">{'\uD83C\uDFC1'}</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Partidos pasados</h2>
            <p class="dash-card-desc">Resultados e datos dos partidos xa disputados.</p>
          </div>
        </a>

        <a class="dash-card" href="/partidos?f=vindeiros" aria-label="Vindeiros partidos">
          <div class="dash-icon dash-icon--vindeiros" aria-hidden="true">{'\uD83D\uDCC5'}</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Vindeiros partidos</h2>
            <p class="dash-card-desc">Calendario e detalles dos seguintes encontros.</p>
          </div>
        </a>

        <a class="dash-card" href="/haz-tu-11" aria-label="Fai o teu 11">
          <div class="dash-icon dash-icon--fai11" aria-hidden="true">{'\uD83D\uDCDD'}</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Fai o teu 11</h2>
            <p class="dash-card-desc">Escolle a túa aliñación da xornada.</p>
          </div>
        </a>

        <a
          class="dash-card"
          href="/clasificacion?tipo=ultimo"
          aria-label="Clasificación último partido"
        >
          <div class="dash-icon dash-icon--ultimo" aria-hidden="true">{'\uD83C\uDFAF'}</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Clasificación individual do último partido</h2>
            <p class="dash-card-desc">Puntuacións dos participantes na última xornada.</p>
          </div>
        </a>

        <a
          class="dash-card"
          href="/clasificacion?tipo=xeral"
          aria-label="Clasificación xeral"
        >
          <div class="dash-icon dash-icon--xeral" aria-hidden="true">{'\uD83C\uDFC6'}</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Clasificación xeral</h2>
            <p class="dash-card-desc">Táboa acumulada de toda a liga.</p>
          </div>
        </a>

        <a class="dash-card" href="/instruccions" aria-label="Instrucións, Regras e Premio">
          <div class="dash-icon dash-icon--book" aria-hidden="true">{'\uD83D\uDCD8'}</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Instrucións · Regras · Premio</h2>
            <p class="dash-card-desc">Como xogar, normativa e premio final.</p>
          </div>
        </a>

        <a class="dash-card" href="/axustes" aria-label="Axustes">
          <div class="dash-icon dash-icon--gear" aria-hidden="true">{'\u2699\uFE0F'}</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Axustes</h2>
            <p class="dash-card-desc">Perfil e opcións da conta.</p>
          </div>
        </a>
      </section>
    </main>
  );
}
