// src/components/NavBar.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient.js";

const IcoBell = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/>
    <path d="M10 21a2 2 0 0 0 4 0"/>
  </svg>
);
const IcoUser = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="7" r="4"/>
    <path d="M6 21v-2a6 6 0 0 1 12 0v2"/>
  </svg>
);
const IcoClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M15 9l-6 6M9 9l6 6"/>
  </svg>
);

export default function NavBar({ currentPath }) {
  const isPublic = ["/", "/login", "/register"].includes(currentPath);
  const [unread, setUnread] = useState(0);

  async function refreshCount() {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return setUnread(0);
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("is_read", false);
    setUnread(count || 0);
  }

  useEffect(() => {
    refreshCount();
    const onFocus = () => refreshCount();
    const onVisible = () => document.visibilityState === "visible" && refreshCount();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const wrap = {
    display: isPublic ? "none" : "flex",
    gap: "10px",
    position: "fixed",
    top: 7,
    right: 12,
    zIndex: 1100,
    background: "transparent",
    alignItems: "center",
  };

  const btn = {
    position: "relative",
    display: "grid",
    placeItems: "center",
    width: 38,
    height: 38,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#0ea5e9",
    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    cursor: "pointer",
  };

  const btnClose = {
    ...btn,
    color: "#ef4444",
  };

  const badge = {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    padding: "0 4px",
    borderRadius: 10,
    background: "#ef4444",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    display: unread > 0 ? "grid" : "none",
    placeItems: "center",
    lineHeight: 1,
    boxShadow: "0 1px 4px rgba(0,0,0,.2)",
  };

  return (
    <div style={wrap}>
      <button title="Mensaxes" style={btn} onClick={() => route("/mensaxes")}>
        <IcoBell />
        <span style={badge}>{unread}</span>
      </button>

      <button title="Perfil" style={btn} onClick={() => route("/perfil")}>
        <IcoUser />
      </button>

      <button
        titl

