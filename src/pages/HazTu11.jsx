import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

function safeDecode(s = "") { try { return decodeURIComponent(s); } catch { return s.replace(/%20/g, " "); } }
function parseFromFilename(url = "") {
  const last = (url.split("?")[0].split("#")[0].split("/").pop() || "").trim();
  const m = last.match(/^(\d+)-(.+)-(POR|DEF|CEN|DEL)\.(jpg|jpeg|png|webp)$/i);
  if (!m) return { dorsalFile: null, nameFile: null, posFile: null };
  return { dorsalFile: parseInt(m[1],10), nameFile: safeDecode(m[2].replace(/_/g," ")), posFile: m[3].toUpperCase() };
}
function finalFromAll(p = {}) {
  const { dorsalFile, nameFile, posFile } = parseFromFilename(p.foto_url || "");
  return {
    dorsal: dorsalFile ?? (p.dorsal ?? null),
    pos:    (posFile || "").toUpperCase(),
    nombre: (nameFile || p.nombre || "").trim()
  };
}

const OVERLAY_NUMS = new Set([29,32,39]);
const IMG_H = 320;

const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, sans-serif", fontSize: 26, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 16px", color: "#475569", fontSize: 18, fontWeight: 400 },
  posHeader: { margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },
  grid4: { display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:12 },
  card: { display:"grid", gridTemplateRows: `${IMG_H}px auto`, background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)", border:"1px solid #eef2ff", borderRadius:16, padding:10, boxShadow:"0 2px 8px rgba(0,0,0,.06)", alignItems:"center", textAlign:"center" },
  name: { margin:"8px 0 0", font:"700 15px/1.2 Montserrat, sans-serif", color:"#0f172a" },
  meta: { margin:"2px 0 0", color:"#475569", fontSize:13 }
};

function ImgWithOverlay({ src, alt, dorsal }) {
  const showNum = OVERLAY_NUMS.has(Number(dorsal));
  return (
    <div style={{
      position:"relative", width:"100%", height: IMG_H,
      borderRadius:12, display:"grid", placeItems:"center",
      background:"#f8fafc", border:"1px solid #e5e7eb", overflow:"hidden"
    }}>
      {src ? (
        <img src={src} alt={alt} style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
      ) : (
        <div style={{ color:"#cbd5e1" }}>Sen foto</div>
      )}
      {showNum && (
        <span style={{
          position:"absolute", top: 18, left: 24,
          fontFamily:"Montserrat, sans-serif",
          fontWeight: 600, fontSize: 36, lineHeight: 1, color: "#9aa4b2",
          textShadow:"0 1px 2px rgba(0,0,0,.22)", letterSpacing:"0.5px"
        }}>
          {Number(dorsal)}
        </span>
      )}
    </div>
  );
}

export default function HazTu11() {
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: pub } = await supabase.from("convocatoria_publica").select("jugador_id");
        const ids = (pub || []).map(r => r.jugador_id);
        if (!ids.length) { setJugadores([]); setLoading(false); return; }
        const { data: js } = await supabase.from("jugadores")
          .select("id, nombre, dorsal, foto_url")
          .in("id", ids)
          .order("dorsal", { ascending: true });
        const byId = new Map((js||[]).map(j => [j.id, j]));
        const ordered = ids.map(id => byId.get(id)).filter(Boolean);
        setJugadores(ordered);
      } catch(e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of jugadores || []) {
      const { pos } = finalFromAll(p);
      if (pos && g[pos]) g[pos].push(p);
    }
    return g;
  }, [jugadores]);

  if (loading) return <main style={S.wrap}>Cargando…</main>;

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Fai aquí a túa aliñación</h1>
      <p style={S.sub}>É aquí onde demostras o Giráldez que levas dentro</p>

      {["POR","DEF","CEN","DEL"].map(k => {
        const arr = grouped[k] || [];
        if (!arr.length) return null;
        const label = k === "POR" ? "Porteiros" : k === "DEF" ? "Defensas" : k === "CEN" ? "Medios" : "Dianteiros";
        return (
          <section key={k}>
            <div style={S.posHeader}>{label}</div>
            <div style={S.grid4}>
              {arr.map(p => {
                const { dorsal, nombre, pos } = finalFromAll(p);
                return (
                  <article key={p.id} style={S.card}>
                    <ImgWithOverlay src={p.foto_url} alt={`Foto de ${nombre}`} dorsal={dorsal}/>
                    <div>
                      <p style={S.name}>{dorsal != null ? `${String(dorsal).padStart(2,"0")} · ` : ""}{nombre}</p>
                      <p style={S.meta}>{pos}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
