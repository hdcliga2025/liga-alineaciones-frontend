// src/pages/HazTu11.jsx
import { h } from "preact";
import { useMemo } from "preact/hooks";

/** Base de fotos:
 *  - Preferible por ENV: VITE_FOTOS_BASE_URL
 *  - Fallback: GitHub Pages do repo
 */
const BASE_URL =
  (import.meta?.env?.VITE_FOTOS_BASE_URL && String(import.meta.env.VITE_FOTOS_BASE_URL)) ||
  "https://hdcliga2025.github.io/fotos-celta";

/** Lista inicial (a partir dos ficheiros que me amosaches)
 *  Formato de ficheiro: "<dorsal>-<Nome Apelidos>-<POS>.jpg"
 *  Garda exactamente o nome do ficheiro para cadrar 1:1 co repo.
 */
const PLAYERS = [
  { dorsal: 1,  name: "Iván Villar",             pos: "POR", file: "1-Iván Villar-POR.jpg" },
  { dorsal: 2,  name: "Carl Starfelt",           pos: "DEF", file: "2-Carl Starfelt-DEF.jpg" },
  { dorsal: 3,  name: "Óscar Mingueza",          pos: "DEF", file: "3-Óscar Mingueza-DEF.jpg" },
  { dorsal: 4,  name: "Joseph Aidoo",            pos: "DEF", file: "4-Joseph Aidoo-DEF.jpg" },
  { dorsal: 5,  name: "Sergio Carreira",         pos: "DEF", file: "5-Sergio Carreira-DEF.jpg" },
  { dorsal: 6,  name: "Ilaix Moriba",            pos: "CEN", file: "6-Ilaix Moriba-CEN.jpg" },
  { dorsal: 7,  name: "Borja Iglesias",          pos: "DEL", file: "7-Borja Iglesias-DEL.jpg" },
  { dorsal: 8,  name: "Fran Beltrán",            pos: "CEN", file: "8-Fran Beltrán-CEN.jpg" },
  { dorsal: 9,  name: "Ferran Jutglà",           pos: "DEL", file: "9-Ferran Jutglà-DEL.jpg" },
  { dorsal: 10, name: "Iago Aspas",              pos: "DEL", file: "10-Iago Aspas-DEL.jpg" },
  { dorsal: 11, name: "Franco Cervi",            pos: "DEL", file: "11-Franco Cervi-DEL.jpg" },
  { dorsal: 12, name: "Manu Fernández",          pos: "CEN", file: "12-Manu Fernández-CEN.jpg" },
  { dorsal: 13, name: "Andrei Radu",             pos: "POR", file: "13-Andrei Radu-POR.jpg" },
  { dorsal: 14, name: "Damián Rodríguez",        pos: "CEN", file: "14-Damián Rodríguez-CEN.jpg" },
  { dorsal: 15, name: "Bryan Zaragoza",          pos: "DEL", file: "15-Bryan Zaragoza-DEL.jpg" },
  { dorsal: 16, name: "Miguel Román",            pos: "CEN", file: "16-Miguel Román-CEN.jpg" },
  { dorsal: 17, name: "Javi Rueda",              pos: "DEF", file: "17-Javi Rueda-DEF.jpg" },
  { dorsal: 18, name: "Pablo Durán",             pos: "DEL", file: "18-Pablo Durán-DEL.jpg" },
  { dorsal: 19, name: "Williot Swedberg",        pos: "DEL", file: "19-Williot Swedberg-DEL.jpg" },
  { dorsal: 20, name: "Marcos Alonso",           pos: "DEF", file: "20-Marcos Alonso-DEF.jpg" },
  { dorsal: 21, name: "Mihailo Ristic",          pos: "DEF", file: "21-Mihailo Ristic-DEF.jpg" },
  { dorsal: 22, name: "Hugo Sotelo",             pos: "CEN", file: "22-Hugo Sotelo-CEN.jpg" },
  { dorsal: 23, name: "Hugo Álvarez",            pos: "DEL", file: "23-Hugo Álvarez-DEL.jpg" }, // (no repo)
  { dorsal: 24, name: "Carlos Domínguez",        pos: "DEF", file: "24-Carlos Domínguez-DEF.jpg" },
  { dorsal: 25, name: "Marc Vidal",              pos: "POR", file: "25-Marc Vidal-POR.jpg" },
  { dorsal: 31, name: "Yoel Lago",               pos: "DEF", file: "31-Yoel Lago-DEF.jpg" },
  { dorsal: 32, name: "Javi Rodríguez",          pos: "DEF", file: "32-Javi Rodríguez-DEF.jpg" },
  { dorsal: 39, name: "Jones El-Abdellaoui",     pos: "DEL", file: "39-Jones El-Abdellaoui-DEL.jpg" },
];

/* Silueta fallback (outline, en liña co resto de iconas) */
const Silhouette = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
       stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="8" r="3.2" />
    <path d="M4.5 19.5a7.5 7.5 0 0 1 15 0" />
  </svg>
);

function PlayerCard({ p }) {
  const url = useMemo(() => {
    // encodeURIComponent para o nome exacto do ficheiro (tildes, espazos…)
    return `${BASE_URL}/${encodeURIComponent(p.file)}`;
  }, [p.file]);

  const styles = {
    card: {
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      background: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,.05)",
      padding: 12,
      display: "grid",
      gridTemplateColumns: "72px 1fr",
      gap: 10,
      alignItems: "center",
      transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
    },
    imgWrap: {
      width: 72, height: 72, borderRadius: 14,
      display: "grid", placeItems: "center",
      overflow: "hidden",
      background: "linear-gradient(135deg,#e0f2fe,#bae6fd)",
      border: "1px solid #e2e8f0",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.6), 0 2px 8px rgba(0,0,0,.08)",
    },
    img: { width: "100%", height: "100%", objectFit: "cover" },
    name: { margin: 0, fontFamily: "Montserrat,system-ui,sans-serif", fontWeight: 700, fontSize: 15, color: "#0f172a" },
    meta: { margin: "2px 0 0", color: "#475569", fontSize: 13 },
    tag:  {
      fontSize: 12, fontWeight: 800, color: "#0369a1",
      border: "1px solid #7dd3fc", padding: "2px 8px",
      borderRadius: 9999, background: "#e0f2fe",
      justifySelf: "start"
    }
  };

  // Fallback cando a imaxe non carga
  const onErr = (e) => {
    const wrap = e.currentTarget?.parentElement;
    if (wrap) {
      wrap.innerHTML = ""; // limpa o <img>
      wrap.appendChild(<Silhouette size={40} />);
    }
  };

  return (
    <article style={styles.card} class="player-card">
      <div style={styles.imgWrap}>
        {/* Nota: Preact non permite montar JSX directamente con appendChild.
           O fallback real faise substituíndo o src por 1x1 transparente. */}
        <img
          alt={p.name}
          src={url}
          style={styles.img}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            // poñemos un span con iniciais como fallback adicional
            const span = document.createElement("span");
            span.textContent = p.name.split(" ").map(s => s[0]).join("").slice(0,3).toUpperCase();
            span.style.font = "700 16px Montserrat,system-ui,sans-serif";
            span.style.color = "#0f172a";
            span.style.opacity = "0.65";
            e.currentTarget.parentElement.appendChild(span);
          }}
        />
      </div>
      <div>
        <h4 style={styles.name}>{p.name}</h4>
        <p style={styles.meta}>Dorsal {p.dorsal} · {p.pos}</p>
        <span style={styles.tag}>Xogador</span>
      </div>
    </article>
  );
}

export default function HazTu11() {
  const shell = {
    maxWidth: 1080, margin: "0 auto", padding: "16px 12px 24px"
  };
  const head = {
    textAlign: "center", margin: "6px auto 18px",
    fontFamily: "Montserrat,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
  };
  const h1 = { margin: "0 0 6px", fontWeight: 800, fontSize: 22, color: "#0f172a" };
  const p = { margin: 0, color: "#475569", fontSize: 14 };

  const grid = {
    width: "min(92vw,1080px)",
    margin: "0 auto",
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(1,minmax(0,1fr))",
  };
  const mq560 = "@media(min-width:560px)";
  const mq960 = "@media(min-width:960px)";

  // “CSS” responsivo inline vía atributo style non soporta @media.
  // Facemos un pequeno hack con data-attrs + CSS global embebido:
  const gridClass = "haz-grid";

  return (
    <main style={shell}>
      <style>
        {`
          .haz-grid{
            width:min(92vw,1080px);
            margin:0 auto;
            display:grid;
            gap:12px;
            grid-template-columns:repeat(1,minmax(0,1fr));
          }
          @media(min-width:560px){
            .haz-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); }
          }
          @media(min-width:960px){
            .haz-grid{ grid-template-columns:repeat(3,minmax(0,1fr)); }
          }
          .player-card:hover{
            transform:translateY(-2px);
            box-shadow:0 10px 24px rgba(0,0,0,.10);
            border-color:#e2e8f0;
          }
        `}
      </style>

      <header style={head}>
        <h1 style={h1}>Fai o teu 11</h1>
        <p style={p}>
          Escolle os titulares para o próximo encontro. As fotos cárganse dende o repositorio oficial da peña.
        </p>
      </header>

      <section class={gridClass} aria-live="polite">
        {PLAYERS.map((pl) => (
          <PlayerCard key={`${pl.dorsal}-${pl.name}`} p={pl} />
        ))}
      </section>
    </main>
  );
}
