// src/pages/Dashboard.jsx
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../lib/supabaseClient.js';
import './Dashboard.css';

function pickFirstNameLike({ first_name, full_name, email }) {
  // 1) se hai first_name, úsase tal cal
  if (first_name && String(first_name).trim()) {
    const s = String(first_name).trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  // 2) se hai full_name, colle a primeira palabra
  if (full_name && String(full_name).trim()) {
    const first = String(full_name).trim().split(/\s+/)[0];
    if (first) return first.charAt(0).toUpperCase() + first.slice(1);
  }
  // 3) se non, derivar do email (parte antes do @, cortando por . _ -)
  if (email && String(email).includes('@')) {
    const local = String(email).split('@')[0];
    const token = local.split(/[._-]/)[0] || local;
    if (token) return token.charAt(0).toUpperCase() + token.slice(1);
  }
  return 'Amigx';
}

export default function Dashboard() {
  const [name, setName] = useState('Amigx');
  const [now, setNow] = useState('');

  // Cargar nome desde profiles (ou metadatos/email como fallback)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || !mounted) return;

      let first_name, full_name;
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('first_name, full_name, email')
          .eq('id', user.id)
          .single();

        first_name = prof?.first_name ?? undefined;
        full_name  = prof?.full_name ?? undefined;

        const shown = pickFirstNameLike({
          first_name,
          full_name,
          email: prof?.email || user.email
        });
        if (mounted) setName(shown);
      } catch {
        const shown = pickFirstNameLike({
          first_name: undefined,
          full_name: user.user_metadata?.full_name,
          email: user.email
        });
        if (mounted) setName(shown);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Hora en Madrid (sen etiqueta), refresco en vivo
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat('gl-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Europe/Madrid'
      }).format(new Date());
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  // Acordeón das cards
  const [open, setOpen] = useState('partidos'); // aberto por defecto como na captura
  const toggle = (key) => setOpen((prev) => (prev === key ? null : key));

  return (
    <div class="dash-wrap">
      {/* HERO */}
      <div class="dash-hero two-cols">
        {/* O logo está en /public/logoHDC.jpg => ruta pública /logoHDC.jpg */}
        <img class="dash-hero-img fill-col" src="/logoHDC.jpg" alt="HDC Liga" />
        <div>
          <p class="dash-greet">
            Boas <span class="dash-name">{name}</span>, benvidx á Liga das Aliñacións
          </p>
          {/* Só a data/hora, sen texto previo */}
          <p class="dash-time">{now}</p>
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

