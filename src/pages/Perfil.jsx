// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

/** Campo con icono (izq) y slot opcional (der) */
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
    padding: `10px ${rightSlot ? "56px" : "14px"} 10px ${icon ? "54px" : "14px"}`,
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
    display: icon ? "grid" : "none",
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "linear-gradient(135deg,#93c5fd,#0ea5e9)",
    boxShadow: "0 12px 28px rgba(14,165,233,.35)",
    placeItems: "center",
    pointerEvents: "none",
    zIndex: 2,
  };
  const right = {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    display: rightSlot ? "grid" : "none",
    placeItems: "center",
    zIndex: 3,
  };

  return (
    <div style={wrap}>
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
      <div style={iconBox}>{icon}</div>
      <div style={right}>{rightSlot}</div>
    </div>
  );
}

/* Utilidades formato fecha */
function isoToDisplay(iso = "") {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function displayToIso(s = "") {
  const v = s.replace(/\s+/g, "");
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return null;
  const dd = +m[1], mm = +m[2], yy = +m[3];
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yy < 1900) return null;
  return `${yy}-${String(mm).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;
}

export default function Perfil() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    dni: "",
    carnet_celta_id: "",
    birth_date: "", // ISO yyyy-mm-dd
  });
  const [birthDisplay, setBirthDisplay] = useState(""); // dd/mm/aaaa visible
  const [newPwd, setNewPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [info, setInfo] = useState("");
  const [err,   setErr] = useState("");
  const [pwdErr,setPwdErr] = useState("");

  const existingCols = useRef(new Set());
  const hiddenDateRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      const md  = u?.user?.user_metadata || {};
      if (!uid) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      existingCols.current = new Set(Object.keys(data || {}));

      const first =
        (data?.first_name || data?.nombre || md.first_name || (md.full_name || "").split(" ")[0] || "").trim();
      const last  =
        (data?.last_name || data?.apellidos || md.last_name  || (md.full_name || "").split(" ").slice(1).join(" ") || "").trim();

      const iso = data?.birth_date ? String(data.birth_date).slice(0,10) : "";
      setForm({
        first_name: first,
        last_name : last,
        email: (data?.email || u?.user?.email || "").trim(),
        phone: (data?.phone || "").toString(),
        dni: (data?.dni || "").toString(),
        carnet_celta_id: (data?.carnet_celta_id || "").toString(),
        birth_date: iso,
      });
      setBirthDisplay(isoToDisplay(iso));
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
    if (form.phone && !/^\d{9,15}$/.test(form.phone)) return "O móbil debe ter entre 9 e 15 díxitos.";
    if (newPwd && newPwd.length < 8) return "O novo contrasinal debe ter polo menos 8 caracteres.";
    return null;
  }

  async function saveAll(e) {
    e?.preventDefault?.();
    setInfo(""); setErr(""); setPwdErr("");

    if (birthDisplay) {
      const iso = displayToIso(birthDisplay);
      if (iso) setForm((f) => ({ ...f, birth_date: iso }));
    }

    const v = validate();
    if (v) return setErr(v);

    const cols = existingCols.current;
    const uid = (await supabase.auth.getUser()).data.user.id;

    const payload = {
      id: uid,
      first_name: form.first_name.trim(),
      last_name : form.last_name.trim(),
      email: form.email.trim(),
      updated_at: new Date().toISOString(),
    };
    if (cols.has("phone"))           payload.phone = form.phone.trim() || null;
    if (cols.has("dni"))             payload.dni   = form.dni.trim()   || null;
    if (cols.has("carnet_celta_id")) payload.carnet_celta_id = form.carnet_celta_id.trim() || null;
    if (cols.has("birth_date"))      payload.birth_date = form.birth_date || null;
    if (cols.has("nombre"))          payload.nombre   = form.first_name.trim();
    if (cols.has("apellidos"))       payload.apellidos= form.last_name.trim();

    const { error: upErr } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (upErr) return setErr(upErr.message);

    if (newPwd) {
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPwd });
      if (pwErr) return setPwdErr(pwErr.message || "Erro ao cambiar o contrasinal.");
      setNewPwd("");
    }

    setInfo("Datos actualizados.");
  }

  async function requestDelete(e) {
    e?.preventDefault?.();
    setInfo(""); setErr(""); setPwdErr("");

    const { data: u } = await supabase.auth.getUser();
    const uid  = u?.user?.id;
    const mail = u?.user?.email || "";
    const nome = `${form.first_name} ${form.last_name}`.trim() || mail;
    if (!uid) return setErr("Sesión non válida.");

    const { error } = await supabase.from("delete_requests").insert({ user_id: uid, reason: null });
    if (error) return setErr(error.message);

    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "HDCLiga@dmail.com";
      const { data: s } = await supabase.auth.getSession();
      const token = s?.session?.access_token;
      const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await fetch(`${baseUrl}/functions/v1/mail-send`, {
        method: "POST", headers,
        body: JSON.stringify({
          to: adminEmail,
          subject: "HDC Liga — Solicitude de borrado de conta",
          text: `O usuario ${nome} (${mail}) solicitou o borrado da súa conta.\nID: ${uid}\n\nAcción: validar e executar o borrado en Supabase.`,
        }),
      }).catch(console.error);

      await fetch(`${baseUrl}/functions/v1/mail-send`, {
        method: "POST", headers,
        body: JSON.stringify({
          to: mail,
          subject: "HDC Liga — Solicitude de borrado recibida",
          text: "Xestión da solicitude de borrado de conta en curso.\nRecibirás un correo de confirmación cando o administrador faga efectiva a túa petición.\nGrazas.",
        }),
      }).catch(console.error);
    } catch (e2) {
      console.error(e2);
    }

    setInfo("Solicitude enviada. Revisa o teu correo.");
  }

  /* Iconos */
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
  const IconCake = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v3" stroke={stroke} stroke-width="1.6" stroke-linecap="round" />
      <path d="M8 9h8a3 3 0 0 1 3 3v2H5v-2a3 3 0 0 1 3-3Z" stroke={stroke} stroke-width="1.6" />
      <path d="M5 16h14v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3Z" stroke={stroke} stroke-width="1.6" />
      <path d="M8.5 12c.6 0 1 .4 1 1s.4 1 1 1 1-.4 1-1 .4-1 1-1 1 .4 1 1 .4 1 1 1 1-.4 1-1"
        stroke={stroke} stroke-width="1.6" stroke-linecap="round" />
    </svg>
  );

  // Botón calendario (abre el date-picker oculto)
  const CalendarButton = (
    <button
      type="button"
      onClick={() => {
        try {
          if (hiddenDateRef.current?.showPicker) hiddenDateRef.current.showPicker();
          else hiddenDateRef.current?.focus();
        } catch {
          hiddenDateRef.current?.focus();
        }
      }}
      title="Abrir calendario"
      aria-label="Abrir calendario"
      style={{
        width: 34, height: 34, borderRadius: 10,
        border: "1px solid #e2e8f0", background: "#fff",
        boxShadow: "0 6px 18px rgba(0,0,0,.08)",
        display: "grid", placeItems: "center", cursor: "pointer",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="4.5" width="18" height="16" rx="2" stroke="#0ea5e9" stroke-width="1.8" />
        <path d="M7 2.5v4M17 2.5v4M3 9h18" stroke="#0ea5e9" stroke-width="1.8" />
      </svg>
    </button>
  );

  const box = { maxWidth: 640, margin: "18px auto 28px", padding: "0 16px", textAlign: "center" };
  const secTitle = {
    margin: "18px 0 4px", fontWeight: 700,
    fontFamily: "Montserrat,system-ui,sans-serif",
    fontSize: 16, color: "#0f172a", textAlign: "left",
  };
  const subTitle = {
    margin: "0 0 8px", fontWeight: 400,
    fontFamily: "Montserrat,system-ui,sans-serif",
    fontSize: 13, color: "#64748b", textAlign: "left",
  };

  // Estilos de botones (ancho completo + sombra máis forte)
  const fullBtnBase = {
    display: "inline-flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    padding: "12px 20px",
    borderRadius: 14,
    fontWeight: 700,
    fontFamily: "Montserrat,system-ui,sans-serif",
    fontSize: 15,
  };

  return (
    <main class="profile-page" style={box}>
      <form onSubmit={saveAll} noValidate style={{ textAlign: "left", margin: "0 auto", maxWidth: 520 }}>
        <h3 style={secTitle}>Información de xestión</h3>
        <p style={subTitle}>Datos de acceso e mantemento de conta</p>

        <Field id="first_name" placeholder="Nome" value={form.first_name} onInput={onChange("first_name")} ariaLabel="Nome" icon={IconUser} />
        <Field id="last_name"  placeholder="Apelidos" value={form.last_name}  onInput={onChange("last_name")}  ariaLabel="Apelidos" icon={IconUser} />
        <Field id="email" type="email" placeholder="Email" value={form.email} onInput={onChange("email")} ariaLabel="Email" icon={IconMail} />
        <Field id="phone" type="tel" placeholder="Móbil" value={form.phone} onInput={onChange("phone")} ariaLabel="Móbil" icon={IconPhone} inputProps={{ inputMode: "numeric", pattern: "\\d{9,15}" }} />

        <h3 style={secTitle}>Información complementaria</h3>
        <p style={subTitle}>Datos necesarios para ampliar funcionalidade</p>
        <Field id="dni" placeholder="DNI" value={form.dni} onInput={onChange("dni")} ariaLabel="DNI" icon={IconID} />
        <Field id="carnet_celta_id" placeholder="ID Carnet Celta" value={form.carnet_celta_id} onInput={onChange("carnet_celta_id")} ariaLabel="ID Carnet Celta" icon={IconCard} />

        {/* Fecha visible (dd/mm/aaaa) + date input oculto */}
        <Field
          id="birth_date_display"
          type="text"
          placeholder="dd/mm/aaaa"
          value={birthDisplay}
          onInput={(e) => {
            const v = e.currentTarget.value;
            setBirthDisplay(v);
            const iso = displayToIso(v);
            if (iso) setForm((f) => ({ ...f, birth_date: iso }));
          }}
          ariaLabel="Data de nacemento"
          icon={IconCake}
          rightSlot={CalendarButton}
          inputProps={{ inputMode: "numeric" }}
        />
        <input
          ref={hiddenDateRef}
          type="date"
          value={form.birth_date || ""}
          onInput={(e) => {
            const iso = e.currentTarget.value;
            setForm((f) => ({ ...f, birth_date: iso }));
            setBirthDisplay(isoToDisplay(iso));
          }}
          style={{ position: "absolute", left: "-9999px", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
          aria-hidden="true"
          tabIndex={-1}
        />

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

        {/* Botón ACTUALIZAR — ancho completo */}
        <div style={{ marginTop: 12 }}>
          <button
            type="submit"
            onClick={saveAll}
            style={{
              ...fullBtnBase,
              border: "1px solid #7dd3fc",
              background: "linear-gradient(135deg,#7dd3fc,#0ea5e9)",
              color: "#fff",
              boxShadow: "0 22px 48px rgba(14,165,233,.40)",
            }}
          >
            Actualizar
          </button>
        </div>

        {/* Cancelación de conta */}
        <h3 style={secTitle}>Cancelación de conta</h3>
        <p style={subTitle}>Solicitude de baixa e borrado de todos os meus datos de conta en HDC.</p>

        {/* Botón ELIMINAR — ancho completo */}
        <div style={{ marginTop: 6 }}>
          <button
            type="button"
            onClick={requestDelete}
            style={{
              ...fullBtnBase,
              border: "1px solid #fecaca",
              background: "linear-gradient(135deg,#fca5a5,#ef4444)",
              color: "#fff",
              boxShadow: "0 22px 48px rgba(239,68,68,.40)",
            }}
          >
            Enviar comunicación de solicitude de eliminación
          </button>
        </div>
      </form>
    </main>
  );
}






