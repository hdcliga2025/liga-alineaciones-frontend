// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ===== Icons (outline, coherentes coa UI) ===== */
const IcoUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
  </svg>
);
const IcoMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="M3 7l9 6 9-6"/>
  </svg>
);
const IcoMobile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="7" y="2" width="10" height="20" rx="2"/>
    <path d="M11 18h2"/>
  </svg>
);
const IcoCake = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v4"/>
    <path d="M8 7h8a4 4 0 0 1 4 4v3H4v-3a4 4 0 0 1 4-4Z"/>
    <path d="M4 17c0 2 2 3 4 3s4-1 4-3c0 2 2 3 4 3s4-1 4-3"/>
  </svg>
);
const IcoId = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <circle cx="8" cy="12" r="2.5"/>
    <path d="M13 9h6M13 12h6M13 15h4"/>
  </svg>
);
/* Carnet Celta distinto (tarxeta con estrela) */
const IcoCardStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="M7 11h6M7 15h4"/>
    <path d="M18 11l1.2 2.4 2.6.38-1.9 1.85.45 2.57-2.35-1.24-2.35 1.24.45-2.57-1.9-1.85 2.6-.38L18 11z"/>
  </svg>
);

/* ===== Campo con icono dentro ===== */
function Field({ type="text", value, onInput, placeholder, disabled=false, required=false, pattern, name, icon }) {
  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#0ea5e9" }}>
        {icon}
      </div>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onInput={(e) => onInput?.(e.currentTarget.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        pattern={pattern}
        style={{
          width: "100%", padding: "12px 14px 12px 42px",
          border: "1px solid #e5e7eb", borderRadius: 10,
          fontFamily: "inherit", fontSize: 15,
          background: disabled ? "#f8fafc" : "#fff",
        }}
      />
    </div>
  );
}

/* Date field SEN texto (só icona + control nativo) */
function DateField({ value, onInput, disabled=false, name }) {
  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#0ea5e9" }}>
        <IcoCake />
      </div>
      <input
        type="date"
        name={name}
        value={value || ""}
        onInput={(e) => onInput?.(e.currentTarget.value)}
        disabled={disabled}
        lang="gl-ES"
        style={{
          width: "100%", padding: "12px 14px 12px 42px",
          border: "1px solid #e5e7eb", borderRadius: 10,
          fontFamily: "inherit", fontSize: 15,
          background: disabled ? "#f8fafc" : "#fff",
        }}
      />
    </div>
  );
}

export default function Perfil() {
  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState(false);
  const [msg, setMsg] = useState(null);

  // Obrigatorios
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");

  // Opcionais
  const [birthDate, setBirthDate] = useState("");
  const [dni,       setDni]       = useState("");
  const [carnetId,  setCarnetId]  = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("first_name,last_name,email,phone,birth_date,dni,carnet_celta_id")
        .eq("id", uid)
        .maybeSingle();

      if (mounted && data) {
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setBirthDate(data.birth_date ?? "");
        setDni(data.dni ?? "");
        setCarnetId(data.carnet_celta_id ?? "");
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  /* Botón styles (Gardar verde, Modificar celeste, Baixa rojo borde/texto) */
  const btnBase = {
    width: "100%",
    padding: "12px",
    borderRadius: 12,
    background: "#fff",
    fontWeight: 800,
    boxShadow: "0 2px 10px rgba(0,0,0,.08)",
    cursor: "pointer",
  };
  const btnSave   = { ...btnBase, border: "1px solid #22c55e", color: "#22c55e" };
  const btnEdit   = { ...btnBase, border: "1px solid #0ea5e9", color: "#0ea5e9" };
  const btnDanger = { ...btnBase, border: "1px solid #ef4444", color: "#ef4444" };

  async function handleSave() {
    setMsg(null);
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
      setMsg({ type: "err", text: "Completa os campos obrigatorios." });
      return;
    }
    if (!/^\+?\d{9,15}$/.test(phone.replace(/\s+/g, ""))) {
      setMsg({ type: "err", text: "O móbil debe ter entre 9 e 15 díxitos." });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id; if (!uid) return;

    const payload = {
      id: uid,
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      email:      email.trim(),
      phone:      phone.replace(/\s+/g, ""),
      birth_date: birthDate || null,
      dni:        dni?.trim() || null,
      carnet_celta_id: carnetId?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) { setMsg({ type: "err", text: "Erro gardando o perfil." }); return; }

    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const currentEmail = s?.user?.email;
      if (currentEmail && currentEmail !== email.trim()) {
        await supabase.auth.updateUser({ email: email.trim() });
        setMsg({ type: "ok", text: "Datos gardados. Revisa o correo para confirmar o novo email." });
      } else {
        setMsg({ type: "ok", text: "Datos gardados correctamente." });
      }
    } catch {
      setMsg({ type: "ok", text: "Datos gardados (o email manterase ata confirmación)." });
    }

    setEditable(false);
  }

  async function handleRequestDelete() {
    const ok = confirm("Confirmas solicitar a baixa? Poderás revogala contactando co club.");
    if (!ok) return;

    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id; if (!uid) return;

    // 1) Registrar a solicitude
    const { error } = await supabase.from("delete_requests").insert({
      user_id: uid,
      reason: "Solicitude de baixa dende Perfil",
      created_at: new Date().toISOString(),
    });
    if (error) { setMsg({ type: "err", text: "Non se puido rexistrar a solicitude." }); return; }

    // 2) Aviso interno
    await supabase.from("feedback").insert({
      user_id: uid,
      subject: "Solicitude de baixa",
      message: "O usuario solicitou a baixa dende o Perfil.",
      created_at: new Date().toISOString(),
    });

    // 3) Email automático (Edge Function se a configurades)
    try {
      await supabase.functions.invoke("mail-notify", {
        body: { type: "delete_requested", to: email, name: firstName || "soci@" },
      });
      setMsg({ type: "ok", text: "Solicitude rexistrada. Enviouse un correo de confirmación." });
    } catch {
      setMsg({ type: "ok", text: "Solicitude rexistrada. (Correo non enviado automaticamente)" });
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "14px 16px" }}>
      {/* Grid botóns: 1 col móbil, 3 col escritorio */}
      <style>{`
        .perfil-actions { display: grid; grid-template-columns: 1fr; gap: 10px; }
        @media (min-width: 680px) { .perfil-actions { grid-template-columns: 1fr 1fr 1fr; } }
      `}</style>

      {/* Encabezado solicitado */}
      <h1 style={{ fontWeight: 800, fontSize: 18, margin: "6px 0 4px" }}>
        Comunicación
      </h1>
      <p style={{ margin: "0 0 12px", fontSize: 15 }}>
        Comunicación: Mantén actualizados os teus datos
      </p>

      <section
        style={{
          border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff",
          boxShadow: "0 2px 10px rgba(0,0,0,.06)", padding: 14,
        }}
      >
        {/* Obrigatorios */}
        <Field icon={<IcoUser />}   placeholder="Nome"        value={firstName} onInput={setFirstName} disabled={!editable} required name="first_name" />
        <Field icon={<IcoUser />}   placeholder="Apelidos"    value={lastName}  onInput={setLastName}  disabled={!editable} required name="last_name" />
        <Field icon={<IcoMail />}   placeholder="Email"       value={email}     onInput={setEmail}     disabled={!editable} required name="email" type="email" />
        <Field icon={<IcoMobile />} placeholder="Móbil"       value={phone}     onInput={setPhone}     disabled={!editable} required name="phone" type="tel" pattern="^\+?\d{9,15}$" />

        <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "14px 0" }} />
        <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#334155" }}>Datos opcionais</p>

        <DateField value={birthDate} onInput={setBirthDate} disabled={!editable} name="birth_date" />
        <Field icon={<IcoId />}       placeholder="DNI"             value={dni}      onInput={setDni}      disabled={!editable} name="dni" />
        <Field icon={<IcoCardStar />} placeholder="ID Carnet Celta" value={carnetId} onInput={setCarnetId} disabled={!editable} name="carnet_celta_id" />

        {msg && (
          <p style={{ margin: "4px 0 10px", color: msg.type === "ok" ? "#16a34a" : "#ef4444", fontWeight: 600 }}>
            {msg.text}
          </p>
        )}

        <div className="perfil-actions">
          <button type="button" style={btnSave}   onClick={handleSave}            disabled={!editable || loading} title="Gardar cambios">Gardar</button>
          <button type="button" style={btnEdit}   onClick={() => { setEditable((e) => !e); setMsg(null); }} title="Editar datos">{editable ? "Cancelar" : "Modificar"}</button>
          <button type="button" style={btnDanger} onClick={handleRequestDelete}   title="Solicitar baixa">Solicitar baixa</button>
        </div>
      </section>
    </main>
  );
}
