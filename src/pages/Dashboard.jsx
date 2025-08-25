// src/pages/Dashboard.jsx
import { h } from "preact";
import "./Dashboard.css";

/**
 * Panel principal (version ASCII-safe)
 * - Todas las cards son clicables (no hay botones internos).
 * - Bloque "icono" grande a la izquierda (con abreviatura ASCII), texto a la derecha.
 * - Grid de 2 columnas tambien en movil.
 */
export default function Dashboard() {
  return (
    <main class="dash-wrap">
      <h1 class="dash-title">Panel principal</h1>

      <section class="dash-grid">
        {/* NUEVAS */}
        <a class="dash-card" href="/proximo-partido" aria-label="Proximo partido">
          <div class="dash-icon dash-icon--proximo" aria-hidden="true">PR</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Proximo partido</h2>
            <p class="dash-card-desc">Informacion do seguinte encontro.</p>
          </div>
        </a>

        <a class="dash-card" href="/alineacion-oficial" aria-label="Alineacion oficial">
          <div class="dash-icon dash-icon--alineacion" aria-hidden="true">AL</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Alineacion oficial</h2>
            <p class="dash-card-desc">Once confirmado polo club.</p>
          </div>
        </a>

        <a class="dash-card" href="/convocatoria-oficial" aria-label="Convocatoria oficial">
          <div class="dash-icon dash-icon--convocatoria" aria-hidden="true">CV</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Convocatoria oficial</h2>
            <p class="dash-card-desc">Lista de xogadores convocados.</p>
          </div>
        </a>

        {/* EXISTENTES */}
        <a class="dash-card" href="/partidos?f=pasados" aria-label="Partidos pasados">
          <div class="dash-icon dash-icon--pasados" aria-hidden="true">PS</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Partidos pasados</h2>
            <p class="dash-card-desc">Resultados e datos dos partidos xa disputados.</p>
          </div>
        </a>

        <a class="dash-card" href="/partidos?f=vindeiros" aria-label="Vindeiros partidos">
          <div class="dash-icon dash-icon--vindeiros" aria-hidden="true">VP</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Vindeiros partidos</h2>
            <p class="dash-card-desc">Calendario e detalles dos seguintes encontros.</p>
          </div>
        </a>

        <a class="dash-card" href="/haz-tu-11" aria-label="Fai o teu 11">
          <div class="dash-icon dash-icon--fai11" aria-hidden="true">F11</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Fai o teu 11</h2>
            <p class="dash-card-desc">Escolle a tua alineacion da xornada.</p>
          </div>
        </a>

        <a
          class="dash-card"
          href="/clasificacion?tipo=ultimo"
          aria-label="Clasificacion ultimo partido"
        >
          <div class="dash-icon dash-icon--ultimo" aria-hidden="true">UP</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Clasificacion individual do ultimo partido</h2>
            <p class="dash-card-desc">Puntuacions dos participantes na ultima xornada.</p>
          </div>
        </a>

        <a
          class="dash-card"
          href="/clasificacion?tipo=xeral"
          aria-label="Clasificacion xeral"
        >
          <div class="dash-icon dash-icon--xeral" aria-hidden="true">XR</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Clasificacion xeral</h2>
            <p class="dash-card-desc">Taboa acumulada de toda a liga.</p>
          </div>
        </a>

        <a class="dash-card" href="/instruccions" aria-label="Instrucions, Regras e Premio">
          <div class="dash-icon dash-icon--book" aria-hidden="true">IN</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Instrucions · Regras · Premio</h2>
            <p class="dash-card-desc">Como xogar, normativa e premio final.</p>
          </div>
        </a>

        <a class="dash-card" href="/axustes" aria-label="Axustes">
          <div class="dash-icon dash-icon--gear" aria-hidden="true">AX</div>
          <div class="dash-text">
            <h2 class="dash-card-header">Axustes</h2>
            <p class="dash-card-desc">Perfil e opcions da conta.</p>
          </div>
        </a>
      </section>
    </main>
  );
}
