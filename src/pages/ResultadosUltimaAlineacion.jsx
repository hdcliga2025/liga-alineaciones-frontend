// src/pages/ResultadosUltimaAlineacion.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Utils ===== */
// UI en galego, comentarios técnicos en castelán
const cap = (s="") => (s || "").toUpperCase();
const isUUID = (v="") => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
function safeDecode(s = "") { try { return decodeURIComponent(s); } catch { return s.replace(/%20/g, " "); } }
function parseFromFilename(url = "") {
  const last = (url.split("?")[0].split("#")[0].split("/").pop() || "").trim();
  const m = last.match(/^(\d+)-(.+)-(POR|DEF|CEN|DEL)\.(jpg|jpeg|png|webp)$/i);
  if (!m) return { dorsalFile: null, nameFile: null, posFile: null };
  return {
    dorsalFile: parseInt(m[1],10),
    nameFile: safeDecode(m[2].replace(/_/g," ")),
    posFile: m[3].toUpperCase()
  };
}
function finalFromAll(p = {}) {
  const { dorsalFile, nameFile, posFile } = parseFromFilename(p.foto_url || "");
  return {
    dorsal: dorsalFile ?? (p.dorsal ?? null),
    pos:    (posFile || p.pos || "").toUpperCase(),
    nombre: (nameFile || p.nombre || "").trim()
  };
}

/* ===== Estilos ===== */
const S = {
  wrap: { padding:"72px 16px 24px", maxWidth:1080, margin:"0 auto" },
  h1:   { font:"700 24px/1.15 Montserrat,system-ui", margin:"0 0 4px" },
  sub:  { font:"400 14px/1.35 Montserrat,system-ui", color:"#475569", margin:"0 0 12px" },

  resumen: {
    margin:"0 0 12px", padding:"10px 12px", borderRadius:12,
    border:"1px solid #e2e8f0", background:"#f8fafc", color:"#0f172a"
  },
  resumeTitle: { margin:0, font:"700 16px/1.2 Montserrat,system-ui" },
  resumeLine:  { margin:"2px 0 0", font:"500 14px/1.2 Montserrat,system-ui", color:"#334155" },

  posHeader: { margin:"16px 0 8px", padding:"2px 4px 8px", fontWeight:700, color:"#0c4a6e", borderLeft:"4px solid #7dd3fc", borderBottom:"2px solid #e2e8f0" },
  grid: (isMobile)=>({
    display:"grid",
    gridTemplateColumns: isMobile ? "repeat(3,minmax(0,1fr))" : "repeat(4,minmax(0,1fr))",
    gap:12
  }),

  card: (hit)=>({
    borderRadius:14, padding:10, position:"relative",
    border: hit ? "2px solid #22c55e" : "1px solid #e2e8f0",
    background: hit ? "linear-gradient(180deg,#ecfdf5,#dcfce7)" : "#fff",
    boxShadow: hit ? "0 8px 22px rgba(34,197,94,.18)" : "0 2px 8px rgba(0,0,0,.06)"
  }),
  frame: (isMobile)=>({
    width:"100%", height: isMobile ? 172 : 320,
    borderRadius:12, overflow:"hidden", background:"#ffffff",
    border:"1px solid #e5e7eb", display:"grid", placeItems:"center"
  }),
  img: { width:"100%", height:"100%", objectFit:"contain", background:"#ffffff" },
  name: { margin:"8px 0 0", font:"700 15px/1.2 Montserrat,system-ui", color:"#0f172a", textAlign:"center" },
  meta: { margin:"2px 0 0", font:"400 13px/1.2 Montserrat,system-ui", color:"#475569", textAlign:"center" },

  badge: (hit)=>({
    position:"absolute", top:8, right:8, borderRadius:999, padding:"4px 8px",
    font:"800 12px/1 Montserrat,system-ui",
    color: hit ? "#065f46" : "#991b1b",
    background: hit ? "#bbf7d0" : "#fecaca",
    border: `1px solid ${hit ? "#86efac" : "#fca5a5"}`
  }),

  empty: { padding:"12px 14px", border:"1px solid #e2e8f0", borderRadius:12, background:"#eef6ff", color:"#0f172a" }
};

export default function ResultadosUltimaAlineacion(){
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 560 : false);

  const [header, setHeader] = useState(null);     // {equipo1, equipo2, match_iso}
  const [oficialSet, setOficialSet] = useState(new Set()); // Set<uuid> dos 11 oficiais
  const [miOnceIds, setMiOnceIds] = useState([]); // array<uuid> dos 11 do usuario
  const [jugadoresMap, setJugadoresMap] = useState(new Map()); // Map<uuid, jugadorRow>

  useEffect(() => {
    let raf=0;
    const onR=()=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(()=> setIsMobile(window.innerWidth<=560)); };
    window.addEventListener("resize", onR);
    return ()=>{ window.removeEventListener("resize", onR); cancelAnimationFrame(raf); };
  }, []);

  useEffect(()=>{
    let alive = true;
    (async ()=>{
      try {
        // 1) Usuario actual
        const { data: s } = await supabase.auth.getSession();
        const uid = s?.session?.user?.id || null;

        // 2) Partido de referencia (próximo)
        const { data: nm } = await supabase.from("next_match").select("equipo1,equipo2,match_iso").eq("id",1).maybeSingle();
        if (!nm?.match_iso) { if (alive){ setHeader(null); setLoading(false); } return; }
        const hdr = { equipo1: cap(nm.equipo1||""), equipo2: cap(nm.equipo2||""), match_iso: nm.match_iso };
        if (alive) setHeader(hdr);

        // 3) Oficial → Set de 11
        const { data: ofi } = await supabase
          .from("alineacion_oficial")
          .select("jugador_id")
          .eq("match_iso", nm.match_iso);

        const ofSet = new Set((ofi||[]).map(r => r.jugador_id).filter(isUUID));
        if (alive) setOficialSet(ofSet);

        // 4) Aliñación da usuaria (fila-a-fila ou array)
        let mine = [];
        if (uid) {
          const { data: myRows } = await supabase
            .from("alineaciones_usuarios")
            .select("jugador_id, jugadores_ids, user_id, match_iso")
            .eq("user_id", uid)
            .eq("match_iso", nm.match_iso);

          const singleIds = (myRows||[])
            .map(r => r.jugador_id)
            .filter(isUUID);

          const arrayIds = (myRows||[])
            .flatMap(r => Array.isArray(r.jugadores_ids) ? r.jugadores_ids : [])
            .filter(isUUID);

          const merged = [...singleIds, ...arrayIds];
          // deduplicado mantendo orde de aparición
          const seen = new Set();
          for (const id of merged) if (!seen.has(id)) { seen.add(id); mine.push(id); }
        }
        if (alive) setMiOnceIds(mine);

        // 5) Traer xogadores para pintar
        const uniqIds = Array.from(new Set([ ...ofSet, ...mine ]));
        if (uniqIds.length) {
          const { data: js } = await supabase
            .from("jugadores")
            .select("id, nombre, dorsal, foto_url");
          const mp = new Map((js||[]).map(j => [j.id, j]));
          if (alive) setJugadoresMap(mp);
        } else {
          if (alive) setJugadoresMap(new Map());
        }
      } catch (e) {
        console.error("[ResultadosUltimaAlineacion] init error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return ()=>{ alive=false; };
  },[]);

  // Construimos items do usuario co flag hit (acerto)
  const itemsUsuario = useMemo(() => {
    return miOnceIds.map(id => {
      const base = jugadoresMap.get(id) || { id, nombre:"(descoñecido)", dorsal:null, foto_url:"" };
      const info = finalFromAll(base);
      const hit = oficialSet.has(id);
      return { id, ...base, ...info, hit };
    });
  }, [miOnceIds, jugadoresMap, oficialSet]);

  // Agrupamos POR → DEF → CEN → DEL
  const grupos = useMemo(() => {
    const g = { POR: [], DEF: [], CEN: [], DEL: [] };
    for (const it of itemsUsuario) {
      const pos = it.pos || "";
      if (g[pos]) g[pos].push(it);
    }
    return g;
  }, [itemsUsuario]);

  // Conteo de acertos (intersección)
  const totalAcertos = useMemo(
    () => miOnceIds.filter((id)=>oficialSet.has(id)).length,
    [miOnceIds, oficialSet]
  );

  // Header bonito
  const { sFecha, sHora } = useMemo(() => {
    if (!header?.match_iso) return { sFecha:"-", sHora:"-" };
    try{
      const d = new Date(header.match_iso);
      return {
        sFecha: d.toLocaleDateString("gl-ES",{day:"2-digit",month:"2-digit",year:"numeric"}),
        sHora:  d.toLocaleTimeString("gl-ES",{hour:"2-digit",minute:"2-digit"})
      };
    } catch { return { sFecha:"-", sHora:"-" }; }
  }, [header]);

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Resultados da última aliñación</h1>
      <p style={S.sub}>
        Mostramos o teu once completo e marcamos <strong>✔</strong> os xogadores que coinciden ca aliñación oficial.
      </p>

      {header && (
        <section style={S.resumen}>
          <p style={S.resumeTitle}>{cap(header.equipo1)} vs {cap(header.equipo2)}</p>
          <p style={S.resumeLine}>{sFecha} | {sHora}</p>
          <p style={{...S.resumeLine, marginTop:6}}>
            <strong>{totalAcertos}</strong> acertos de <strong>{miOnceIds.length || 0}</strong>
          </p>
        </section>
      )}

      {loading && <div style={S.empty}>Cargando…</div>}

      {!loading && (!miOnceIds || miOnceIds.length===0) && (
        <div style={S.empty}>
          Aínda non hai unha aliñación enviada para este encontro.
        </div>
      )}

      {!loading && miOnceIds.length>0 && (
        <>
          {[
            ["POR","Porteiros"],
            ["DEF","Defensas"],
            ["CEN","Medios"],
            ["DEL","Dianteiros"],
          ].map(([k,label])=>{
            const arr = grupos[k] || [];
            if (!arr.length) return null;
            return (
              <section key={k}>
                <div style={S.posHeader}>{label}</div>
                <div style={S.grid(isMobile)}>
                  {arr.map(p=>{
                    const hit = !!p.hit;
                    const { dorsal, nombre, pos } = p;
                    return (
                      <article key={p.id} style={S.card(hit)}>
                        <div style={S.frame(isMobile)}>
                          {p.foto_url
                            ? <img src={p.foto_url} alt={`Foto de ${nombre}`} style={S.img} loading="lazy" decoding="async"/>
                            : <div style={{ color:"#cbd5e1" }}>Sen foto</div>}
                        </div>
                        <span style={S.badge(hit)} aria-label={hit ? "Acerto" : "Erro"}>
                          {hit ? "✔ ACERTO" : "✖ NON"}
                        </span>
                        <p style={S.name}>{dorsal != null ? `${String(dorsal).padStart(2,"0")} · ` : ""}{nombre}</p>
                        <p style={S.meta}>{pos}</p>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}
