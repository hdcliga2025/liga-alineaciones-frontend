// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

export default function Perfil() {
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      if (data) setForm({ full_name: data.full_name || "", phone: data.phone || "" });
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setInfo(""); setErr("");
    if (!/^[0-9]{9,15}$/.test((form.phone || "").trim())) {
      setErr("O teléfono debe ter só díxitos (9–15).");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({ ...form, id: (await supabase.auth.getUser()).data.user.id });
    if (error) setErr(error.message);
    else setInfo("Datos gardados.");
  };

  const requestDelete = async () => {
    setInfo(""); setErr("");
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return;
    const { error } = await supabase.from("delete_requests").insert({ user_id: uid });
    if (error) setErr(error.message);
    else setInfo("Solicitude de borrado rexistrada. O equipo revisaraa.");
  };

  const box = { maxWidth: 560, margin: "28px auto", padding: "0 16px" };
  const label = { fontSize: 14, fontWeight: 600, color: "#0f172a" };
  const input = { width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 10 };
  const btn = { padding: "10px 14px", borderRadius: 14, border: "1px solid #0ea5e9", background: "linear-gradient(135deg,#93c5fd,#60a5fa)", color: "#fff", fontWeight: 700, cursor: "pointer", marginRight: 8 };
  const danger = { padding: "10px 14px", borderRadius: 14, border: "1px solid #ef4444", background: "#fee2e2", color: "#b91c1c", fontWeight: 700, cursor: "pointer" };

  return (
    <main style={box}>
      <h2 style={{ marginBottom: 12 }}>Perfil</h2>
      <form onSubmit={save}>
        <label style={label} for="full_name">Nome e apelidos</label>
        <input id="full_name" style={input} value={form.full_name} onInput={(e)=>setForm(f=>({...f, full_name:e.currentTarget.value}))} />

        <label style={label} for="phone">Número de teléfono móbil</label>
        <input id="phone" style={input} value={form.phone} onInput={(e)=>setForm(f=>({...f, phone:e.currentTarget.value}))} />

        <button type="submit" style={btn}>Gardar</button>
        <button type="button" style={danger} onClick={requestDelete}>Solicitar borrado</button>
      </form>
      {info && <p style={{ color:"#065f46", marginTop:10 }}>{info}</p>}
      {err && <p style={{ color:"#b91c1c", marginTop:10 }}>{err}</p>}
    </main>
  );
}
