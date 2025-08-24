// src/pages/Dashboard.jsx
import { h } from "preact";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <main class="dash-wrap">
      <h1 class="dash-title">Panel principal</h1>

      <section class="dash-grid">
        <a class="dash-card" href="/partidos?f=pasados">
          <div class="dash-card-header">🏁 Partidos pasados</div>
          <p class="dash-card-desc">Resultados e datos dos partidos xa disputados.</p>
          <span class="dash-card-cta">Ver</span>
        </a>

        <a class="dash-card" href="/partidos?f=vindeiros">
          <div class="dash-card-header">🗓️ Vindeiros partidos</div>
          <p class="dash-card-desc">Calendario e detalles dos seguintes encontros.</p>
          <span class="dash-card-cta">Ver</span>
        </a>

        <a class="dash-card" href="/haz-tu-11">
          <div class="dash-card-header">📝 Fai o teu 11</div>
          <p class="dash-card-desc">Escolle a túa aliñación da xornada.</p>
          <span class="dash-card-cta">Escoller</span>
        </a>

        <a class="dash-card" href="/clasificacion?tipo=ultimo">
          <div class="dash-card-header">🎯 Clasificación individual do último partido</div>
          <p class="dash-card-desc">Puntuacións dos participantes na última xornada.</p>
          <span class="dash-card-cta">Ver</span>
        </a>

        <a class="dash-card" href="/clasificacion?tipo=xeral">
          <div class="dash-card-header">🏆 Clasificación xeral</div>
          <p class="dash-card-desc">Táboa acumulada de toda a liga.</p>
          <span class="dash-card-cta">Ver</span>
        </a>

        <a class="dash-card" href="/instruccions">
          <div class="dash-card-header">📘 Instrucións · Regras · Premio</div>
          <p class="dash-card-desc">Como xogar, normativa e premio final.</p>
          <span class="dash-card-cta">Ler</span>
        </a>

        <a class="dash-card" href="/axustes">
          <div class="dash-card-header">⚙️ Axustes</div>
          <p class="dash-card-desc">Perfil e opcións da conta.</p>
          <span class="dash-card-cta">Abrir</span>
        </a>
      </section>
    </main>
  );
}
