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
    birth_date: "",
  });
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");
  const allowedColsRef = useRef(new Set());

  // Carga inicial
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
        first_name: (data?.first_name || data?.nombre || "").trim(),
        last_name: (data?.last_name || data?.apellidos || "").trim(),
        full_name:
          (data?.full_name ||
            `${data?.first_name || data?.nombre || ""} ${data?.last_name || data?.apellidos || ""}` ||
            "").trim(),
        phone: allowed.has("phone") ? (data?.phone || "") : "",
        email: (data?.email || "").trim(),
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
    setForm((f) => ({ ...f, [key]: key === "phone" ? onlyDigits(v) : v }));
  };

  function validate() {
    if (!form.first_name.trim() || !form.last_name.trim())
      return "Completa nome e apelidos.";
    const allowed = allowedColsRef.current;
    if (allowed.has("phone") && !/^\d{9,15}$/.test((form.phone || "").trim()))
      return "O móbil debe ter entre 9 e 15 díxitos.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((form.email || "").trim()))
      return "O email non é válido.";
    return null;
  }

  const save = async (e) => {
    e.preventDefault();
    setInfo("");
    setErr("");

    const v = validate();
    if (v) return setErr(v);

    const allowed = allowedColsRef.current;
    const full_name =
      (form.full_name || `${form.first_name} ${form.last_name}`).trim();

    const payload = {
      id: (await supabase.auth.getUser()).data.user.id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      full_name,
      email: form.email.trim(),
      updated_at: new Date().toISOString(),
    };

    // Solo añadimos lo que exista realmente
    if (allowed.has("phone")) payload.phone = form.phone.trim() || null;
    if (allowed.has("dni")) payload.dni = form.dni.trim() || null;
    if (allowed.has("carnet_celta_id"))
      payload.carnet_celta_id = form.carnet_celta_id.trim() || null;
    if (allowed.has("birth_date")) payload.birth_date = form.birth_date || null;

    // Mantén sincronía opcional con columnas legado "nombre/apellidos" si existen
    if (allowed.has("nombre")) payload.nombre = form.first_name.trim();
    if (allowed.has("apellidos")) payload.apellidos = form.last_name.trim();

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

  // Estilos compactos (reutiliza clases de Login/Register para los inputs/CTA)
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

  const allowed = allowedColsRef.current;

  return (
    <main style={box}>
      <h2 style={h2s}>Perfil</h2>

      <form onSubmit={save} noValidate>
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

        {/* Nome completo (opcional) */}
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

        {/* Móbil (solo si existe columna) */}
        {allowed.has("phone") && (
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
              aria-label="Móbil"
            />
          </div>
        )}

        {/* Email */}
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

        <h3 style={h3s}>Datos opcións</h3>

        {/* DNI */}
        {allowed.has("dni") && (
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
        )}

        {/* ID Carnet Celta */}
        {allowed.has("carnet_celta_id") && (
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
        )}

        {/* Data de nacemento */}
        {allowed.has("birth_date") && (
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
        )}

        {info && <p style={{ color: "#065f46", margin: "10px 0" }}>{info}</p>}
        {err && <p style={{ color: "#b91c1c", margin: "10px 0" }}>{err}</p>}

        <div class="cta-wrap" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button type="submit">Gardar</button>
          <button type="button" onClick={requestDelete}>Solicitar borrado</button>
        </div>
      </form>
    </main>
  );
}
