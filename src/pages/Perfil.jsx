// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

/* ====== Icons (outline, coherentes coa UI) ====== */
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
    <path d="M4 4h16v16H4z" />
    <path d="M22 6l-10 7L2 6" />
  </svg>
);
const IcoPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92V21a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 5.18 2 2 0 0 1 4 3h4.09a2 2 0 0 1 2 1.72l.37 2.21a2 2 0 0 1-.55 1.86L8.09 10a16 16 0 0 0 6 6l1.21-1.82a2 2 0 0 1 1.86-.55l2.21.37A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IcoCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
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

/* ====== Campo con icono dentro ====== */
function Field({
  type = "text",
  value,
  onInput,
  placeholder,
  disabled = false,
  required = false,
  pattern,
  name,
  icon
}) {
  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <div
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#0ea5e9",
        }}
      >
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
          width: "100%",
          padding: "12px 14px 12px 42px",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          fontFamily: "inherit",
          fontSize: 15,
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

  // Campos obrigatorios
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");

  // Opcionais
  const [birthDate, setBirthDate] = useState(""); // yyyy-mm-dd
  const [dni,       setDni]       = useState("");
  const [carnetId,  setCarnetId]  = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { setLoading(false); return; }

      // Ler o perfil coas novas columnas (se existen)
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

  const btnBase = {
    width: "100%",
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
    color: "#0ea5e9",
    fontWeight: 800,
    boxShadow: "0 2px 10px rgba(0,0,0,.08)",
    cursor: "pointer",
  };

  const btnDanger = {
    ...btnBase,
    background: "#ef4444",
    color: "#111",
    border: "1px solid #991b1b",
  };

  async function handleSave() {
    setMsg(null);

    // Validacións simples
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
      setMsg({ type: "err", text: "Completa os campos obrigatorios." });
      return;
    }
    if (!/^\+?\d{9,15}$/.test(phone.replace(/\s+/g, ""))) {
      setMsg({ type: "err", text: "O móbil debe ter entre 9 e 15 díxitos." });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return;

    // Actualiza tabla profiles
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
    if (error) {
      setMsg({ type: "err", text: "Erro gardando o perfil." });
      return;
    }

    // (Opcional) tentar actualizar o email de autenticación se cambiou
    try {
      const currentEmail = session?.user?.email;
      if (currentEmail && currentEmail !== email.trim()) {
        await supabase.auth.updateUser({ email: email.trim() });
        setMsg({
          type: "ok",
          text: "Datos gardados. Revisarás un correo para confirmar o novo email (se cambiou).",
        });
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
    const uid = session?.user?.id;
    if (!uid) return;

    const { error } = await supabase.from("delete_requests").insert({
      user_id: uid,
      reason: "Solicitude de baixa dende Perfil",
      created_at: new Date().toISOString(),
    });
    if (error) setMsg({ type: "err", text: "Non se puido rexistrar a solicitude." });
    else setMsg({ type: "ok", text: "Solicitude de baixa enviada. Contactaremos axiña." });
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "14px 16px" }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, margin: "6px 0 12px" }}>
        Axúdanos a manter actualizados os teus datos
      </h1>

      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          background: "#fff",
          boxShadow: "0 2px 10px rgba(0,0,0,.06)",
          padding: 14,
        }}
      >
        {/* Obrigatorios */}
        <Field
          icon={<IcoUser />}
          placeholder="Nome"
          value={firstName}
          onInput={setFirstName}
          disabled={!editable}
          required
          name="first_name"
        />
        <Field
          icon={<IcoUser />}
          placeholder="Apelidos"
          value={lastName}
          onInput={setLastName}
          disabled={!editable}
          required
          name="last_name"
        />
        <Field
          icon={<IcoMail />}
          placeholder="Email"
          value={email}
          onInput={setEmail}
          disabled={!editable}
          required
          name="email"
          type="email"
        />
        <Field
          icon={<IcoPhone />}
          placeholder="Móbil"
          value={phone}
          onInput={setPhone}
          disabled={!editable}
          required
          name="phone"
          type="tel"
          pattern="^\+?\d{9,15}$"
        />

        {/* Separador + Opcionais */}
        <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "14px 0" }} />
        <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#334155" }}>Datos opcionais</p>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#0ea5e9",
              pointerEvents: "none",
            }}
          >
            <IcoCalendar />
          </div>
          <input
            type="date"
            value={birthDate || ""}
            disabled={!editable}
            onInput={(e) => setBirthDate(e.currentTarget.value)}
            style={{
              width: "100%",
              padding: "12px 14px 12px 42px",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              fontFamily: "inherit",
              fontSize: 15,
              background: !editable ? "#f8fafc" : "#fff",
            }}
          />
        </div>

        <Field
          icon={<IcoId />}
          placeholder="DNI"
          value={dni}
          onInput={setDni}
          disabled={!editable}
          name="dni"
        />

        <Field
          icon={<IcoId />}
          placeholder="ID Carnet Celta"
          value={carnetId}
          onInput={setCarnetId}
          disabled={!editable}
          name="carnet_celta_id"
        />

        {/* Mensaxes */}
        {msg && (
          <p
            style={{
              margin: "4px 0 10px",
              color: msg.type === "ok" ? "#16a34a" : "#ef4444",
              fontWeight: 600,
            }}
          >
            {msg.text}
          </p>
        )}

        {/* Botóns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
          <button
            type="button"
            style={btnBase}
            onClick={handleSave}
            disabled={!editable || loading}
            title="Gardar cambios"
          >
            Gardar
          </button>

          <button
            type="button"
            style={btnBase}
            onClick={() => { setEditable((e) => !e); setMsg(null); }}
            title="Editar datos"
          >
            {editable ? "Cancelar" : "Modificar"}
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            style={btnDanger}
            onClick={handleRequestDelete}
            title="Solicitar baixa"
          >
            Solicitar baixa
          </button>
        </div>
      </section>
    </main>
  );
}
