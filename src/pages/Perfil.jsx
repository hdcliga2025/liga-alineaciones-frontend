// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

export default function Perfil() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    dni: "",
    carnet_celta_id: "",
    birth_date: "",
  });
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");
  const [pwdInfo, setPwdInfo] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // columnas realmente dispoñibles na táboa
  const allowedColsRef = useRef(new Set());

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

      setForm({
        first_name: (data?.first_name || data?.nombre || "").trim(),
        last_name: (data?.last_name || data?.apellidos || "").trim(),
        email: (data?.email || "").trim(),
        phone: allowed.has("phone") ? (data?.phone || "") : "",
        dni: allowed.has("dni") ? (data?.dni || "") : "",
        carnet_celta_id: allowed.has("carnet_celta_id") ? (data?.carnet_celta_id || "") : "",
        birth_date: allowed.has("birth_date") && data?.birth_date
          ? String(data.birth_date).slice(0, 10)
          : "",
      });
    })();
  }, []);

  const onlyDigits = (v) => v.replace(/\D/g, "");
  const onChange = (k) => (e) => {
    const v = e.currentTarget.value;
    setForm((f) => ({ ...f, [k]: k === "phone" ? onlyDigits(v) : v }));
  };

  function validate() {
    if (!form.first_name.trim() || !form.last_name.trim())
      return "Completa nome e apelidos.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((form.email || "").trim()))
      return "O email non é válido.";
    const allowed = allowedColsRef.current;
    if (allowed.has("phone") && form.phone && !/^\d{9,15}$/.test(form.phone))
      return "O móbil debe ter entre 9 e 15 díxitos.";
    return null;
  }

  async function saveProfile(e) {
    e.preventDefault();
    setInfo("");
    setErr("");
    const v = validate();
    if (v) return setErr(v);

    const allowed = allowedColsRef.current;
    const payload = {
      id: (await supabase.auth.getUser()).data.user.id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      updated_at: new Date().toISOString(),
    };
    // columnas opcionais
    if (allowed.has("phone")) payload.phone = form.phone.trim() || null;
    if (allowed.has("dni")) payload.dni = form.dni.trim() || null;
    if (allowed.has("carnet_celta_id"))
      payload.carnet_celta_id = form.carnet_celta_id.trim() || null;
    if (allowed.has("birth_date")) payload.birth_date = form.birth_date || null;

    // manter sincronía co legado se existen
    if (allowed.has("nombre")) payload.nombre = form.first_name.trim();
    if (allowed.has("apellidos")) payload.apellidos = form.last_name.trim();

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) setErr(error.message);
    else setInfo("Datos gardados.");
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwdErr("");
    setPwdInfo("");
    const pwd = newPwd || "";
    if (pwd.length < 8) {
      setPwdErr("O contrasinal debe ter polo menos 8 caracteres.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) setPwdErr(error.message || "Erro ao cambiar o contrasinal.");
    else {
      setPwdInfo("Contrasinal actualizado.");
      setNewPwd("");
      setShowPwd(false);
    }
  }

  // estilos
  const box = { maxWidth: 640, margin: "24px auto 40px", padding: "0 16px", textAlign: "center" };
  const h2s = { margin: "0 0 14px", fontFamily: "Montserrat,system-ui,sans-serif" };
  const h3s = {
    margin: "22px 0 10px",
    fontWeight: 700,
    fontFamily: "Montserrat,system-ui,sans-serif",
    fontSize: 16,
    color: "#0f172a",
  };
  const row = { marginBottom: "10px" };
  const iconSize = { width: 28, height: 28 };

  const allowed = allowedColsRef.current;

  return (
    <main style={box}>
      <h2 style={h2s}>Perfil</h2>

      <form onSubmit={saveProfile} noValidate style={{ textAlign: "left", margin: "0 auto", maxWidth: 520 }}>
        {/* === Datos necesarios de xestión === */}
        <h3 style={h3s}>Datos necesarios de xestión</h3>

        {/* Nome */}
        <div class="input-row" style={row}>
          <svg {...iconSize} class="icon-28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#6b7280" stroke-width="1.6"/>
            <path d="M4 20a8 8 0 1 1 16 0" stroke="#6b7280" stroke-width="1.6"/>
          </svg>
          <input
            id="first_name"
            type="text"
            placeholder="Nome"
            value={form.first_name}
            onInput={onChange("first_name")}
            required
            aria-label="Nome"
          />
        </div>

        {/* Apelidos */}
        <div class="input-row" style={row}>
          <svg {...iconSize} class="icon-28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#6b7280" stroke-width="1.6"/>
            <path d="M4 20a8 8 0 1 1 16 0" stroke="#6b7280" stroke-width="1.6"/>
          </svg>
          <input
            id="last_name"
            type="text"
            placeholder="Apelidos"
            value={form.last_name}
            onInput={onChange("last_name")}
            required
            aria-label="Apelidos"
          />
        </div>

        {/* Email */}
        <div class="input-row" style={row}>
          <svg {...iconSize} class="icon-28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.6"/>
            <path d="M3 6l9 7 9-7" stroke="#6b7280" stroke-width="1.6"/>
          </svg>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onInput={onChange("email")}
            required
            aria-label="Email"
          />
        </div>

        {/* Móbil */}
        {allowed.has("phone") && (
          <div class="input-row" style={row}>
            <svg {...iconSize} class="icon-28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke="#6b7280" stroke-width="1.6"/>
              <path d="M12 5.2h0.01" stroke="#6b7280" stroke-width="1.6"/>
              <circle cx="12" cy="18.5" r="1" fill="#6b7280"/>
            </svg>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              pattern="\d{9,15}"
              placeholder="Móbil"
              value={form.phone}
              onInput={onChange("phone")}
              aria-label="Móbil"
            />
          </div>
        )}

        {/* === Datos opcionais para evolución de funcionalidades === */}
        <h3 style={h3s}>Datos opcionais para evolución de funcionalidades</h3>

        {/* DNI */}
        {allowed.has("dni") && (
          <div class="input-row" style={row}>
            <svg {...iconSize} class="icon-28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.6"/>
              <circle cx="7.5" cy="9" r="1.6" stroke="#6b7280" stroke-width="1.6"/>
              <path d="M11 8.5h6M11 11h6" stroke="#6b7280" stroke-width="1.6"/>
            </svg>
            <input
              id="dni"
              type="text"
              placeholder="DNI"
              value={form.dni}
              onInput={onChange("dni")}
              aria-label="DNI"
            />
          </div>
        )}

        {/* ID Carnet Celta */}
        {allowed.has("carnet_celta_id") && (
          <div class="input-row" style={row}>
            <svg {...iconSize} class="icon-28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.6"/>
              <path d="M6 9h12M6 12h8" stroke="#6b7280" stroke-width="1.6"/>
            </svg>
            <input
              id="carnet_celta_id"
              type="text"
              placeholder="ID Carnet Celta"
              value={form.carnet_celta_id}
              onInput={onChange("carnet_celta_id")}
              aria-label="ID Carnet Celta"
            />
          </div>
        )}

        {/* Data de nacemento */}
        {allowed.has("birth_date") && (
          <div class="input-row" style={row}>
            <svg {...iconSize} class="icon-28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6b7280" stroke-width="1.6"/>
              <path d="M7 3.5v3M17 3.5v3M3 9h18" stroke="#6b7280" stroke-width="1.6"/>
            </svg>
            <input
              id="birth_date"
              type="date"
              placeholder="Data de nacemento"
              value={form.birth_date}
              onInput={onChange("birth_date")}
              aria-label="Data de nacemento"
            />
          </div>
        )}

        {/* Mensaxes de perfil */}
        {info && <p style={{ color: "#065f46", margin: "10px 0" }}>{info}</p>}
        {err && <p style={{ color: "#b91c1c", margin: "10px 0" }}>{err}</p>}

        {/* Botóns de acción principais (estilo Rexistro) */}
        <div class="cta-wrap" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button type="submit">Gardar</button>
          <button type="button" onClick={async () => {
            setInfo(""); setErr("");
            const { data: u } = await supabase.auth.getUser();
            const uid = u?.user?.id;
            if (!uid) return;
            const { error } = await supabase.from("delete_requests").insert({ user_id: uid });
            if (error) setErr(error.message);
            else setInfo("Solicitude de borrado rexistrada. O equipo revisaraa.");
          }}>Solicitar borrado</button>
        </div>

        {/* === Seguridade: cambio de contrasinal === */}
        <h3 style={h3s}>Seguridade</h3>
        <div class="input-row" style={row}>
          <svg {...iconSize} class="icon-28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="#6b7280" stroke-width="1.6"/>
            <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#6b7280" stroke-width="1.6"/>
          </svg>
          <input
            id="new_pwd"
            type={showPwd ? "text" : "password"}
            placeholder="Novo contrasinal (8 caracteres mínimo)"
            value={newPwd}
            onInput={(e) => setNewPwd(e.currentTarget.value)}
            aria-label="Novo contrasinal"
          />
          <button
            type="button"
            class="eye-btn"
            aria-label={showPwd ? "Ocultar contrasinal" : "Amosar contrasinal"}
            onClick={() => setShowPwd((s) => !s)}
            title={showPwd ? "Ocultar" : "Amosar"}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
              {showPwd ? (
                <g stroke="#6b7280" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3.2" />
                </g>
              ) : (
                <g stroke="#6b7280" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s4.5-7 10-7 10 7 10 7-4.5 7-10 7S2 12 2 12Z" />
                  <path d="M6 6l12 12" />
                </g>
              )}
            </svg>
          </button>
        </div>

        <div class="cta-wrap" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button type="button" onClick={changePassword}>Cambiar contrasinal</button>
        </div>
        {pwdInfo && <p style={{ color: "#065f46", margin: "10px 0" }}>{pwdInfo}</p>}
        {pwdErr && <p style={{ color: "#b91c1c", margin: "10px 0" }}>{pwdErr}</p>}
      </form>

      {/* Logo HDC debaixo */}
      <div style={{ marginTop: 18 }}>
        <img src="/logoHDC.jpg" alt="HDC Logo" style={{ width: 160, height: "auto", opacity: 0.92 }} />
      </div>
    </main>
  );
}
