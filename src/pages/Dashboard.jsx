// src/pages/Dashboard.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import "./Dashboard.css";

export default function Dashboard() {
  const [nome, setNome] = useState("amig@");

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
      {/* Hero — orden original: logo a la izquierda, saludo a la derecha en móvil */}
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

      {/* Grid principal de cards */}
      <section class="dash-grid dash-grid--main">
        <a href="/partidos" class="main-card">
          <div class="dash-icon dash-icon--ball">⚽️</div>
          <div class="dash-text">
            <h3 class="dash-card-header">Calendario</h3>
            <p class="dash-card-desc">Próximos, Vindeiros, Finalizados</p>
          </div>
          <span class="chev">›</span>
        </a>

        <a href="/haz-tu-11" class="main-card">
          <div class="dash-icon dash-icon--shirt">👕</div>
          <div class="dash-text">
            <h3 class="dash-card-header">Xogar ás Aliñacións</h3>
            <p class="dash-card-desc">
              Convocatoria, Fai o teu 11, Aliñación oficial, Normas
            </p>
          </div>
          <span class="chev">›</span>
        </a>

        <a href="/clasificacion" class="main-card">
          <div class="dash-icon dash-icon--trophy">🏆</div>
          <div class="dash-text">
            <h3 class="dash-card-header">Clasificacións</h3>
            <p class="dash-card-desc">Último partido e Xeral</p>
          </div>
          <span class="chev">›</span>
        </a>
      </section>
    </div>
  );
}

