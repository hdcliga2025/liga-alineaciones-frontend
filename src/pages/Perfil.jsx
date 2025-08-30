// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

/** Campo reutilizable con icono (izq) y slot opcional (der) */
function Field({ id, type="text", placeholder, value, onInput, ariaLabel, icon=null, rightSlot, inputProps={} }) {
  const wrap = { position: "relative", marginBottom: 12 };
  const input = {
    width: "100%",
    height: 46,
    padding: `10px ${rightSlot ? "56px" : "14px"} 10px ${icon ? "54px" : "14px"}`,
    borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff",
    fontFamily: "Montserrat,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
    fontSize: 15, boxShadow: "inset 0 2px 6px rgba(0,0,0,.05)", outline: "none",
  };
  const iconBox = {
    display: icon ? "grid" : "none",
    position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
    width: 32, height: 32, borderRadius: 10,
    background: "linear-gradient(135deg,#93c5fd,#0ea5e9)",
    boxShadow: "0 12px 28px rgba(14,165,233,.35)", placeItems: "center",
    pointerEvents: "none",
  };
  const right = {
    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
    display: rightSlot ? "grid" : "none", placeItems: "center",
  };

  return (
    <div style={wrap}>
      <div style={iconBox}>{icon}</div>
      <input
        id={id} type={type} placeholder={placeholder} value={value}
        onInput={onInput} aria-label={ariaLabel} style={input} {...inputProps}
      />
      <div style={right}>{rightSlot}</div>
    </div>
  );
}

export default function Perfil() {
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", birth_date: "",
  });
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");
  const birthRef = useRef(null);
  const allowedColsRef = useRef(new Set());

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      const md = u?.user?.user_metadata || {};
      if (!uid) return;

      const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      allowedColsRef.current = new Set(Object.keys(data || {}));

      const first =
        (data?.first_name || data?.nombre || md.first_name || (md.full_name || "").split(" ")[0] || "").trim();
      const last =
        (data?.last_name || data?.apellidos || md.last_name || (md.full_name || "").split(" ").slice(1).join(" ") || "").trim();

      setForm({
        first_name: first,
        last_name: last,
        email: (data?.email || u?.user?.email || "")?.trim(),
        birth_date: allowedColsRef.current.has("birth_date") && data?.birth_date
          ? String(data.birth_date).slice(0, 10)
          : "",
      });
    })();
  }, []);

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.currentTarget.value }));

  async function save(e) {
    e?.preventDefault?.();
    setInfo(""); setErr("");

    if (!form.first_name.trim() || !form.last_name.trim())
      return setErr("Completa nome e apelidos.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((form.email || "").trim()))
      return setErr("O email non é válido.");

    const uid = (await supabase.auth.getUser()).data.user.id;
    const allowed = allowedColsRef.current;

    const payload = {
      id: uid,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      updated_at: new Date().toISOString(),
    };
    if (allowed.has("birth_date")) payload.birth_date = form.birth_date || null;
    if (allowed.has("nombre")) payload.nombre = form.first_name.trim();
    if (allowed.has("apellidos")) payload.apellidos = form.last_name.trim();

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) return setErr(error.message);
    setInfo("Datos actualizados.");
  }

  async function requestDelete() {
    setInfo(""); setErr("");
    const { data: u } = await supabase.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return setErr("Sesión non válida.");
    const { error } = await supabase.from("delete_requests").insert({ user_id: uid });
    if (error) return setErr(error.message);
    setInfo("Solicitude de borrado rexistrada. O equipo revisaraa.");
  }

  // ===== Iconos (estilo homogéneo) =====
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
  const IconCake = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v3" stroke={stroke} stroke-width="1.6" stroke-linecap="round" />
      <path d="M8 9h8a3 3 0 0 1 3 3v2H5v-2a3 3 0 0 1 3-3Z" stroke={stroke} stroke-width="1.6" />
      <path d="M5 16h14v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3Z" stroke={stroke} stroke-width="1.6" />
      <path d="M8.5 12c.6 0 1 .4 1 1s.4 1 1 1 1-.4 1-1 .4-1 1-1 1 .4 1 1 .4 1 1 1 1-.4 1-1" stroke={stroke} stroke-width="1.6" stroke-linecap="round" />
    </svg>
  );

  // Botón calendario (derecha), propio y pegado al valor
  const CalendarButton = (
    <button
      type="button"
      onClick={() => {
        try {
          if (birthRef.current?.showPicker) birthRef.current.showPicker();
          else birthRef.current?.focus();
        } catch { birthRef.current?.focus(); }
      }}
      title="Abrir calendario"
      aria-label="Abrir calendario"
      style={{
        width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0",
        background: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,.08)",
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
  const label = { margin: "18px 0 4px", fontWeight: 700, fontFamily: "Montserrat,system-ui,sans-serif", fontSize: 16, color: "#0f172a", textAlign: "left" };
  const sub =   { margin: "0 0 8px",    fontWeight: 400, fontFamily: "Montserrat,system-ui,sans-serif", fontSize: 13, color: "#64748b", textAlign: "left" };

  return (
    <main class="profile-page" style={box}>
      {/* Ocultar icono nativo del date input */}
      <style>{`
        .profile-page input[type="date"]::-webkit-calendar-picker-indicator{ display:none; }
        .profile-page input[type="date"]::-webkit-inner-spin-button{ display:none; }
        .profile-page input[type="date"]{ appearance:textfield; -moz-appearance:textfield; }
      `}</style>

      {/* Bloque 1: Datos de acceso */}
      <h3 style={label}>Información de xestión</h3>
      <p style={sub}>Datos de acceso e mantemento de conta</p>

      <Field id="first_name" placeholder="Nome" value={form.first_name} onInput={onChange("first_name")} ariaLabel="Nome" icon={IconUser} />
      <Field id="last_name"  placeholder="Apelidos" value={form.last_name}  onInput={onChange("last_name")}  ariaLabel="Apelidos" icon={IconUser} />
      <Field id="email" type="email" placeholder="Email" value={form.email} onInput={onChange("email")} ariaLabel="Email" icon={IconMail} />

      {/* Bloque 2: Complementaria (solo birth_date) */}
      <h3 style={label}>Información complementaria</h3>
      <p style={sub}>Datos necesarios para ampliar funcionalidade</p>

      <Field
        id="birth_date"
        type="date"
        placeholder="dd/mm/aaaa"
        value={form.birth_date}
        onInput={onChange("birth_date")}
        ariaLabel="Data de nacemento"
        icon={IconCake}
        rightSlot={CalendarButton}
        inputProps={{ ref: birthRef }}
      />

      {/* Mensajes */}
      {info && <p style={{ color:"#065f46", margin:"8px 0" }}>{info}</p>}
      {err  && <p style={{ color:"#b91c1c", margin:"8px 0" }}>{err}</p>}

      {/* Botones + logo “metido” entre ambos */}
      <div style={{ position: "relative", marginTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <button
            type="button" onClick={save}
            style={{
              minHeight: 44, padding: "10px 20px", borderRadius: 12,
              border: "1px solid #7dd3fc", background: "linear-gradient(135deg,#7dd3fc,#0ea5e9)",
              color: "#fff", fontWeight: 700, fontFamily: "Montserrat,system-ui,sans-serif",
              fontSize: 15, boxShadow: "0 16px 30px rgba(14,165,233,.28)"
            }}
          >
            Actualizar
          </button>

          <button
            type="button" onClick={requestDelete}
            style={{
              minHeight: 44, padding: "10px 20px", borderRadius: 12,
              border: "1px solid #fecaca", background: "linear-gradient(135deg,#fca5a5,#ef4444)",
              color: "#fff", fontWeight: 700, fontFamily: "Montserrat,system-ui,sans-serif",
              fontSize: 15, boxShadow: "0 16px 30px rgba(239,68,68,.28)"
            }}
          >
            Solicitar borrado
          </button>
        </div>

        {/* Logo subido para que “se cuele” entre los botones */}
        <div style={{ textAlign:"center", marginTop:-18, pointerEvents:"none" }}>
          <img src="/logoHDC.jpg" alt="HDC Logo" style={{ width:170, height:"auto", opacity:.95 }} />
        </div>
      </div>
    </main>
  );
}

