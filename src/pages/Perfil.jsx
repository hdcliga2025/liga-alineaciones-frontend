// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const btnBase = {
  width: "100%", padding: "12px", borderRadius: 12, border: "none",
  boxShadow: "0 6px 18px rgba(0,0,0,.12)", fontWeight: 800, cursor: "pointer",
  fontFamily: "'Montserrat', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
};

const BTN_GARDAR   = { ...btnBase, background: "#ffffff", color: "#10b981" }; // verde
const BTN_MODIFICAR= { ...btnBase, background: "#ffffff", color: "#0ea5e9" }; // celeste
const BTN_BAIXA    = { ...btnBase, background: "#fee2e2", color: "#ef4444" }; // rojo suave

export default function Perfil() {
  const [loading, setLoading] = useState(false);
  const [p, setP] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    birth_date: "", dni: "", carnet_id: "",
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name,last_name,email,phone,birth_date,dni,carnet_id")
        .eq("id", uid).maybeSingle();
      if (data) setP({ ...p, ...data });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      await supabase.from("profiles").upsert({
        id: uid,
        first_name: p.first_name?.trim() || "",
        last_name:  p.last_name?.trim()  || "",
        email:      p.email?.trim()      || "",
        phone:      p.phone?.trim()      || "",
        birth_date: p.birth_date || null,
        dni:        p.dni?.trim() || "",
        carnet_id:  p.carnet_id?.trim() || "",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      alert("Datos gardados");
    } catch (e) {
      alert("Erro gardando datos");
    } finally { setLoading(false); }
  };

  const solicitarBaixa = async () => {
    if (!confirm("Confirmas solicitar a baixa?")) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      await supabase.from("delete_requests").insert({
        user_id: uid, reason: "Solicitada dende Perfil", created_at: new Date().toISOString()
      });
      alert("Solicitude enviada");
    } catch (e) {
      alert("Non se puido enviar a solicitude");
    }
  };

  const grid = { display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" };
  const full = { gridColumn: "1 / -1" };
  const input = {
    width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e7eb",
    fontFamily: "inherit",
  };

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: "0 14px" }}>
      <h2 style={{ margin: "0 0 8px", color: "#0ea5e9" }}><b>Comunicación</b></h2>
      <p style={{ margin: "0 0 18px" }}>Mantén actualizados os teus datos</p>

      <div style={grid}>
        <div>
          <input style={input} placeholder="Nome" value={p.first_name}
                 onInput={(e)=>setP({ ...p, first_name: e.currentTarget.value })}/>
        </div>
        <div>
          <input style={input} placeholder="Apelidos" value={p.last_name}
                 onInput={(e)=>setP({ ...p, last_name: e.currentTarget.value })}/>
        </div>
        <div>
          <input style={input} placeholder="Email" type="email" value={p.email}
                 onInput={(e)=>setP({ ...p, email: e.currentTarget.value })}/>
        </div>
        <div>
          <input style={input} placeholder="Móbil" inputMode="tel" value={p.phone}
                 onInput={(e)=>setP({ ...p, phone: e.currentTarget.value.replace(/[^\d+]/g,"") })}/>
        </div>

        <div style={full}><hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "6px 0 4px" }} /></div>
        <div style={full}><h3 style={{ margin: "0 0 8px", fontWeight: 600 }}>Datos opcionais</h3></div>

        <div>
          <input style={input} placeholder="Data de nacemento (dd/mm/aaaa)" value={p.birth_date || ""}
                 onInput={(e)=>setP({ ...p, birth_date: e.currentTarget.value })}/>
        </div>
        <div>
          <input style={input} placeholder="DNI" value={p.dni}
                 onInput={(e)=>setP({ ...p, dni: e.currentTarget.value })}/>
        </div>
        <div style={full}>
          <input style={input} placeholder="ID Carnet Celta" value={p.carnet_id}
                 onInput={(e)=>setP({ ...p, carnet_id: e.currentTarget.value })}/>
        </div>

        {/* Botóns en 3 columnas (móbil: 1 columna vía media-query inline simple) */}
        <div style={{ ...full }}>
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "1fr 1fr 1fr",
            }}
          >
            <button style={BTN_GARDAR}   disabled={loading} onClick={save}>Gardar</button>
            <button style={BTN_MODIFICAR} disabled={loading} onClick={()=>alert("Podes modificar os campos e gardar.")}>Modificar</button>
            <button style={BTN_BAIXA}     disabled={loading} onClick={solicitarBaixa}>Solicitar baixa</button>
          </div>
        </div>
      </div>
    </main>
  );
}

