// src/pages/Dashboard.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import "./Dashboard.css";

/* Iconos centralizados */
import {
  Calendar, PlayerShot, Trophy,
  CalendarClock, CalendarChevrons, CalendarCheck,
  Clipboard, Pitch, Shirt, Book, Target, Bars
} from "../components/icons.jsx";

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
              <Calendar color="#22c55e" size={40} />
            </div>
            <span class={`chev chev-left ${open==='partidos' ? 'open' : ''}`} style="color:#22c55e">▾</span>
            <div class="dash-text">
              <h3 class="dash-card-header">Calendario</h3>
              <p class="dash-card-desc">Todos os partidos do Celta na tempada 2025/2026</p>
            </div>
          </a>

          <div id="sub-partidos" class={`subgrid ${open==='partidos' ? 'open' : ''}`}>
            <a href="/partidos?view=proximo" class="subcard">
              <div class="sub-ico">
                <CalendarClock color="#22c55e" size={34} />
              </div>
              <div class="sub-texts">
                <p class="sub-title">Próximo partido</p>
                <p class="sub-desc">Seguinte encontro con data e horario confirmados para xogar a HDCLiga</p>
              </div>
            </a>

            <a href="/partidos?view=proximos" class="subcard">
              <div class="sub-ico">
                <CalendarChevrons color="#22c55e" size={34} />
              </div>
              <div class="sub-texts">
                <p class="sub-title">Vindeiros encontros</p>
                <p class="sub-desc">Partidos de calquera competición establecidos no calendario</p>
              </div>
            </a>

            <a href="/partidos?view=finalizados" class="subcard">
              <div class="sub-ico">
                <CalendarCheck color="#22c55e" size={34} />
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
              <PlayerShot color="#f59e0b" size={46} />
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
                <Clipboard color="#f59e0b" size={34} />
              </div>
              <div class="sub-texts">
                <p class="sub-title">Convocatoria oficial</p>
                <p class="sub-desc">Lista comunicada polo club para o seguinte partido</p>
              </div>
            </a>

            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico">
                <Pitch color="#f59e0b" size={34} />
              </div>
              <div class="sub-texts">
                <p class="sub-title">Fai aquí a túa aliñación</p>
                <p class="sub-desc">Escolle o teu once antes do peche</p>
              </div>
            </a>

            <a href="/haz-tu-11?view=oficial" class="subcard">
              <div class="sub-ico">
                <Shirt color="#f59e0b" size={34} />
              </div>
              <div class="sub-texts">
                <p class="sub-title">Aliñación oficial do partido</p>
                <p class="sub-desc">O once inicial que cruza automaticamente coa túa aliñación</p>
              </div>
            </a>

            <a href="/haz-tu-11?view=normas" class="subcard">
              <div class="sub-ico">
                <Book color="#f59e0b" size={34} />
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
              <Trophy color="#a78bfa" size={40} />
            </div>
            <span class={`chev chev-left ${open==='clasificacions' ? 'open' : ''}`} style="color:#a78bfa">▾</span>
            <div class="dash-text">
              <h3 class="dash-card-header">Clasificacións</h3>
              <p class="dash-card-desc">Resultados por partido e xerais de cada quen</p>
            </div>
          </a>

          <div id="sub-clasificacions" class={`subgrid ${open==='clasificacions' ? 'open' : ''}`}>
            <a href="/resultados-ultima-alineacion" class="subcard">
              <div class="sub-ico">
                <Target color="#a78bfa" size={34} />
              </div>
              <div class="sub-texts">
                <p class="sub-title">Resultados da última aliñación</p>
                <p class="sub-desc">Aquí é onde comprobas os teus acertos e os das túas rivais...</p>
              </div>
            </a>

            <a href="/taboa-acertos-acumulados" class="subcard">
              <div class="sub-ico">
                <Bars color="#a78bfa" size={34} />
              </div>
              <div class="sub-texts">
                <p class="sub-title">Táboa de acertos acumulada</p>
                <p class="sub-desc">Clasificación xeral tras os partidos rematados</p>
              </div>
            </a>
          </div>
        </div>

      </section

