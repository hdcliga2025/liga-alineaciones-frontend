// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

/** Campo de texto con icono dentro */
function Field({
  id,
  type = "text",
  placeholder,
  value,
  onInput,
  ariaLabel,
  icon,
  rightSlot,
  inputProps = {},
}) {
  const wrap = { position: "relative", marginBottom: 12 };
  const input = {
    width: "100%",
    height: 46,                            // un pouco menos alto
    padding: "10px 46px 10px 48px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontFamily:
      "Montserrat,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
    fontSize: 15,
    boxShadow: "inset 0 2px 6px rgba(0,0,0,.05)",
    outline: "none",
  };
  const iconBox = {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    width: 28,
    height: 28,
    display: "grid",
    placeItems: "center",
    pointerEvents: "none",
  };
  const right = {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    display: "grid",
    placeItems: "center",
  };
  return (
    <div style={wrap}>
      <div style={iconBox}>{icon}</div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onInput={onInput}
        aria-label={ariaLabel}
        style={input}
        {...inputProps}
      />
      {rightSlot && <div style={right}>{rightSlot}</div>}
    </div>
  );
}

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
        first_name: (data?.first_name || data?.nombre || "")?.trim(),
        last_name: (data?.last_name || data?.apellidos || "")?.trim(),
        email: (data?.email || "")?.trim(),
        phone: allowed.has("phone") ? (data?.phone || "") : "",
        dni: allowed.has("dni") ? (data?.dni || "") : "",
        carnet_celta_id: allowed.has("carnet_celta_id")
          ? (data?.carnet_celta_id || "")
          : "",
        birth_date:
          allowed.has("birth_date") && data?.birth_date
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
    e?.preventDefault?.();
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
    if (allowed.has("phone")) payload.phone = form.phone.trim() || null;
    if (allowed.has("dni")) payload.dni = form.dni.trim() || null;
    if (allowed.has("carnet_celta_id"))
      payload.carnet_celta_id = form.carnet_celta_id.trim() || null;
    if (allowed.has("birth_date")) payload.birth_date = form.birth_date || null;
    if (allowed.has("nombre")) payload.nombre = form.first_name.trim();
    if (allowed.has("apellidos")) payload.apellidos = form.last_name.trim();

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });
    if (error) setErr(error.message);
    else setInfo("Datos actualizados.");
  }

  async function changePassword() {
    setPwdErr("");
    setPwdInfo("");
    const pwd = newPwd || "";
    if (pwd.length < 8)
      return setPwdErr("O contrasinal debe ter polo menos 8 caracteres.");
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) setPwdErr(error.message || "Erro ao cambiar o contrasinal.");
    else {
      setPwdInfo("Contrasinal actualizado.");
      setNewPwd("");
      setShowPwd(false);
    }
  }

  async function requestDelete() {
    setInfo("");
    setErr("");
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return;
    const { error } = await supabase
      .from("delete_requests")
      .insert({ user_id: uid });
    if (error) setErr(error.message);
    else setInfo("Solicitude de borrado rexistrada. O equipo revisaraa.");
  }

  // estilos
  const box = {
    maxWidth: 640,
    margin: "18px auto 40px",
    padding: "0 16px",
    textAlign: "center",
  };
  const secTitle = {
    margin: "18px 0 8px",
    fontWeight: 700,
    fontFamily: "Montserrat,system-ui,sans-serif",
    fontSize: 16,
    color: "#0f172a",
    textAlign: "left",
  };
  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,                          // menos alto
    padding: "10px 18px",
    borderRadius: 16,
    border: "1px solid transparent",
    fontWeight: 700,
    fontFamily: "Montserrat,system-ui,sans-serif",
    fontSize: 15,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,.12)", // sombra suave
  };
  const btnCeleste = { ...btnBase, background: "#0ea5e9", borderColor: "#7dd3fc" };
  const btnRojo = { ...btnBase, background: "#ef4444", borderColor: "#fecaca" };

  const stroke = "#6b7280";
  const IconUser = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke={stroke} stroke-width="1.6" />
      <path d="M4 20a8 8 0 1 1 16 0" stroke={stroke} stroke-width="1.6" />
    </svg>
  );
  const IconMail = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke={stroke} stroke-width="1.6" />
      <path d="M3 6l9 7 9-7" stroke={stroke} stroke-width="1.6" />
    </svg>
  );
  const IconPhone = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke={stroke} stroke-width="1.6" />
      <path d="M12 5.2h0.01" stroke={stroke} stroke-width="1.6" />
      <circle cx="12" cy="18.5" r="1" fill={stroke} />
    </svg>
  );
  // Icono tarta con velas (data de nacemento)
  const IconCake = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* velas */}
      <path d="M8 6v3M12 6v3M16 6v3" stroke={stroke} stroke-width="1.6" stroke-linecap="round"/>
      {/* llamas */}
      <path d="M8 5l0-.5M12 5l0-.5M16 5l0-.5" stroke={stroke} stroke-width="1.6" stroke-linecap="round"/>
      {/* tarta */}
      <rect x="5" y="9" width="14" height="6" rx="1.5" stroke={stroke} stroke-width="1.6"/>
      {/* plato */}
      <path d="M4 17h16" stroke={stroke} stroke-width="1.6" stroke-linecap="round"/>
      {/* glaseado ondulado */}
      <path d="M6 12c1 .8 2-.8 3 0s2-.8 3 0 2-.8 3 0 2-.8 3 0" stroke={stroke} stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  );
  const IconID = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="14" rx="2" stroke={stroke} stroke-width="1.6" />
      <circle cx="7.5" cy="9" r="1.6" stroke={stroke} stroke-width="1.6" />
      <path d="M11 8.5h6M11 11h6" stroke={stroke} stroke-width="1.6" />
    </svg>
  );
  const IconCard = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="14" rx="2" stroke={stroke} stroke-width="1.6" />
      <path d="M6 9h12M6 12h8" stroke={stroke} stroke-width="1.6" />
    </svg>
  );
  const IconLock = (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke={stroke} stroke-width="1.6" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke={stroke} stroke-width="1.6" />
    </svg>
  );

  return (
    <main style={box}>
      <form
        onSubmit={saveProfile}
        noValidate
        style={{ textAlign: "left", margin: "0 auto", maxWidth: 520 }}
      >
        {/* === Datos necesarios de xestión === */}
        <h3 style={secTitle}>Datos necesarios de xestión</h3>

        <Field
          id="first_name"
          placeholder="Nome"
          value={form.first_name}
          onInput={onChange("first_name")}
          ariaLabel="Nome"
          icon={IconUser}
        />
        <Field
          id="last_name"
          placeholder="Apelidos"
          value={form.last_name}
          onInput={onChange("last_name")}
          ariaLabel="Apelidos"
          icon={IconUser}
        />
        <Field
          id="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onInput={onChange("email")}
          ariaLabel="Email"
          icon={IconMail}
        />
        {allowedColsRef.current.has("phone") && (
          <Field
            id="phone"
            type="tel"
            placeholder="Móbil"
            value={form.phone}
            onInput={onChange("phone")}
            ariaLabel="Móbil"
            icon={IconPhone}
            inputProps={{ inputMode: "numeric", pattern: "\\d{9,15}" }}
          />
        )}

        {/* === Datos opcionais === */}
        <h3 style={secTitle}>Datos opcionais para evolución de funcionalidades</h3>

        {allowedColsRef.current.has("dni") && (
          <Field
            id="dni"
            placeholder="DNI"
            value={form.dni}
            onInput={onChange("dni")}
            ariaLabel="DNI"
            icon={IconID}
          />
        )}

        {allowedColsRef.current.has("carnet_celta_id") && (
          <Field
            id="carnet_celta_id"
            placeholder="ID Carnet Celta"
            value={form.carnet_celta_id}
            onInput={onChange("carnet_celta_id")}
            ariaLabel="ID Carnet Celta"
            icon={IconCard}
          />
        )}

        {allowedColsRef.current.has("birth_date") && (
          <Field
            id="birth_date"
            type="date"
            placeholder="Data de nacemento"
            value={form.birth_date}
            onInput={onChange("birth_date")}
            ariaLabel="Data de nacemento"
            icon={IconCake}
          />
        )}

        {/* === Seguridade: novo contrasinal === */}
        <h3 style={secTitle}>Seguridade</h3>
        <Field
          id="new_pwd"
          type={showPwd ? "text" : "password"}
          placeholder="Novo contrasinal (8 caracteres mínimo)"
          value={newPwd}
          onInput={(e) => setNewPwd(e.currentTarget.value)}
          ariaLabel="Novo contrasinal"
          icon={IconLock}
          rightSlot={
            <button
              type="button"
              class="eye-btn"
              aria-label={showPwd ? "Ocultar contrasinal" : "Amosar contrasinal"}
              onClick={() => setShowPwd((s) => !s)}
              title={showPwd ? "Ocultar" : "Amosar"}
              style={{ background: "transparent", border: 0, cursor: "pointer" }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
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
          }
        />

        {/* Mensaxes */}
        {info && <p style={{ color: "#065f46", margin: "8px 0" }}>{info}</p>}
        {err && <p style={{ color: "#b91c1c", margin: "8px 0" }}>{err}</p>}
        {pwdInfo && <p style={{ color: "#065f46", margin: "8px 0" }}>{pwdInfo}</p>}
        {pwdErr && <p style={{ color: "#b91c1c", margin: "8px 0" }}>{pwdErr}</p>}

        {/* === Botóns finais: todos xuntos e en orde === */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
            marginTop: 8,
          }}
        >
          <button type="submit" style={btnCeleste} onClick={saveProfile}>
            Actualizar
          </button>
          <button type="button" style={btnCeleste} onClick={changePassword}>
            Cambiar contrasinal
          </button>
          <button type="button" style={btnRojo} onClick={requestDelete}>
            Solicitar borrado
          </button>
        </div>
      </form>

      {/* Logo HDC debaixo */}
      <div style={{ marginTop: 20 }}>
        <img
          src="/logoHDC.jpg"
          alt="HDC Logo"
          style={{ width: 160, height: "auto", opacity: 0.92 }}
        />
      </div>
    </main>
  );
}

