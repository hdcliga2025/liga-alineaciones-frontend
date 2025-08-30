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

/* Fallback: nome dende email */
function nameFromEmail(email = "") {
  const raw = (email.split("@")[0] || "").replace(/[._-]+/g, " ").trim();
  if (!raw) return "";
  const first = raw.split(/\s+/)[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "";
}

export default function Dashboard() {
  const [nome, setNome] = useState("amig@");
  const [open, setOpen] = useState(""); // '', 'partidos', 'alineacions', 'clasificacions'
  const toggle = (k) => setOpen((cur) => (cur === k ? "" : k));

  useEffect(() => {
    let alive = true;

    const computeAndSetName = async () => {
      try {
        const [{ data: s }, { data: u }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);

        const session = s?.session || null;
        const user    = u?.user || null;
        const email   = session?.user?.email || user?.email || "";

        // Se hai sesión, tenta coller do perfil
        const uid = session?.user?.id || user?.id || null;
        if (uid) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("first_name, nombre, full_name, email")
            .eq("id", uid)
            .maybeSingle();

          const first =
            (prof?.first_name || "").trim() ||
            (prof?.nombre || "").trim() ||
            (prof?.full_name || "").trim().split(" ")[0] ||
            (user?.user_metadata?.first_name || "").trim() ||
            nameFromEmail(prof?.email || email) ||
            "";

          if (alive) setNome(first || "amig@");
          return;
        }

        // Sen uid aínda: tenta dende metadata/email
        const mdFirst = (user?.user_metadata?.first_name || "").trim();
        if (alive) setNome(mdFirst || nameFromEmail(email) || "amig@");
      } catch {
        if (alive) setNome("amig@");
      }
    };

    // 1) intento inmediato
    computeAndSetName();

    // 2) suscrición: cando cambie a auth (móbil tardío)
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!alive) return;
      if (session) computeAndSetName();
    });

    // 3) dous reintentos por se tarda en hidratar no móbil
    const t1 = setTimeout(() => alive && computeAndSetName(), 800);
    const t2 = setTimeout(() => alive && computeAndSetName(), 2500);

    return () => {
      alive = false;
      clearTimeout(t1); clearTimeout(t2);
      sub?.subscription?.unsubscribe?.();
    };
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

      {/* Grid principal con bloques despregables */}
      <section class="dash-grid dash-grid--main">

        {/* ===== Calendario ===== */}
        <div class={`main-block ${open === "partidos" ? "open--partidos" : ""}`}>
          <a
            href="#partidos"
            class="main-card"
            onClick={(e) => { e.preventDefault(); setOpen(open === "partidos" ? "" : "partidos"); }}
          >
            <div class="dash-icon" style="border:1px solid rgba(34,197,94,.55);">
              <Calendar color="#22c55e" size={40} />
            </div>
            <span class={`chev ${open === "partidos" ? "open" : ""}`} style="color:#22c55e">▾</span>
            <div class="dash-text">
              <h3 class="dash-card-header">Calendario</h3>
              <p class="dash-card-desc">Todos os partidos do Celta na tempada 2025/2026</p>
            </div>
          </a>

          <div id="sub-partidos" class={`subgrid ${open === "partidos" ? "open" : ""}`}>
            <a href="/partidos?view=proximo" class="subcard">
              <div class="sub-ico" style="border:1px solid rgba(34,197,94,.55);">
                <CalendarClock color="#22c55e" size={36} />
              </div>
              <div class="sub-texts">
                <p class="sub-title" style="color:#22c55e">Próximo partido</p>
                <p class="sub-desc">Seguinte encontro con data e horario confirmados para xogar a HDCLiga</p>
              </div>
            </a>

            <a href="/partidos?view=proximos" class="subcard">
              <div class="sub-ico" style="border:1px solid rgba(34,197,94,.55);">
                <CalendarChevrons color="#22c55e" size={36} />
              </div>
              <div class="sub-texts">
                <p class="sub-title" style="color:#22c55e">Vindeiros encontros</p>
                <p class="sub-desc">Partidos de calquera competición establecidos no calendario</p>
              </div>
            </a>

            <a href="/partidos?view=finalizados" class="subcard">
              <div class="sub-ico" style="border:1px solid rgba(34,197,94,.55);">
                <CalendarCheck color="#22c55e" size={36} />
              </div>
              <div class="sub-texts">
                <p class="sub-title" style="color:#22c55e">Partidos finalizados</p>
                <p class="sub-desc">Táboa dos partidos xa rematados co seu resultado</p>
              </div>
            </a>
          </div>
        </div>

        {/* ===== Xogar ás Aliñacións ===== */}
        <div class={`main-block ${open === "alineacions" ? "open--alineacions" : ""}`}>
          <a
            href="#alineacions"
            class="main-card"
            onClick={(e) => { e.preventDefault(); setOpen(open === "alineacions" ? "" : "alineacions"); }}
          >
            <div class="dash-icon" style="border:1px solid rgba(245,158,11,.55);">
              <PlayerShot color="#f59e0b" size={46} />
            </div>
            <span class={`chev ${open === "alineacions" ? "open" : ""}`} style="color:#f59e0b">▾</span>
            <div class="dash-text">
              <h3 class="dash-card-header">Xogar ás Aliñacións</h3>
              <p class="dash-card-desc">Aquí é onde demostras o Claudio que levas dentro</p>
            </div>
          </a>

          <div id="sub-alineacions" class={`subgrid ${open === "alineacions" ? "open" : ""}`}>
            <a href="/haz-tu-11?view=convocatoria" class="subcard">
              <div class="sub-ico" style="border:1px solid rgba(245,158,11,.55);">
                <Clipboard color="#f59e0b" size={36} />
              </div>
              <div class="sub-texts">
                <p class="sub-title" style="color:#f59e0b">Convocatoria oficial</p>
                <p class="sub-desc">Lista comunicada polo club para o seguinte partido</p>
              </div>
            </a>

            <a href="/haz-tu-11" class="subcard">
              <div class="sub-ico" style="border:1px solid rgba(245,158,11,.55);">
                <Pitch color="#f59e0b" size={36} />
              </div>
              <div class="sub-texts">
                <p class="sub-title" style="color:#f59e0b">Fai aquí a túa aliñación</p>
                <p class="sub-desc">Escolle o teu once antes do peche</p>
              </div>
            </a>

            <a href="/haz-tu-11?view=oficial" class="subcard">
              <div class="sub-ico" style="border:1px solid rgba(245,158,11,.55);">
                <Shirt color="#f59e0b" size={36} />
              </div>
              <div class="sub-texts">
                <p class="sub-title" style="color:#f59e0b">Aliñación oficial do partido</p>
                <p class="sub-desc">O once inicial que cruza automaticamente coa túa aliñación</p>
              </div>
            </a>

            <a href="/haz-tu-11?view=normas" class="subcard">
              <div class="sub-ico" style="border:1px solid rgba(245,158,11,.55);">
                <Book color="#f59e0b" size={36} />
              </div>
              <div class="sub-texts">
                <p class="sub-title" style="color:#f59e0b">Regulamento do xogo</p>
                <p class="sub-desc">Todo o que tes que saber para pasalo ben sen cagala</p>
              </div>
            </a>
          </div>
        </div>

        {/* ===== Clasificacións ===== */}
        <div class={`main-block ${open === "clasificacions" ? "open--clasificacions" : ""}`}>
          <a
            href="#clasificacions"
            class="main-card"
            onClick={(e) => { e.preventDefault(); setOpen(open === "clasificacions" ? "" : "clasificacions"); }}
          >
            <div class="dash-icon" style="border:1px solid rgba(167,139,250,.55);">
              <Trophy color="#a78bfa" size={40} />
            </div>
            <span class={`chev ${open === "clasificacions" ? "open" : ""}`} style="color:#a78bfa">▾</span>
            <div class="dash-text">
              <h3 class="dash-card-header">Clasificacións</h3>
              <p class="dash-card-desc">Resultados por partido e xerais de cada quen</p>
            </div>
          </a>

          <div id="sub-clasificacions" class={`subgrid ${open === "clasificacions" ? "open" : ""}`}>
            <a href="/resultados-ultima-alineacion" class="subcard">
              <div class="sub-ico" style="border:1px solid rgba(167,139,250,.55);">
                <Target color="#a78bfa" size={36} />
              </div>
              <div class="sub-texts">
                <p class="sub-title" style="color:#a78bfa">Resultados da última aliñación</p>
                <p class="sub-desc">Aquí é onde comprobas os teus acertos e os das túas rivais...</p>
              </div>
            </a>

            <a href="/taboa-acertos-acumulados" class="subcard">
              <div class="sub-ico" style="border:1px solid rgba(167,139,250,.55);">
                <Bars color="#a78bfa" size={36} />
              </div>
              <div class="sub-texts">
                <p class="sub-title" style="color:#a78bfa">Táboa de acertos acumulada</p>
                <p class="sub-desc">Clasificación xeral tras os partidos rematados</p>
              </div>
            </a>
          </div>
        </div>

      </section>
    </div>
  );
}

