// src/pages/Dashboard.jsx
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { supabase } from '../lib/supabaseClient.js';
import './Dashboard.css';

export default function Dashboard() {
  const [name, setName] = useState('');
  const [now, setNow] = useState('');

  // Nome do perfil
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || !mounted) return;

      // Tenta obter do perfil (máis fiable que metadata)
      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name, full_name')
        .eq('id', user.id)
        .single();

      const fallback = (user.email || '').split('@')[0] || 'amigx';
      const first = prof?.first_name?.trim();
      const full = prof?.full_name?.trim();
      const shown = first || (full ? full.split(' ')[0] : '') || fallback;
      if (mounted) setName(shown);
    })();
    return () => { mounted = false; };
  }, []);

  // Hora de referencia en Madrid (actualización en vivo)
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat('gl-ES', {
        dateStyle: 'full',
        timeStyle: 'medium',
        timeZone: 'Europe/Madrid',
      }).format(new Date());
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  // Acordeón das cards
  const [open, setOpen] = useState(null); // 'partidos' | 'alineacions' | 'clasificacions' | null
  const toggle = (key) => setOpen((prev) => (prev === key ? null : key));

  return (
    <div class="dash-wrap">
      {/* HERO */}
      <div class="dash-hero two-cols">
        {/* Logo (ajusta o src se o teu ficheiro é outro) */}
        <img class="dash-hero-img fill-col" src="/HDCLogo.png" alt="HDC Liga" />
        <div>
          <p class="dash-greet">
            Boas <span class="dash-name">{name}</span>, benvidx á Liga das Aliñacións
          </p>
          <p class="dash-time">
            Hora de referencia (Madrid): {now}
          </p>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <section class="dash-grid dash-grid--main">
        {/* Calendario */}
        <article class={`main-block ${open==='partidos' ? 'open--partidos' : ''}`}>
          <a class="main-card" onClick={() => toggle('partidos')}>
            <div class="dash-icon dash-icon--ball">⚽</div>
            <div class="dash-text">
              <h3 class="dash-card-header">Calendario</h3>
              <p class="dash-card-desc">Próximos, Vindeiros, Finalizados</p>
            </div>
            <span class={`chev ${open==='partidos' ? 'open' : ''}`}>⌄</span>
          </a>
          <div id="sub-partidos" class={`subgrid ${open==='partidos' ? 'open' : ''}`}>
            <a href="/partidos" class="subcard">
              <div class="sub-ico sub-ico--calendar">🗓️</div>
              <div class="sub-texts">
                <p class="sub-title">Próximos partidos</p>
                <p class="sub-desc">Datas e horarios máis próximos</p>
              </div>
            </a>
            <a href="/partidos" class="subcard">
              <div class="sub-ico sub-ico--flag">🏁</div>
              <div class="sub-texts">
                <p class="sub-title">Vindeiros</p>
                <p class="sub-desc">Máis aló da próxima xornada</p>
              </div>
            </a>
            <a href="/partidos" class="subcard">
              <div class="sub-ico sub-ico--book">📘</div>
              <div class="sub-texts">
                <p class="sub-title">Finalizados</p>
                <p class="sub-desc">Histórico e resultados</p>
              </div>
            </a>
          </div>
        </article>

        {/* Xogar ás Aliñacións */}
        <article class={`main-block ${open==='alineacions' ? 'open--alineacions' : ''}`}>
          <a class="main-card" onClick={() => toggle('alineacions')}>
            <div class="dash-icon dash-icon--shirt">👕</div>
            <div class="dash-text">
              <h3 class="dash-card-header">Xogar ás Aliñacións</h3>
              <p class="dash-card-desc">Convocatoria, Fai o teu 11, Aliñación oficial, Normas</p>
            </div>
            <span class={`chev ${open==='alineacions' ? 'open' : ''}`}>⌄</span>
          </a>
          <div id="sub-alineacions" class={`subgrid ${open==='alineacions' ? 'open' : ''}`}>
            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico sub-ico--tgt">🎯</div>
              <div class="sub-texts">
                <p class="sub-title">Fai o teu 11</p>
                <p class="sub-desc">Escolle a túa aliñación</p>
              </div>
            </a>
            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico sub-ico--meg">📣</div>
              <div class="sub-texts">
                <p class="sub-title">Convocatoria</p>
                <p class="sub-desc">Lista dispoñible de xogadores</p>
              </div>
            </a>
            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico sub-ico--clip">📎</div>
              <div class="sub-texts">
                <p class="sub-title">Aliñación oficial</p>
                <p class="sub-desc">Publicación do 11 do club</p>
              </div>
            </a>
            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico sub-ico--book">📘</div>
              <div class="sub-texts">
                <p class="sub-title">Normas</p>
                <p class="sub-desc">Como se xoga e puntos</p>
              </div>
            </a>
          </div>
        </article>

        {/* Clasificacións */}
        <article class={`main-block ${open==='clasificacions' ? 'open--clasificacions' : ''}`}>
          <a class="main-card" onClick={() => toggle('clasificacions')}>
            <div class="dash-icon dash-icon--trophy">🏆</div>
            <div class="dash-text">
              <h3 class="dash-card-header">Clasificacións</h3>
              <p class="dash-card-desc">Último partido e Xeral</p>
            </div>
            <span class={`chev ${open==='clasificacions' ? 'open' : ''}`}>⌄</span>
          </a>
          <div id="sub-clasificacions" class={`subgrid ${open==='clasificacions' ? 'open' : ''}`}>
            <a href="/clasificacion" class="subcard">
              <div class="sub-ico sub-ico--flag">🏁</div>
              <div class="sub-texts">
                <p class="sub-title">Último partido</p>
                <p class="sub-desc">Puntuacións da última xornada</p>
              </div>
            </a>
            <a href="/clasificacion" class="subcard">
              <div class="sub-ico sub-ico--tgt">🎯</div>
              <div class="sub-texts">
                <p class="sub-title">Xeral</p>
                <p class="sub-desc">Clasificación acumulada</p>
              </div>
            </a>
          </div>
        </article>
      </section>
    </div>
  );
}

