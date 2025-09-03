// src/pages/Perfil.jsx
import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

const WRAP = { maxWidth: 920, margin: "0 auto", padding: "16px" };
const CARD = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  background: "#fff",
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: "18px 16px",
  marginBottom: 16,
};
const H1 = { margin: "0 0 2px", fontFamily: "Montserrat, system-ui, sans-serif", fontSize: 20, color: "#0f172a" };
const SUB = { margin: "0 0 14px", color: "#64748b", fontSize: 14 };

const ROW = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const LABEL = { display: "block", margin: "0 0 6px 6px", fontSize: 14, color: "#334155", fontWeight: 500 };
const INPUT = {
  width: "100%",
  padding: "14px 12px 14px 44px",
  borderRadius: 14,
  border: "1px solid #dbe2f0",
  outline: "none",
  fontFamily: "Montserrat, system-ui, sans-serif",
  fontSize: 15,
  color: "#0f172a",
  background: "#fff",
};
const INPUT_BOLD = { ...INPUT, fontWeight: 700 };
const ICONBOX = { position: "relative" };
const ICON = { position: "absolute", left: 10, top: 12, width: 22, height: 22, opacity: 0.9 };

const BTN = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid #60a5fa",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  backgroundImage: "linear-gradient(180deg,#67b1ff,#5a8df5)",
  boxShadow: "0 10px 26px rgba(59,130,246,.35)",
};
const OK = { marginTop: 10, color: "#065f46", fontSize: 14 };
const ERR = { marginTop: 10, color: "#b91c1c", fontSize: 14 };

/* Ocultar icono nativo del date (derecha) sin interceptar clics */
const STYLE_HIDE_NATIVE_DATE = `
  .pf-date::-webkit-calendar-picker-indicator{ opacity:0; display:none; }
  .pf-date::-webkit-inner-spin-button{ display:none; }
  .pf-date{ -webkit-appearance:none; appearance:none; }
  .pf-date-hide{ position:absolute; right:0; top:0; width:44px; height:100%; background:#fff; border-radius:0 14px 14px 0; pointer-events:none; }
`;

function toYMD(v="") {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return (String(v).split("T")[0]) || "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Perfil() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [dni,       setDni]       = useState("");
  const [carnet,    setCarnet]    = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [toast, setToast] = useState("");
  const toastTimerRef = useRef(null);

  const birthRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: s } = await supabase.auth.getSession();
        const u = s?.session?.user || null;
        if (!u) { setLoading(false); return; }
        if (alive) { setEmail(u.email || ""); setUid(u.id); }

        const { data: p } = await supabase
          .from("profiles")
          .select("first_name,last_name,phone,dni,carnet_celta_id,birth_date")
          .eq("id", u.id)
          .maybeSingle();

        if (alive && p) {
          setFirstName(p.first_name || "");
          setLastName(p.last_name || "");
          setPhone(p.phone || "");
          setDni(p.dni || "");
          setCarnet(p.carnet_celta_id || "");
          setBirthDate(toYMD(p.birth_date || ""));
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; clearTimeout(toastTimerRef.current); };
  }, []);

  function openDatePicker() {
    try { birthRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
    try {
      if (typeof birthRef.current?.showPicker === "function") birthRef.current.showPicker();
      else birthRef.current?.focus();
    } catch {}
  }

  async function ensureProfileRow() {
    if (!uid) return;
    await supabase.from("profiles").upsert({ id: uid, email }, { onConflict: "id" });
  }

  async function onActualizarPerfil(e) {
    e?.preventDefault?.();
    setErr(""); setMsg("");
    try {
      setSaving(true);
      if (!uid) throw new Error("Sen sesión.");
      await ensureProfileRow();

      const payload = {
        first_name: firstName || null,
        last_name:  lastName  || null,
        phone:      phone     || null,
        dni:        dni       || null,
        carnet_celta_id: carnet || null,
        birth_date: birthDate || null,
        updated_at: new Date().toISOString(),
      };
      const { error: updErr } = await supabase.from("profiles").update(payload).eq("id", uid);
      if (updErr) throw updErr;

      if (newPassword && newPassword.trim().length >= 8) {
        const { error: passErr } = await supabase.auth.updateUser({ password: newPassword.trim() });
        if (passErr) throw passErr;
      }
      setNewPassword("");

      setToast("Cambios gardados");
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToast(""), 2000);
      setMsg("Grazas, os teus datos foron actualizados.");
    } catch (e2) {
      console.error(e2);
      setErr(`Erro ao actualizar o perfil.${e2?.message ? ` (${e2.message})` : ""}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main style={WRAP}>Cargando…</main>;

  return (
    <main style={WRAP}>
      <style>{STYLE_HIDE_NATIVE_DATE}</style>

      {toast && (
        <div role="status" aria-live="polite" style={{
          position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)",
          background: "#0ea5e9", color: "#fff", padding: "10px 14px", borderRadius: 999,
          boxShadow: "0 10px 24px rgba(14,165,233,.35)", fontWeight: 700, zIndex: 9999,
        }}>
          {toast}
        </div>
      )}

      {/* Información de xestión */}
      <section style={CARD}>
        <h2 style={H1}>Información de xestión</h2>
        <p style={SUB}>Datos de acceso e mantemento de conta</p>

        <div style={ROW}>
          <div>
            <label style={LABEL}>Nome</label>
            <div style={ICONBOX}>
              <svg style={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="#60a5fa" strokeWidth="1.6" />
                <path d="M4 20c2.4-4 13.6-4 16 0" stroke="#60a5fa" strokeWidth="1.6" />
              </svg>
              <input
                style={INPUT_BOLD}
                value={firstName}
                onInput={(e) => setFirstName(e.currentTarget.value)}
                placeholder="Nome"
              />
            </div>
          </div>

          <div>
            <label style={LABEL}>Apelidos</label>
            <div style={ICONBOX}>
              <svg style={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="#60a5fa" strokeWidth="1.6" />
                <path d="M4 20c2.4-4 13.6-4 16 0" stroke="#60a5fa" strokeWidth="1.6" />
              </svg>
              <input
                style={INPUT_BOLD}
                value={lastName}
                onInput={(e) => setLastName(e.currentTarget.value)}
                placeholder="Apelidos"
              />
            </div>
          </div>
        </div>

        <div style={{ ...ROW, marginTop: 12 }}>
          <div>
            <label style={LABEL}>Email</label>
            <div style={ICONBOX}>
              <svg style={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#9ca3af" strokeWidth="1.6" />
                <path d="M3 6l9 7 9-7" stroke="#9ca3af" strokeWidth="1.6" />
              </svg>
              <input style={{ ...INPUT, color: "#6b7280" }} value={email} readOnly />
            </div>
          </div>

          <div>
            <label style={LABEL}>Móbil</label>
            <div style={ICONBOX}>
              <svg style={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="#60a5fa" strokeWidth="1.6" />
                <circle cx="12" cy="18" r="1.2" fill="#60a5fa" />
              </svg>
              <input
                type="tel"
                style={INPUT_BOLD}
                placeholder="+34 600 000 000"
                value={phone}
                onInput={(e) => setPhone(e.currentTarget.value)}
                autoComplete="tel"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Información complementaria */}
      <section style={CARD}>
        <h2 style={H1}>Información complementaria</h2>
        <p style={SUB}>Datos necesarios para ampliar funcionalidade</p>

        <div style={ROW}>
          <div>
            <label style={LABEL}>DNI</label>
            <div style={ICONBOX}>
              <svg style={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#60a5fa" strokeWidth="1.6" />
                <path d="M6 9h12M6 13h8" stroke="#60a5fa" strokeWidth="1.6" />
              </svg>
              <input
                style={INPUT_BOLD}
                value={dni}
                onInput={(e) => setDni(e.currentTarget.value.toUpperCase())}
                placeholder="DNI"
              />
            </div>
          </div>

          <div>
            <label style={LABEL}>ID Carnet Celta</label>
            <div style={ICONBOX}>
              <svg style={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#60a5fa" strokeWidth="1.6" />
                <path d="M6 13h12" stroke="#60a5fa" strokeWidth="1.6" />
              </svg>
              <input
                style={INPUT_BOLD}
                value={carnet}
                onInput={(e) => setCarnet(e.currentTarget.value.toUpperCase())}
                placeholder="ID"
              />
            </div>
          </div>
        </div>

        <div style={{ ...ROW, marginTop: 12 }}>
          <div>
            <label style={LABEL}>Data de nacemento</label>

            <div
              style={{ position: "relative" }}
              onClick={openDatePicker}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDatePicker(); } }}
            >
              {/* ICONO DE CALENDARIO (recuperado) */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ position: "absolute", left: 10, top: 12 }}>
                <rect x="3" y="4.5" width="18" height="16" rx="2" stroke="#60a5fa" strokeWidth="1.6" />
                <path d="M7 2.5v4M17 2.5v4M3 9h18" stroke="#60a5fa" strokeWidth="1.6" />
              </svg>

              <input
                ref={birthRef}
                type="date"
                class="pf-date"
                style={INPUT}
                value={birthDate}
                onInput={(e) => setBirthDate(e.currentTarget.value)}
              />
              <span class="pf-date-hide" />
            </div>
          </div>

          <div>
            <label style={LABEL}>Nova contrasinal</label>
            <div style={ICONBOX}>
              <svg style={ICON} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" stroke="#60a5fa" strokeWidth="1.6" />
                <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#60a5fa" strokeWidth="1.6" />
              </svg>
              <input
                type="password"
                style={INPUT_BOLD}
                placeholder="8 caracteres mínimo"
                value={newPassword}
                onInput={(e) => setNewPassword(e.currentTarget.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>
      </section>

      <section style={CARD}>
        <button style={BTN} onClick={onActualizarPerfil} disabled={saving}>
          {saving ? "Actualizando…" : "Actualizar"}
        </button>
        {msg && <p style={OK}>{msg}</p>}
        {err && <p style={ERR}>{err}</p>}
      </section>
    </main>
  );
}
