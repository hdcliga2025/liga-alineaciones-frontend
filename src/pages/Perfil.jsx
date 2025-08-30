// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

/** Campo de texto con icona (opcional) dentro */
function Field({
  id,
  type = "text",
  placeholder,
  value,
  onInput,
  ariaLabel,
  icon = null,
  rightSlot,
  inputProps = {},
}) {
  const wrap = { position: "relative", marginBottom: 12 };
  const input = {
    width: "100%",
    height: 46,
    padding: `10px 46px 10px ${icon ? "54px" : "14px"}`,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontFamily: "Montserrat,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
    fontSize: 15,
    boxShadow: "inset 0 2px 6px rgba(0,0,0,.05)",
    outline: "none",
  };
  const iconBox = {
    display: icon ? "grid" : "none",
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "linear-gradient(135deg,#93c5fd,#0ea5e9)", // degradado celeste
    boxShadow: "0 12px 28px rgba(14,165,233,.35)",          // sombra ampla
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
  const [newPwd, setNewPwd] = useState("");
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const allowedColsRef = useRef(new Set());

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      const md  = u?.user?.user_metadata || {};
      if (!uid) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (error) { console.error(error); }

      const allowed = new Set(Object.keys(data || {}));
      allowedColsRef.current = allowed;

      // Fallbacks: se non existen columnas en táboa, colle de metadata
      const first =
        (data?.first_name || data?.nombre || md.first_name || (md.full_name||"").split(" ")[0] || "").trim();
      const last  =
        (data?.last_name  || data?.apellidos || md.last_name  || (md.full_name||"").split(" ").slice(1).join(" ") || "").trim();

      setForm({
        first_name: first,
        last_name:  last,
        email: (data?.email || u?.user?.email || "")?.trim(),
        phone: allowed.has("phone") ? (data?.phone || "") : "",
        dni: allowed.has("dni") ? (data?.dni || "") : "",
        carnet_celta_id: allowed.has("carnet_celta_id") ? (data?.carnet_celta_id || "") : "",
        birth_date: allowed.has("birth_date") && data?.birth_date ? String(data.birth_date).slice(0,10) : "",
      });
    })();
  }, []);

  const onlyDigits = (v) => v.replace(/\D/g, "");
  const onChange = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: k === "phone" ? onlyDigits(e.currentTarget.value) : e.currentTarget.value,
    }));

  function validate() {
    if (!form.first_name.trim() || !form.last_name.trim()) return "Completa nome e apelidos.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((form.email || "").trim())) return "O email non é válido.";
    const allowed = allowedColsRef.current;
    if (allowed.has("phone") && form.phone && !/^\d{9,15}$/.test(form.phone)) return "O móbil debe ter entre 9 e 15 díxitos.";
    if (newPwd && newPwd.length < 8) return "O novo contrasinal debe ter polo menos 8 caracteres.";
    return null;
  }

  async function saveAll(e) {
    e?.preventDefault?.();
    setInfo(""); setErr(""); setPwdErr("");

    const v = validate();
    if (v) return setErr(v);

    const allowed = allowedColsRef.current;
    const uid = (await supabase.auth.getUser()).data.user.id;

    // Perfil
    const payload = {
      id: uid,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      updated_at: new Date().toISOString(),
    };
    if (allowed.has("phone")) payload.phone = form.phone.trim() || null;
    if (allowed.has("dni")) payload.dni = form.dni.trim() || null;
    if (allowed.has("carnet_celta_id")) payload.carnet_celta_id = form.carnet_celta_id.trim() || null;
    if (allowed.has("birth_date")) payload.birth_date = form.birth_date || null;
    if (allowed.has("nombre")) payload.nombre = form.first_name.trim();
    if (allowed.has("apellidos")) payload.apellidos = form.last_name.trim();

    const { error: upErr } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (upErr) return setErr(upErr.message);

    // Cambio de contrasinal se procede
    if (newPwd) {
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPwd });
      if (pwErr) return setPwdErr(pwErr.message || "Erro ao cambiar o contrasinal.");
      setNewPwd("");
    }

    setInfo("Datos actualizados.");
  }

  async function requestDelete() {
    setInfo(""); setErr(""); setPwdErr("");
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return;
    const { error } = await supabase.from("delete_requests").insert({ user_id: uid });
    if (error) setErr(error.message);
    else setInfo("Solicitude de borrado rexistrada. O equipo revisaraa.");
  }

  // Estilos
  const box = { maxWidth: 640, margin: "18px auto 28px", padding: "0 16px", textAlign: "center" };
  const secTitle = {
    margin: "18px 0 4px",
    fontWeight: 700,
    fontFamily: "Montserrat,system-ui,sans-serif",
    fontSize: 16,
    color: "#0f172a",
    textAlign: "left",
  };
  const subTitle = {
    margin: "0 0 8px",
    fontWeight: 400,
    fontFamily: "Montserrat,system-ui,sans-serif",
    fontSize: 13,
    color: "#64748b",
    textAlign: "left",
  };

  // Botóns elegantes (degradado + sombra + hover)
  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    padding: "10px 20px",
    borderRadius: 12,
    border: "1px solid transparent",
    fontWeight: 700,
    fontFamily: "Montserrat,system-ui,sans-serif",
    fontSize: 15,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 12px 26px rgba(0,0,0,.18)",
    transition: "transform .12s ease, box-shadow .12s ease, filter .12s ease",
  };
  const btnCeleste = {
    ...btnBase,
    background: "linear-gradient(135deg,#7dd3fc,#0ea5e9)",
    borderColor: "#7dd3fc",
  };
  const btnRojo = {
    ...btnBase,
    background: "linear-gradient(135deg,#fca5a5,#ef4444)",
    borderColor: "#fecaca",
  };
  const hoverUp = { transform: "translateY(-1px)", boxShadow: "0 16px 30px rgba(0,0,0,.22)", filter: "saturate(1.05)" };

  // Iconas (trazo branco)
  const stroke = "#ffffff";
  const IconUser = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke={stroke} stroke-width="1.6" />
      <path d="M4 20a8 8 0 1 1 16 0" stroke={stroke} stroke-width="1.6" />
    </svg>
  );
  const IconMail = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke={stroke} stroke-width="1.6" />
      <path d="M3 6l9 7 9-7" stroke={stroke} stroke-width="1.6" />
    </svg>
  );
  const IconPhone = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" stroke={stroke} stroke-width="1.6" />
      <path d="M12 5.2h0.01" stroke={stroke} stroke-width="1.6" />
      <circle cx="12" cy="18.5" r="1" fill={stroke} />
    </svg>
  );
  const IconID = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="14" rx="2" stroke={stroke} stroke-width="1.6" />
      <circle cx="7.5" cy="9" r="1.6" stroke={stroke} stroke-width="1.6" />
      <path d="M11 8.5h6M11 11h6" stroke={stroke} stroke-width="1.6" />
    </svg>
  );
  const IconCard = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="14" rx="2" stroke={stroke} stroke-width="1.6" />
      <path d="M6 9h12M6 12h8" stroke={stroke} stroke-width="1.6" />
    </svg>
  );
  const IconLock = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke={stroke} stroke-width="1.6" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke={stroke} stroke-width="1.6" />
    </svg>
  );
  // Icono TARTA (para Data de nacemento)
  const IconCake = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v3" stroke={stroke} stroke-width="1.6" stroke-linecap="round" />
      <path d="M8 9h8a3 3 0 0 1 3 3v2H5v-2a3 3 0 0 1 3-3Z" stroke={stroke} stroke-width="1.6" />
      <path d="M5 16h14v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3Z" stroke={stroke} stroke-width="1.6" />
      <path d="M8.5 12c.6 0 1 .4 1 1s.4 1 1 1 1-.4 1-1 .4-1 1-1 1 .4 1 1 .4 1 1 1 1-.4 1-1" stroke={stroke} stroke-width="1.6" stroke-linecap="round" />
    </svg>
  );

  // Hovers locais para botóns
  const [hoverA, setHoverA] = useState(false);
  const [hoverB, setHoverB] = useState(false);

  return (
    <main class="profile-page" style={box}>
      {/* CSS para ocultar o icono nativo do date-picker */}
      <style>
        {`
        .profile-page input[type="date"]::-webkit-calendar-picker-indicator{ display:none; }
        .profile-page input[type="date"]::-webkit-inner-spin-button{ display:none; }
        .profile-page input[type="date"]{ appearance: textfield; -moz-appearance: textfield; }
        `}
      </style>

      <form onSubmit={saveAll} noValidate style={{ textAlign: "left", margin: "0 auto", maxWidth: 520 }}>
        {/* === Información de xestión === */}
        <h3 style={secTitle}>Información de xestión</h3>
        <p style={subTitle}>Datos de acceso e mantemento de conta</p>

        <Field id="first_name" placeholder="Nome" value={form.first_name} onInput={onChange("first_name")} ariaLabel="Nome" icon={IconUser} />
        <Field id="last_name" placeholder="Apelidos" value={form.last_name} onInput={onChange("last_name")} ariaLabel="Apelidos" icon={IconUser} />
        <Field id="email" type="email" placeholder="Email" value={form.email} onInput={onChange("email")} ariaLabel="Email" icon={IconMail} />
        {allowedColsRef.current.has("phone") && (
          <Field id="phone" type="tel" placeholder="Móbil" value={form.phone} onInput={onChange("phone")} ariaLabel="Móbil" icon={IconPhone} inputProps={{ inputMode: "numeric", pattern: "\\d{9,15}" }} />
        )}

        {/* === Información complementaria === */}
        <h3 style={secTitle}>Información complementaria</h3>
        <p style={subTitle}>Datos necesarios para ampliar funcionalidade</p>

        {allowedColsRef.current.has("dni") && (
          <Field id="dni" placeholder="DNI" value={form.dni} onInput={onChange("dni")} ariaLabel="DNI" icon={IconID} />
        )}
        {allowedColsRef.current.has("carnet_celta_id") && (
          <Field id="carnet_celta_id" placeholder="ID Carnet Celta" value={form.carnet_celta_id} onInput={onChange("carnet_celta_id")} ariaLabel="ID Carnet Celta" icon={IconCard} />
        )}
        {allowedColsRef.current.has("birth_date") && (
          <Field
            id="birth_date"
            type="date"
            placeholder="dd/mm/aaaa"
            value={form.birth_date}
            onInput={onChange("birth_date")}
            ariaLabel="Data de nacemento"
            icon={IconCake}           // icono tarta dentro
            inputProps={{}}
          />
        )}

        {/* === Seguridade === */}
        <h3 style={secTitle}>Seguridade</h3>
        <p style={subTitle}>Cambio de contrasinal</p>
        <Field
          id="new_pwd"
          type={showPwd ? "text" : "password"}
          placeholder="8 caracteres mínimo"
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
        {(err || pwdErr) && <p style={{ color: "#b91c1c", margin: "8px 0" }}>{err || pwdErr}</p>}

        {/* Botóns: esquerda/dereita con degradado, sombra e hover */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 10 }}>
          <button
            type="submit"
            style={{ 
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              minHeight:44, padding:"10px 20px",
              borderRadius:12, border:"1px solid #7dd3fc",
              background:"linear-gradient(135deg,#7dd3fc,#0ea5e9)", color:"#fff",
              fontWeight:700, fontFamily:"Montserrat,system-ui,sans-serif", fontSize:15,
              boxShadow:"0 16px 30px rgba(14,165,233,.28)" 
            }}
            onClick={saveAll}
          >
            Actualizar
          </button>
          <button
            type="button"
            style={{ 
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              minHeight:44, padding:"10px 20px",
              borderRadius:12, border:"1px solid #fecaca",
              background:"linear-gradient(135deg,#fca5a5,#ef4444)", color:"#fff",
              fontWeight:700, fontFamily:"Montserrat,system-ui,sans-serif", fontSize:15,
              boxShadow:"0 16px 30px rgba(239,68,68,.28)" 
            }}
            onClick={requestDelete}
          >
            Solicitar borrado
          </button>
        </div>
      </form>

      {/* Logo HDC un pouco máis arriba */}
      <div style={{ marginTop: 12 }}>
        <img src="/logoHDC.jpg" alt="HDC Logo" style={{ width: 160, height: "auto", opacity: 0.92 }} />
      </div>
    </main>
  );
}

