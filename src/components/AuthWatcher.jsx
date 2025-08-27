// src/components/AuthWatcher.jsx
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";
import { route } from "preact-router";

export default function AuthWatcher() {
  useEffect(() => {
    let active = true;

    const deduceFirstName = (meta) => {
      const fn = meta?.first_name;
      if (fn && String(fn).trim()) return String(fn).trim();
      const full = meta?.full_name || "";
      if (full && String(full).trim()) {
        const first = String(full).trim().split(/\s+/)[0];
        if (first) return first;
      }
      const email = meta?.email || meta?.user_email || "";
      if (email && typeof email === "string") return email.split("@")[0];
      return "Amigx";
    };

    const ensureProfile = async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return;

      const meta = {
        email: user.email || user.user_metadata?.email || "",
        phone: user.user_metadata?.phone || "",
        first_name: deduceFirstName({ ...user.user_metadata, email: user.email }),
        last_name: user.user_metadata?.last_name || user.user_metadata?.apelidos || "",
      };

      // Intenta ler perfil existente para non pisar datos
      const { data: existing } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone, email, role")
        .eq("id", user.id)
        .maybeSingle();

      const payload = {
        id: user.id,
        email: meta.email || existing?.email || user.email || "",
        phone: meta.phone || existing?.phone || "",
        first_name: existing?.first_name && String(existing.first_name).trim()
          ? existing.first_name
          : meta.first_name,
        last_name: existing?.last_name ?? meta.last_name ?? "",
        role: existing?.role || "user",
        updated_at: new Date().toISOString(),
      };

      if (!existing) payload.created_at = new Date().toISOString();

      await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    };

    // Estado inicial
    supabase.auth.getSession().then(({ data }) => {
      const sess = data?.session;
      if (sess) ensureProfile();
      if (location.pathname === "/login" && sess) route("/dashboard");
    });

    // Listener de cambios
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await ensureProfile();
        if (location.pathname === "/login") route("/dashboard");
      }
      if (event === "SIGNED_OUT") {
        // Sempre á landing de login
        route("/login");
      }
    });

    return () => { active = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  return null;
}

