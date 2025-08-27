// src/components/Header.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

const IcoBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/>
    <path d="M10 21a2 2 0 0 0 4 0"/>
  </svg>
);
const IcoUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4"/>
    <path d="M6 21v-2a6 6 0 0 1 12 0v2"/>
  </svg>
);
const IcoClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M15 9l-6 6M9 9l6 6"/>
  </svg>
);

export default function Header({ currentPath }) {
  const isPublic = ["/", "/login", "/register"].includes(currentPath);
  const [clock, setClock] = useState("");
  const [unread, setUnread] = useState(0);

  // Reloj (Madrid)
  useEffect(() => {
    if (isPublic) return;
    const t = setInterval(() => {
      setClock(
        new Date().toLocaleString("gl-ES", {
          timeZone: "Europe/Madrid",
          weekday: "long", day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(t);
  }, [isPublic]);

  // Contador de notificacións
  useEffect(() => {
    if (isPublic) return;
    const refresh = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return setUnread(0);
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("is_read", false);
      setUnread(count || 0);
    };
    refresh();
    const onFocus = () => refresh();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isPublic]);

  if (isPublic) return null;

  const bar = {
    position: "fixed", top: 0, left: 0, right: 0, height: 48,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 10px",
    background: "rgba(255,255,255,.9)",
    backdropFilter: "saturate(180%) blur(8px)",
    borderBottom: "1px solid #eef2ff",
    zIndex: 1200,
  };
  const left = { color: "#0ea5e9", fontWeight: 700, fontSize: 13 };
  const right = { display: "flex", gap: 10 };

  const btn = {
    position: "relative",
    width: 36, height: 36, borderRadius: 12,
    border: "1px solid #e5e7eb", background: "#fff",
    color: "#0ea5e9", boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    display: "grid", placeItems: "center", cursor: "pointer",
  };
  const btnClose = { ...btn, color: "#ef4444" };

  const hardToLogin = () => {
    try { route("/login"); } catch {}
    try { window.location.replace("/login"); } catch {}
    setTimeout(() => { window.location.href = "/login"; }, 30);
  };

  const onSignOut = async () => {
    try { await supabase.auth.signOut(); } catch {}
    try { localStorage.clear(); sessionStorage.clear(); } catch {}
    hardToLogin();
  };

  return (
    <div style={bar}>
      <div style={left}>{clock}</div>
      <div style={right}>
        <button title="Notificacións" style={btn} onClick={() => route("/notificacions")}>
          <IcoBell />
          {unread > 0 && (
            <span style={{
              position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, padding: "0 4px",
              borderRadius: 10, background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700,
              display: "grid", placeItems: "center", lineHeight: 1, boxShadow: "0 1px 4px rgba(0,0,0,.2)",
            }}>{unread}</span>
          )}
        </button>
        <button title="Perfil" style={btn} onClick={() => route("/perfil")}><IcoUser /></button>
        <button title="Pechar" style={btnClose} onClick={onSignOut}><IcoClose /></button>
      </div>
    </div>
  );
}

