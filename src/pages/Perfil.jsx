// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

export default function Perfil(){
  const [user, setUser] = useState(null);
  useEffect(() => { (async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  })(); }, []);

  return (
    <main style={{ padding: "72px 16px 24px" }}>
      <h1 style={{ fontFamily:"Montserrat,system-ui", fontWeight:700 }}>Perfil</h1>
      {user ? (
        <div style={{ fontFamily:"Montserrat,system-ui", marginTop: 12 }}>
          <p><strong>Nome completo:</strong> {user.user_metadata?.full_name || "—"}</p>
          <p><strong>Correo:</strong> {user.email}</p>
        </div>
      ) : (
        <p style={{ fontFamily:"Montserrat,system-ui" }}>Cargando…</p>
      )}
    </main>
  );
}
