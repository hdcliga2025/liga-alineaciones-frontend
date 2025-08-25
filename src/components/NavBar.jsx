// src/components/NavBar.jsx
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

export default function NavBar({ currentPath = "" }) {
  const isPublic = ["/", "/login", "/register"].includes(currentPath);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) return;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("is_read", false);
      if (active) setUnread(count || 0);
    })();
    return () => { active = false; };
  }, [currentPath]);

  if (isPublic) return null;

  const wrap = {
    position: "sticky", top: 0, zIndex: 40,
    background: "rgba(255,255,255,.75)", backdropFilter: "blur(8px)",
    borderBottom: "1px solid #eef2ff",
  };
  const bar = {
    maxWidth: 1080, margin: "0 auto", padding: "10px 12px",
    display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
  };
  const round = {
    width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,.12)", cursor: "pointer", border: "1px solid #e5e7eb",
    position: "relative"
  };
  const whiteBtn = { ...round, background: "#fff", color: "#0f172a" };
  const exitBtn = { ...round, background: "#fff", border: "1px solid #fecaca" };
  const ico = { fontSize: 18, fontWeight: 800, lineHeight: 1 };
  const redX = { ...ico, color: "#ef4444", fontSize: 20, fontWeight: 900 };

  const doLogout = async () => {
    await supabase.auth.signOut();
    route("/login");
  };

  return (
    <div style={wrap}>
      <div style={bar}>
        {/* Notificacións */}
        <button
          style={whiteBtn}
          title="Notificacións"
          aria-label="Notificacións"
          onClick={() => route("/notificacions")}
        >
          <span style={ico}>🔔</span>
          {unread > 0 && (
            <span
              style={{
                position: "absolute", top: 6, right: 6, width: 10, height: 10,
                background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 0 2px #fff"
              }}
              aria-hidden="true"
            />
          )}
        </button>

        {/* Perfil */}
        <button
          style={whiteBtn}
          title="Perfil (editar datos / solicitar borrado)"
          aria-label="Perfil"
          onClick={() => route("/perfil")}
        >
          <span style={ico}>👤</span>
        </button>

        {/* Saír */}
        <button
          style={exitBtn}
          title="Pechar sesión"
          aria-label="Pechar sesión"
          onClick={doLogout}
        >
          <span style={redX}>✖</span>
        </button>
      </div>
    </div>
  );
}
