import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* Utils */
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
const cap = (s="") => (s || "").toUpperCase();

const OVERLAY_NUMS = new Set([29,32,39]);
const IMG_H = 320;

const S = {
  wrap: { maxWidth: 1080, margin: "0 auto", padding: 16 },
  h1: { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 24, margin: "6px 0 2px", color: "#0f172a" },
  sub: { margin: "0 0 16px", color: "#475569", fontSize: 16, fontWeight: 400 },
  resumen: {
    margin:"0 0 14px", padding:"12px 14px", borderRadius:12,
    border:"1px solid #dbeafe",
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)", color:"#0f172a"
  },
  resumeLine: { margin: 0, fontSize: 19, fontWeight: 400, letterSpacing: ".35px", lineHeight: 1.5 },
  posHeader: { margin:"16px 0 10px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },
  grid4: { display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:12 },
  card: { display:"grid", gridTemplateRows: `${IMG_H}px auto`,
    background:"linear-gradient(180deg,#f0f9ff,#e0f2fe)",
    border:"1px solid #dbeafe", borderRadius:16, padding:10, boxShadow:"0 2px 8px rgba(0,0,0,.06)",
    alignItems:"center", textAlign:"center"
  },
  name: { margin:"8px 0 0", font:"700 15px/1.2 Montserrat, system-ui, sans-serif", color:"#0f172a" },
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
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          style={{ width:"100%", height:"100%", objectFit:"contain", background:"#0b1e2a" }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div style={{ color:"#cbd5e1" }}>Sen foto</div>
      )}
      {showNum && (
        <span style={{
          position:"absolute", top: 18, left: 24,
          fontFamily:"Montserrat, system-ui, sans-serif",
          fontWeight: 600, fontSize: 36, lineHeight: 1, color: "#9aa4b2",
          textShadow:"0 1px 2px rgba(0,0,0,.22)", letterSpacing:"0.5px", userSelect:"none"
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

  // Cabeceira
  const [header, setHeader] = useState(null);

  useEffect(() => {
    (async () => {
      // Convocados publicados
      const { data: pub } = await supabase.from("convocatoria_publica").select("jugador_id");
      const ids = (pub || []).map(r => r.jugador_id);

      // Cabeceira
      const { data: top } = await supabase
        .from("matches_vindeiros")
        .select("equipo1,equipo2,match_iso")
        .order("match_iso", { ascending: true }).limit(1).maybeSingle();

      if (top?.match_iso) {
        setHeader({ equipo1: cap(top.equipo1||""), equipo2: cap(top.equipo2||""), match_iso: top.match_iso });
      } else {
        const { data: nm } = await supabase
          .from("next_match")
          .select("equipo1,equipo2,match_iso")
          .eq("id",1).maybeSingle();
        if (nm?.match_iso) setHeader({ equipo1: cap(nm.equipo1||""), equipo2: cap(nm.equipo2||""), match_iso: nm.match_iso });
        else setHeader(null);
      }

      if (!ids.length) { setJugadores([]); setLoading(false); return; }

      // Traer só os convocados
      const { data: js } = await supabase
        .from("jugadores")
        .select("id, nombre, dorsal, foto_url")
        .in("id", ids)
        .order("dorsal", { ascending: true });

      const byId = new Map((js||[]).map(j => [j.id, j]));
      const ordered = ids.map(id => byId.get(id)).filter(Boolean);
      setJugadores(ordered);
      setLoading(false);
    })().catch(e => { console.error(e); setLoading(false); });
  }, []);

  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of jugadores || []) {
      const { pos } = finalFromAll(p);
      if (pos && g[pos]) g[pos].push(p);
    }
    return g;
  }, [jugadores]);

  const { fecha: sFecha, hora: sHora } = (function(){
    if (!header?.match_iso) return { fecha:"-", hora:"-" };
    try {
      const d = new Date(header.match_iso);
      return {
        fecha: d.toLocaleDateString("gl-ES", { day: "2-digit", month: "2-digit", year: "numeric" }),
        hora:  d.toLocaleTimeString("gl-ES", { hour: "2-digit", minute: "2-digit" })
      };
    } catch { return { fecha:"-", hora:"-" }; }
  })();

  if (loading) return <main style={S.wrap}>Cargando…</main>;

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Fai aquí a túa aliñación</h1>
      <p style={S.sub}>Aquí é onde demostras o Giráldez que levas dentro.</p>

      {header && (
        <div style={S.resumen}>
          <p style={S.resumeLine}>{cap(header.equipo1)} vs {cap(header.equipo2)}</p>
          <p style={{...S.resumeLine, opacity:.9}}>{sFecha} | {sHora}</p>
        </div>
      )}

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
                    <div style={{
                      position:"relative", width:"100%", height: IMG_H,
                      borderRadius:12, display:"grid", placeItems:"center",
                      background:"#f8fafc", border:"1px solid #e5e7eb", overflow:"hidden"
                    }}>
                      <ImgWithOverlay src={p.foto_url} alt={`Foto de ${nombre}`} dorsal={dorsal}/>
                    </div>
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
