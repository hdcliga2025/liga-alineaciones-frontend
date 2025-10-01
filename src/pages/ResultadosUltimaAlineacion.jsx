// src/pages/ResultadosUltimaAlineacion.jsx
import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* Comentario técnico:
   - Determinamos o último partido co once oficial dispoñíbel mediante o match_iso con updated_at máis recente en `alineacion_oficial`.
   - Calculamos intersección entre oficial e cada aliñación de usuaria en `alineaciones_usuarios` (mesmo match_iso).
   - Mostramos táboa ordenada por número de acertos desc. Resaltamos a usuaria actual. */

const S = {
  wrap: { padding:"72px 16px 24px", maxWidth:1080, margin:"0 auto" },
  h1: { font:"700 24px/1.15 Montserrat,system-ui,sans-serif" },
  sub: { font:"400 14px/1.35 Montserrat,system-ui,sans-serif", color:"#475569" },
  note: { padding:"12px 14px", border:"1px solid #e2e8f0", borderRadius:12, background:"#eef6ff", color:"#0f172a" },

  table: { width:"100%", borderCollapse:"separate", borderSpacing:0, marginTop:12 },
  th: { textAlign:"left", font:"700 14px/1.25 Montserrat,system-ui", color:"#0f172a", padding:"10px 10px", borderBottom:"2px solid #e2e8f0", background:"#fff" },
  td: { font:"400 14px/1.25 Montserrat,system-ui", color:"#0f172a", padding:"10px 10px", borderBottom:"1px solid #e5e7eb", background:"#fff" },
  rowSelf: { background:"linear-gradient(180deg,#f0fdf4,#dcfce7)" },
  tag: { display:"inline-block", padding:"2px 8px", borderRadius:999, background:"#eef2ff", border:"1px solid #e2e8f0", font:"600 12px/1 Montserrat,system-ui", marginRight:6, marginBottom:4 }
};

function uniq(arr){ return [...new Set(arr)]; }

export default function ResultadosUltimaAlineacion(){
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]); // [{user_id, name, hits, names[]}]
  const [meta, setMeta] = useState({ match_iso:null, equipos:"" });
  const [selfId, setSelfId] = useState(null);

  useEffect(()=>{
    let alive = true;
    (async ()=>{
      try {
        // user id para resaltar fila
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id || null;
        if (uid) setSelfId(uid);

        // 1) match máis recente con once oficial dispoñíbel
        const { data: lastList } = await supabase
          .from("alineacion_oficial")
          .select("match_iso, updated_at")
          .not("match_iso","is", null)
          .order("updated_at",{ ascending:false })
          .limit(11);

        const lastIso = lastList && lastList.length ? lastList[0].match_iso : null;
        if (!lastIso) { if (alive){ setRows([]); setLoading(false); } return; }

        // 1b) equipos para cabeceira (procuramos en next_match e finalizados)
        let equipos = "";
        try {
          const { data: nm } = await supabase.from("next_match").select("equipo1,equipo2,match_iso").eq("match_iso", lastIso).maybeSingle();
          if (nm?.equipo1 || nm?.equipo2) equipos = `${(nm.equipo1||"").toUpperCase()} vs ${(nm.equipo2||"").toUpperCase()}`;
          else {
            const { data: v } = await supabase.from("matches_finalizados").select("equipo1,equipo2,match_iso").eq("match_iso", lastIso).maybeSingle();
            if (v?.equipo1 || v?.equipo2) equipos = `${(v.equipo1||"").toUpperCase()} vs ${(v.equipo2||"").toUpperCase()}`;
          }
        } catch {}

        setMeta({ match_iso: lastIso, equipos });

        // 2) ids oficiais
        const { data: ofiRows } = await supabase
          .from("alineacion_oficial")
          .select("jugador_id")
          .eq("match_iso", lastIso);
        const oficialIds = new Set((ofiRows||[]).map(r=>r.jugador_id));

        // 3) aliñacións de usuarias dese match
        const { data: usersRows } = await supabase
          .from("alineaciones_usuarios")
          .select("user_id,jugador_id")
          .eq("match_iso", lastIso);

        if (!usersRows || !usersRows.length) { if (alive){ setRows([]); setLoading(false); } return; }

        // agrupamos por user_id
        const byUser = new Map();
        for (const r of usersRows) {
          if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
          byUser.get(r.user_id).push(r.jugador_id);
        }

        // nomes de perfís
        const userIds = uniq(usersRows.map(r=>r.user_id)).filter(Boolean);
        let names = new Map();
        if (userIds.length) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, first_name, nombre, full_name, email")
            .in("id", userIds);
          for (const p of (profs||[])) {
            const first = (p.first_name||"").trim() || (p.nombre||"").trim() || (p.full_name||"").trim().split(" ")[0] || ((p.email||"").split("@")[0]||"");
            names.set(p.id, first || "anón");
          }
        }

        // 4) cálculo de acertos
        const out = [];
        for (const [uid2, list] of byUser.entries()) {
          const setUser = new Set(list);
          const aciertosIds = [...setUser].filter(id => oficialIds.has(id));
          // traer nombres de acertos (para mostrar en tags)
          let aciertosNombres = [];
          if (aciertosIds.length) {
            const { data: js } = await supabase.from("jugadores").select("id,nombre,dorsal").in("id", aciertosIds);
            aciertosNombres = (js||[]).map(j => (j.dorsal!=null ? `${String(j.dorsal).padStart(2,"0")} · ${j.nombre}` : j.nombre));
          }
          out.push({
            user_id: uid2,
            name: names.get(uid2) || "anón",
            hits: aciertosIds.length,
            names: aciertosNombres.sort((a,b)=>a.localeCompare(b,"gl"))
          });
        }

        out.sort((a,b)=> b.hits - a.hits || a.name.localeCompare(b.name,"gl"));
        if (alive) setRows(out);
      } catch (e) {
        console.error(e);
        if (alive) setErr("Erro cargando resultados.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return ()=>{ alive=false; };
  },[]);

  const best = useMemo(()=>{
    if (!rows.length) return null;
    const top = rows[0];
    const max = top.hits;
    const list = rows.filter(r=>r.hits===max).map(r=>r.name);
    return { max, list };
  },[rows]);

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Resultados da última aliñación</h1>
      <p style={S.sub}>
        Cruce entre a aliñación oficial e as aliñacións presentadas polas usuarias.
      </p>

      {err && <div style={S.note}>{err}</div>}
      {loading && <div style={S.note}>Cargando…</div>}

      {!loading && (!rows.length) && (
        <div style={S.note}>
          Non hai resultados dispoñíbeis aínda.
        </div>
      )}

      {!loading && rows.length>0 && (
        <>
          {meta.equipos && (
            <div style={{ ...S.note, marginTop: 10 }}>
              <strong>{meta.equipos}</strong>{" "}
              <span style={{ opacity:.8 }}>({new Date(meta.match_iso).toLocaleString("gl-ES",{day:"2-digit",month:"2-digit",year:"numeric", hour:"2-digit", minute:"2-digit"})})</span>
              {best && (
                <div style={{ marginTop:6 }}>
                  Máis acertos: <strong>{best.max}</strong> — {best.list.join(", ")}
                </div>
              )}
            </div>
          )}

          <div style={{ overflowX:"auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Usuaria</th>
                  <th style={S.th}>Acertos</th>
                  <th style={S.th}>Xogadores acertados</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const isSelf = r.user_id === selfId;
                  return (
                    <tr key={r.user_id} style={isSelf ? S.rowSelf : {}}>
                      <td style={S.td}><strong>{r.name}</strong>{isSelf && " (ti)"}</td>
                      <td style={S.td}>{r.hits} / 11</td>
                      <td style={S.td}>
                        {r.names.length
                          ? r.names.map(n => <span style={S.tag}>{n}</span>)
                          : <span style={{opacity:.6}}>—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
