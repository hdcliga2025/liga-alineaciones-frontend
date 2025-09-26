import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

export default function ResultadosUltimaAlineacion(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let alive = true;
    (async ()=>{
      // Placeholder: cargamos aliñación oficial (para comprobar que existe)
      const { data: ofi } = await supabase.from("alineacion_oficial").select("jugador_id");
      if (alive) setRows(ofi||[]);
      setLoading(false);
    })();
    return ()=>{ alive=false; };
  },[]);

  return (
    <main style={{padding:"72px 16px 24px", maxWidth:1080, margin:"0 auto"}}>
      <h1 style={{font:"700 24px/1.15 Montserrat,system-ui"}}>Resultados da última aliñación</h1>
      <p style={{font:"400 14px/1.35 Montserrat,system-ui", color:"#475569"}}>
        Cruce entre a aliñación oficial e as aliñacións presentadas polas usuarias.
      </p>

      {!loading && rows.length===0 && (
        <div style={{padding:"12px 14px", border:"1px solid #e2e8f0", borderRadius:12, background:"#eef6ff", color:"#0f172a"}}>
          Non hai resultados dispoñíbeis aínda.
        </div>
      )}
    </main>
  );
}

