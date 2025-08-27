// src/pages/Dashboard.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";
import "./Dashboard.css";

export default function Dashboard() {
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", uid)
        .maybeSingle();
      if (mounted) setFirstName((data?.first_name || "").trim());
    })();
    return () => { mounted = false; };
  }, []);

  const nome = firstName || "amig@";

  return (
    <main class="dash-wrap">
      <div class="dash-hero two-cols">
        <img class="dash-hero-img fill-col" src="/logoHDC.jpg" alt="HDC" />
        <h2 class="dash-greet">
          Boas <span class="dash-name">{nome}</span>, benvidx á Liga das Aliñacións
        </h2>
      </div>

      {/* Aquí va tu grid/cards existente */}
      <div class="dash-grid dash-grid--main">
        <a class="main-block open--partidos main-card" href="/partidos">
          <div class="dash-icon dash-icon--ball"><span>⚽</span></div>
          <div class="dash-text">
            <p class="dash-card-header"><b>Calendario</b></p>
            <p class="dash-card-desc">Próximo • Vindeiros • Finalizados</p>
          </div>
          <div class="chev">⌄</div>
        </a>

        <a class="main-block open--alineacions main-card" href="/haz-tu-11">
          <div class="dash-icon dash-icon--shirt"><span>👕</span></div>
          <div class="dash-text">
            <p class="dash-card-header"><b>Xogar ás Aliñacións</b></p>
            <p class="dash-card-desc">Convocatoria • Fai o teu 11 • Oficial • Normas</p>
          </div>
          <div class="chev">⌄</div>
        </a>

        <a class="main-block open--clasificacions main-card" href="/clasificacion">
          <div class="dash-icon dash-icon--trophy"><span>🏆</span></div>
          <div class="dash-text">
            <p class="dash-card-header"><b>Clasificacións</b></p>
            <p class="dash-card-desc">Último partido • Xeral</p>
          </div>
          <div class="chev">⌄</div>
        </a>
      </div>
    </main>
  );
}

