// src/pages/Dashboard.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";
import "./Dashboard.css";

function Block({ id, color, iconClass, title, desc, children }) {
  const [open, setOpen] = useState(false);
  const wrapCls = `main-block ${open ? `open--${id}` : ""}`;
  return (
    <div class={wrapCls}>
      <a class="main-card" onClick={() => setOpen(v => !v)}>
        <div class={`dash-icon ${iconClass}`} />
        <div class="dash-text">
          <h3 class="dash-card-header">{title}</h3>
          <p class="dash-card-desc">{desc}</p>
        </div>
        <div class={`chev ${open ? "open" : ""}`}>⌃</div>
      </a>
      <div id={`sub-${id}`} class={`subgrid ${open ? "open" : ""}`}>
        {children}
      </div>
    </div>
  );
}

const Sub = ({ className, title, desc }) => (
  <a class={`subcard ${className || ""}`}>
    <div class="sub-ico sub-ico--calendar" />
    <div class="sub-texts">
      <div class="sub-title"><strong>{title}</strong></div>
      <div class="sub-desc">{desc}</div>
    </div>
  </a>
);

export default function Dashboard() {
  const [nome, setNome] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name,full_name")
        .eq("id", uid).maybeSingle();
      const first = (data?.first_name || "").trim();
      const full  = (data?.full_name  || "").trim();
      const greet = first || (full ? full.split(" ")[0] : "");
      setNome(greet || "amigx");
    })();
  }, []);

  return (
    <main class="dash-wrap" style={{ paddingTop: 70 }}>
      <section class="dash-hero two-cols">
        <img src="/logoHDC.jpg" alt="HDC" class="dash-hero-img fill-col" />
        <h2 class="dash-greet">
          Boas <span class="dash-name">{nome}</span>, benvidx á Liga das Aliñacións
        </h2>
      </section>

      <section class="dash-grid dash-grid--main">
        <Block id="partidos" iconClass="dash-icon--ball"
               title="Calendario" desc="Próximos, Vindeiros, Finalizados">
          <Sub title="Próximos partidos" desc="Datas e horarios máis próximos" />
          <Sub title="Vindeiros" desc="Máis aló da próxima xornada" />
          <Sub title="Finalizados" desc="Histórico e resultados" />
        </Block>

        <Block id="alineacions" iconClass="dash-icon--shirt"
               title="Xogar ás Aliñacións" desc="Convocatoria, Fai o teu 11, Aliñación oficial, Normas">
          <Sub title="Convocatoria" desc="Lista de xogadoras/es" />
          <Sub title="Fai o teu 11" desc="Escolle a túa aliñación" />
          <Sub title="Normas" desc="Como se puntúa" />
        </Block>

        <Block id="clasificacions" iconClass="dash-icon--trophy"
               title="Clasificacións" desc="Último partido e Xeral">
          <Sub title="Último partido" desc="Puntos e posto" />
          <Sub title="Xeral" desc="Acumulado da tempada" />
        </Block>
      </section>
    </main>
  );
}

