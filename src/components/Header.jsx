// src/components/Header.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

const IcoBack = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);

const IcoShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

export default function Header() {
  const [now, setNow] = useState("");
  const [blink, setBlink] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // reloj
    const fmt = () =>
      new Intl.DateTimeFormat("gl-ES", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false, timeZone: "Europe/Madrid",
      }).format(new Date());
    setNow(fmt());
    const t1 = setInterval(() => setNow(fmt()), 1000);
    const t2 = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 600); }, 5000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  useEffect(() => {
    // comprobar admin (rpc is_admin ou role no perfil)
    (async () => {
      try {
        const { data: rpc } = await supabase.rpc("is_admin");
        if (rpc === true) { setIsAdmin(true); return; }
      } catch {}
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) return;
        const { data } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
        setIsAdmin(data?.role === "admin");
      } catch {}
    })();
  }, []);

  const bar = {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 52,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "8px 12px",
    background: "rgba(0, 64, 128, 0.10)", // ~90% transparente
    backdropFilter: "saturate(120%) blur(2px)", WebkitBackdropFilter: "saturate(120%) blur(2px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  };

  const clock = {
    fontFamily: "'Montserrat', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
    fontWeight: 800,
    fontSize: 16, // un poco mayor
    color: blink ? "#0ea5e9" : "#0f172a",
    whiteSpace: "nowrap",
    transition: "color .25s ease",
    opacity: 0.96,
  };

  const btn = {
    width: 38, height: 38, display: "grid", placeItems: "center",
    borderRadius: 12, border: "1px solid #e5e7eb",
    background: "#fff", color: "#0ea5e9",
    boxShadow: "0 2px 8px rgba(0,0,0,.06)", cursor: "pointer",
  };

  const leftWrap  = { position: "absolute", left: 8,  top: 7, display: "flex", gap: 8 };
  const rightWrap = { position: "absolute", right: 8, top: 7, display: "flex", gap: 8 };

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else route("/dashboard");
  };

  return (
    <>
      <header style={bar}>
        <div style={leftWrap}>
          <button style={btn} title="Atrás" onClick={goBack}><IcoBack /></button>
        </div>

        <div style={clock}>{now}</div>

        <div style={rightWrap}>
          {isAdmin && (
            <div style={{ position: "relative" }}>
              <button style={btn} title="Administración" onClick={() => setOpen((o)=>!o)}>
                <IcoShield />
              </button>
              {open && (
                <div
                  style={{
                    position: "absolute", right: 0, top: 44,
                    background: "#fff", border: "1px solid #e5e7eb",
                    borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.10)",
                    minWidth: 200, padding: 8, zIndex: 1001
                  }}
                >
                  <a href="/admin" style={{ display: "block", padding: "10px 12px", color: "#0f172a", textDecoration: "none", borderRadius: 8 }}>
                    Panel de administración
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      <div style={{ height: 52 }} />
    </>
  );
}
