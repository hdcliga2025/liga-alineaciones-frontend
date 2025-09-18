// src/pages/HazTu11.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

// 👉 Esta páxina só le a lista publicada en `convocatoria_publica`
// e preséntaa por posición, 4 columnas, sen selector de partido nin botóns.

function safeDecode(s = "") { try { return decodeURIComponent(s); } catch { return s.replace(/%20/g, " "); } }
function parseFromFilename(url = "") {
  const last = (url.split("?")[0].split("#")[0].split("/").pop() || "").trim();
  const m = last.match(/^(\d+)-(.+)-(POR|DEF|CEN|DEL)\.(jpg|jpeg|png|webp)$/i);
  if (!m) return { dorsalFile: null, nameFile: null, posFile: null };
  return { dorsalFile: parseInt(m[1],10), nameFile: safeDecode(m[2].replace(/_/g," ")), posFile: m[3].toUpperCase() };
}
function canonPos(val="") {
  const s = String(val).trim().toUpperCase();
  if (["POR","PORTERO","PORTEIRO","GK","PORTEIROS"].includes(s)) return "POR";
  if (["DEF","DEFENSA","DF","LATERAL","CENTRAL","DEFENSAS"].includes(s)) return "DEF";
  if (["CEN","MED","MEDIO","MC","MCD","MCO","CENTROCAMPISTA","CENTROCAMPISTAS","MEDIOS"].includes(s)) return "CEN";
  if (["DEL","DELANTERO","FW","DC","EXTREMO","PUNTA","DELANTEROS"].includes(s)) return "DEL";
  return "";
}
function finalFromAll(p = {}) {
  const { dorsalFile, nameFile, posFile } = parseFromFilename(p.foto_url || "");
  return { dorsal: dorsalFile ?? (p.dorsal ?? null), pos: posFile || canonPos(p.posicion || p.position || ""), nombre: (nameFile || p.nombre || "").trim() };
}

export default function HazTu11() {
  const [loading, setLoading] = useState(true);
  const [jugadores, setJugadores] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      // 1) le a publicación
      const { data: pub } = await supabase.from("convocatoria_publica").select("jugador_id");
      const ids = (pub || []).map(r => r.jugador_id);
      if (!ids.length) { setJugadores([]); setLoading(false); return; }

      // 2) resolve datos mínimos
      const { data: js } = await supabase
        .from("jugadores")
        .select("id, nombre, dorsal, posicion, position, foto_url")
        .in("id", ids)
        .order("dorsal", { ascending: true });

      if (!alive) return;
      setJugadores(js || []);
      setLoading(false);
    })();

    // Prefetch leve: se hai Service Worker / cache, mellorará o retorno
    return () => { alive = false; };
  }, []);

  const grouped = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const p of jugadores || []) {
      const info = finalFromAll(p);
      if (info.pos && g[info.pos]) g[info.pos].push({ ...p, ...info });
    }
    return g;
  }, [jugadores]);

  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "16px" };
  const h1 = { fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize: 26, margin: "6px 0 2px", color: "#0f172a" };
  const sub = { margin: "0 0 12px", color: "#475569", fontSize: 16, fontWeight: 600 };
  const posHeader = { margin: "18px 0 8px", padding: "2px 4px", fontWeight: 700, color: "#0c4a6e", borderLeft: "4px solid #7dd3fc" };
  const underline = { height:1, background:"#e2e8f0", margin:"10px 0 12px" };
  const card = { display: "grid", gridTemplateRows: "320px auto", background: "#fff", border: "1px solid #eef2ff", borderRadius: 16, padding: 10, boxShadow: "0 2px 8px rgba(0,0,0,.06)", alignItems: "center", textAlign: "center" };
  const frame = { width:"100%", height:320, borderRadius:12, overflow:"hidden", background:"#0b1e2a", border:"1px solid #e5e7eb" };
  const name = { margin: "8px 0 0", font: "700 15px/1.2 Montserrat, system-ui, sans-serif", color: "#0f172a" };
  const meta = { margin: "2px 0 0", color: "#475569", fontSize: 13 };

  if (loading) return <main style={wrap}>Cargando…</main>;

  return (
    <main style={wrap}>
      <h1 style={h1}>Fai aquí a túa aliñación</h1>
      <p style={sub}>Aquí é onde demostras o Giráldez que levas dentro</p>

      {(["POR","DEF","CEN","DEL"]).map((k) => {
        const arr = grouped[k] || [];
        if (!arr.length) return null;
        const label = k === "POR" ? "Porteiros" : k === "DEF" ? "Defensas" : k === "CEN" ? "Medios" : "Dianteiros";
        return (
          <section key={k}>
            <div style={posHeader}>{label}</div>
            <div style={underline} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, minmax(0, 1fr))", gap: 12 }}>
              {arr.map((p) => {
                const { dorsal, pos, nombre } = finalFromAll(p);
                return (
                  <article key={p.id} style={card}>
                    <div style={frame}>
                      {p.foto_url ? (
                        <img
                          src={p.foto_url}
                          alt={`Foto de ${nombre}`}
                          style={{ width:"100%", height:"100%", objectFit:"cover" }}
                          loading="lazy"
                          decoding="async"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div style={{ color:"#cbd5e1", height:"100%", display:"grid", placeItems:"center" }}>Sen foto</div>
                      )}
                    </div>
                    <div>
                      <p style={name}>
                        {dorsal != null ? `${String(dorsal).padStart(2,"0")} · ` : ""}{nombre}
                      </p>
                      <p style={meta}>{pos}</p>
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
