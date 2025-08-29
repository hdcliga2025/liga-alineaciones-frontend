// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

export default function Perfil() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    full_name: "",
    phone: "",
    email: "",
    dni: "",
    carnet_celta_id: "",
    birth_date: "", // YYYY-MM-DD
  });
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");
  const allowedColsRef = useRef(new Set()); // columnas realmente existentes en BBDD

  // Carga inicial de perfil
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        console.error(error);
        return;
      }

      const allowed = new Set(Object.keys(data || {}));
      allowedColsRef.current = allowed;

      setForm((f) => ({
        ...f,
        first_name: (data?.first_name || "").trim(),
        last_name: (data?.last_name || "").trim(),
        full_name:
          (data?.full_name || `${data?.first_name || ""} ${data?.last_name || ""}`).trim(),
        phone: (data?.phone || "").trim(),
        email: (data?.email || "").trim(),
        // Extras só se existen xa na táboa
        dni: allowed.has("dni") ? (data?.dni || "") : "",
        carnet_celta_id: allowed.has("carnet_celta_id") ? (data?.carnet_celta_id || "") : "",
        birth_date: allowed.has("birth_date")
          ? (data?.birth_date ? String(data.birth_date).slice(0, 10) : "")
          : "",
      }));
    })();
  }, []);

  const onlyDigits = (v) => v.replace(/\D/g, "");

  const handleChange = (key) => (e) => {
    const v = e.currentTarget.value;
    setForm((f) => ({
      ...f,
      [key]: key === "phone" ? onlyDigits(v) : v,
    }));
  };

  // Validacións sin dor de cabeza
  function validate() {
    if (!form.first_name.trim() || !form.last_name.trim())
      return "Completa nome e apelidos.";
    if (!/^\d{9,15}$/.test((form.phone || "").trim()))
      return "O móbil debe ter entre 9 e 15 díxitos.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((form.email || "").trim()))
      return "O email non é válido.";
    // Extras opcionales: non obrigatorios
    return null;
  }

  const save = async (e) => {
    e.preventDefault();
    setInfo("");
    setErr("");
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    // Construír full_name se non se puxo manualmente
    const full_name = (form.full_name || `${form.first_name} ${form.last_name}`).trim();

    // Só incluímos columnas que existen na táboa para evitar erros
    const allowed = allowedColsRef.current;
    const payload = {
      id: (await supabase.auth.getUser()).data.user.id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      full_name,
      phone: form.phone.trim(),
      email: form.email.trim(),
      updated_at: new Date().toISOString(),
    };

    if (allowed.has("dni")) payload.dni = form.dni.trim() || null;
    if (allowed.has("carnet_celta_id")) payload.carnet_celta_id = form.carnet_celta_id.trim() || null;
    if (allowed.has("birth_date")) payload.birth_date = form.birth_date || null; // yyyy-mm-dd

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) setErr(error.message);
    else setInfo("Datos gardados.");
  };

  const requestDelete = async () => {
    setInfo("");
    setErr("");
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return;
    const { error } = await supabase.from("delete_requests").insert({ user_id: uid });
    if (error) setErr(error.message);
    else setInfo("Solicitude de borrado rexistrada. O equipo revisaraa.");
  };

  // Estilos mínimos locais (mantemos clases compartidas de Login/Register)
  const box = { maxWidth: 640, margin: "24px auto 40px", padding: "0 16px" };
  const h2s = { margin: "0 0 14px", fontFamily: "Montserrat,system-ui,sans-serif" };
  const h3s = {
    margin: "22px 0 10px",
    fontWeight: 700,
    fontFamily: "Montserrat,system-ui,sans-serif",
    fontSize: 16,
    color: "#0f172a",
  };

  const row = { marginBottom: "10px" };

  return (
    <main style={box}>
      <h2 style={h2s}>Perfil</h2>

      <form onSubmit={save} noValidate>
        {/* ===== Datos persoais (como Rexistro, sen contrasinal) ===== */}
        <h3 style={h3s}>Datos persoais</h3>

        {/* Nome */}
        <div class="input-row" style={row}>
          <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#6b7280" stroke-width="1.5" />
            <path d="M4 20a8 8 0 1 1 16 0" stroke="#6b7280" stroke-width="1.5" />
          </svg>
          <input
            id="first_name"
            type="text"
            placeholder="Nome"
            value={form.first_name}
            onInput={handleChange("first_name")}
            required
            aria-label="Nome"
          />
        </div>

        {/* Apelidos */}
        <div class="input-row" style={row}>
          <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#6b7280" stroke-width="1.5" />
            <path d="M4 20a8 8 0 1 1 16 0" stroke="#6b7280" stroke-width="1.5" />
          </svg>
          <input
            id="last_name"
            type="text"
            placeholder="Apelidos"
            value={form.last_name}
            onInput={handleChange("last_name")}
            required
            aria-label="Apelidos"
          />
        </div>

        {/* Nome completo (opcional, autocompleta) */}
        <div class="input-row" style={row}>
          <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#6b7280" stroke-width="1.5" />
            <path d="M4 20a8 8 0 1 1 16 0" stroke="#6b7280" stroke-width="1.5" />
          </svg>
          <input
            id="full_name"
            type="text"
            placeholder="Nome e apelidos (opcional)"
            value={form.full_name}
            onInput={handleChange("full_name")}
            aria-label="Nome e apelidos"
          />
        </div>

        {/* Móbil */}
        <div class="input-row" style={row}>
          <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="#6b7280" stroke-width="1.5" />
            <path d="M12 5.2h0.01" stroke="#6b7280" stroke-width="1.5" />
            <circle cx="12" cy="18.5" r="1" fill="#6b7280" />
          </svg>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            pattern="\d{9,15}"
            placeholder="Móbil"
            value={form.phone}
            onInput={handleChange("phone")}
            required
            aria-label="Móbil"
          />
        </div>

        {/* Email (informativo/edEditable na táboa profiles) */}
        <div class="input-row" style={row}>
          <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.5" />
            <path d="M3 6l9 7 9-7" stroke="#6b7280" stroke-width="1.5" />
          </svg>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onInput={handleChange("email")}
            required
            aria-label="Email"
          />
        </div>

        {/* ===== Datos opcións ===== */}
        <h3 style={h3s}>Datos opcións</h3>

        {/* DNI */}
        <div class="input-row" style={row}>
          <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.5" />
            <circle cx="7.5" cy="9" r="1.6" stroke="#6b7280" stroke-width="1.5" />
            <path d="M11 8.5h6M11 11h6" stroke="#6b7280" stroke-width="1.5" />
          </svg>
          <input
            id="dni"
            type="text"
            placeholder="DNI"
            value={form.dni}
            onInput={handleChange("dni")}
            aria-label="DNI"
          />
        </div>

        {/* ID Carnet Celta */}
        <div class="input-row" style={row}>
          <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.5" />
            <path d="M6 9h12M6 12h8" stroke="#6b7280" stroke-width="1.5" />
          </svg>
          <input
            id="carnet_celta_id"
            type="text"
            placeholder="ID Carnet Celta"
            value={form.carnet_celta_id}
            onInput={handleChange("carnet_celta_id")}
            aria-label="ID Carnet Celta"
          />
        </div>

        {/* Data de nacemento */}
        <div class="input-row" style={row}>
          <svg class="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.5" />
            <path d="M7 3.5v3M17 3.5v3M3 9h18" stroke="#6b7280" stroke-width="1.5" />
          </svg>
          <input
            id="birth_date"
            type="date"
            placeholder="Data de nacemento"
            value={form.birth_date}
            onInput={handleChange("birth_date")}
            aria-label="Data de nacemento"
          />
        </div>

        {/* Mensaxes */}
        {info && <p style={{ color: "#065f46", margin: "10px 0" }}>{info}</p>}
        {err && <p style={{ color: "#b91c1c", margin: "10px 0" }}>{err}</p>}

        {/* Botóns (mismo deseño que Login/Registro) */}
        <div class="cta-wrap" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button type="submit">Gardar</button>
          <button type="button" onClick={requestDelete}>Solicitar borrado</button>
        </div>
      </form>
    </main>
  );
}
