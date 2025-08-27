// src/pages/Dashboard.jsx
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { supabase } from '../lib/supabaseClient.js';
import './Dashboard.css';

/* ICONOS outline (coherencia cos formularios) */
const IcoBall = () => (
  <svg class="ico-svg" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9"/>
    <path d="M9 7.5l3 1.8 3-1.8M6.5 10l2 2.8-2 2.8M17.5 10l-2 2.8 2 2.8M12 13.8l-2.8 1.6 1 3M12 13.8l2.8 1.6-1 3"/>
  </svg>
);
const IcoShirt = () => (
  <svg class="ico-svg" viewBox="0 0 24 24" fill="none">
    <path d="M8 4l4 2 4-2 3 3-3 3v10H8V10L5 7l3-3z"/>
  </svg>
);
const IcoTrophy = () => (
  <svg class="ico-svg" viewBox="0 0 24 24" fill="none">
    <path d="M8 21h8M9 17h6M8 4h8v3a4 4 0 0 1-8 0V4z"/>
    <path d="M8 6H5a3 3 0 0 0 3 5M16 6h3a3 3 0 0 1-3 5"/>
  </svg>
);
const IcoCalendar = () => (
  <svg class="ico-svg" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M16 3v4M8 3v4M3 10h18"/>
  </svg>
);
const IcoFlag = () => (
  <svg class="ico-svg" viewBox="0 0 24 24" fill="none">
    <path d="M4 4v16"/>
    <path d="M6 5h10l-2 4 2 4H6z"/>
  </svg>
);
const IcoBook = () => (
  <svg class="ico-svg" viewBox="0 0 24 24" fill="none">
    <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/>
    <path d="M6 5h10"/>
  </svg>
);
const IcoTarget = () => (
  <svg class="ico-svg" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M22 12h-2M4 12H2"/>
  </svg>
);
const IcoMegaphone = () => (
  <svg class="ico-svg" viewBox="0 0 24 24" fill="none">
    <path d="M3 11v2l12 5V6L3 11z"/>
    <path d="M17 7h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
    <path d="M7 13v4a2 2 0 0 0 2 2h1"/>
  </svg>
);
const IcoClipboard = () => (
  <svg class="ico-svg" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="5" width="14" height="16" rx="2"/>
    <path d="M9 5V3h6v2M8 9h8M8 13h8M8 17h5"/>
  </svg>
);

function pickFirstNameLike({ first_name, full_name, email }) {
  if (first_name && String(first_name).trim()) {
    const s = String(first_name).trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  if (full_name && String(full_name).trim()) {
    const first = String(full_name).trim().split(/\s+/)[0];
    if (first) return first.charAt(0).toUpperCase() + first.slice(1);
  }
  if (email && String(email).includes('@')) {
    const local = String(email).split('@')[0];
    const token = local.split(/[._-]/)[0] || local;
    if (token) return token.charAt(0).toUpperCase() + token.slice(1);
  }
  return 'Amigx';
}

export default function Dashboard() {
  const [name, setName] = useState('Amigx');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || !mounted) return;

      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('first_name, full_name, email')
          .eq('id', user.id)
          .single();

        const shown = pickFirstNameLike({
          first_name: prof?.first_name,
          full_name: prof?.full_name,
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

  const [open, setOpen] = useState(null);
  const toggle = (key) => setOpen((prev) => (prev === key ? null : key));

  return (
    <div class="dash-wrap">
      {/* HERO */}
      <div class="dash-hero two-cols">
        <img class="dash-hero-img fill-col" src="/logoHDC.jpg" alt="HDC Liga" />
        <div>
          <p class="dash-greet">
            Boas <span class="dash-name">{name}</span>, benvidx á Liga das Aliñacións
          </p>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <section class="dash-grid dash-grid--main">
        {/* Calendario */}
        <article class={`main-block ${open==='partidos' ? 'open--partidos' : ''}`}>
          <a class="main-card" onClick={() => toggle('partidos')}>
            <div class="dash-icon dash-icon--ball"><IcoBall/></div>
            <div class="dash-text">
              <h3 class="dash-card-header">Calendario</h3>
              <p class="dash-card-desc">Próximos, Vindeiros, Finalizados</p>
            </div>
            <span class={`chev ${open==='partidos' ? 'open' : ''}`}>⌄</span>
          </a>
          <div id="sub-partidos" class={`subgrid ${open==='partidos' ? 'open' : ''}`}>
            <a href="/partidos" class="subcard">
              <div class="sub-ico sub-ico--calendar"><IcoCalendar/></div>
              <div class="sub-texts">
                <p class="sub-title">Próximos partidos</p>
                <p class="sub-desc">Datas e horarios máis próximos</p>
              </div>
            </a>
            <a href="/partidos" class="subcard">
              <div class="sub-ico sub-ico--flag"><IcoFlag/></div>
              <div class="sub-texts">
                <p class="sub-title">Vindeiros</p>
                <p class="sub-desc">Máis aló da próxima xornada</p>
              </div>
            </a>
            <a href="/partidos" class="subcard">
              <div class="sub-ico sub-ico--book"><IcoBook/></div>
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
            <div class="dash-icon dash-icon--shirt"><IcoShirt/></div>
            <div class="dash-text">
              <h3 class="dash-card-header">Xogar ás Aliñacións</h3>
              <p class="dash-card-desc">Convocatoria, Fai o teu 11, Aliñación oficial, Normas</p>
            </div>
            <span class={`chev ${open==='alineacions' ? 'open' : ''}`}>⌄</span>
          </a>
          <div id="sub-alineacions" class={`subgrid ${open==='alineacions' ? 'open' : ''}`}>
            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico sub-ico--tgt"><IcoTarget/></div>
              <div class="sub-texts">
                <p class="sub-title">Fai o teu 11</p>
                <p class="sub-desc">Escolle a túa aliñación</p>
              </div>
            </a>
            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico sub-ico--meg"><IcoMegaphone/></div>
              <div class="sub-texts">
                <p class="sub-title">Convocatoria</p>
                <p class="sub-desc">Lista dispoñible de xogadores</p>
              </div>
            </a>
            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico sub-ico--clip"><IcoClipboard/></div>
              <div class="sub-texts">
                <p class="sub-title">Aliñación oficial</p>
                <p class="sub-desc">Publicación do 11 do club</p>
              </div>
            </a>
            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico sub-ico--book"><IcoBook/></div>
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
            <div class="dash-icon dash-icon--trophy"><IcoTrophy/></div>
            <div class="dash-text">
              <h3 class="dash-card-header">Clasificacións</h3>
              <p class="dash-card-desc">Último partido e Xeral</p>
            </div>
            <span class={`chev ${open==='clasificacions' ? 'open' : ''}`}>⌄</span>
          </a>
          <div id="sub-clasificacions" class={`subgrid ${open==='clasificacions' ? 'open' : ''}`}>
            <a href="/clasificacion" class="subcard">
              <div class="sub-ico sub-ico--flag"><IcoFlag/></div>
              <div class="sub-texts">
                <p class="sub-title">Último partido</p>
                <p class="sub-desc">Puntuacións da última xornada</p>
              </div>
            </a>
            <a href="/clasificacion" class="subcard">
              <div class="sub-ico sub-ico--tgt"><IcoTarget/></div>
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

