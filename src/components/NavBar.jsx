import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

export default function NavBar({ currentPath = "" }) {
  const isPublic = ["/", "/login", "/register"].includes(currentPath || "/");
  if (isPublic) return null;

  const [targetMs, setTargetMs] = useState(() => {
    try {
      const v = localStorage.getItem("hdc_target_ms");
      return v ? Number(v) : null;
    } catch { return null; }
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;

    async function fetchTarget() {
      try {
        const { data, error } = await supabase
          .from("next_match")
          .select("match_iso")
          .eq("id", 1)
          .maybeSingle();
        if (!alive) return;
        if (error) return;
        if (data?.match_iso) {
          const ms = new Date(data.match_iso).getTime() - 2 * 3600 * 1000;
          setTargetMs(ms);
          try { localStorage.setItem("hdc_target_ms", String(ms)); } catch {}
        }
      } catch { /* mantener último valor */ }
    }

    fetchTarget();
    const poll = setInterval(fetchTarget, 10000);
    const onVis = () => { if (!document.hidden) fetchTarget(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function tryArchive() {
      try {
        const { data, error } = await supabase.rpc("archive_next_match_if_due");
        if (!error && data) {
          const { data: nm } = await supabase
            .from("next_match")
            .select("match_iso")
            .eq("id", 1)
            .maybeSingle();
          if (!alive) return;
          if (nm?.match_iso) {
            const ms = new Date(nm.match_iso).getTime() - 2 * 3600 * 1000;
            setTargetMs(ms);
            try { localStorage.setItem("hdc_target_ms", String(ms)); } catch {}
          }
        }
      } catch {}
    }
    tryArchive();
    const poll = setInterval(tryArchive, 15000);
    return () => { alive = false; clearInterval(poll); };
  }, []);

  const remainStr = useMemo(() => {
    if (!targetMs) return "00D-00H-




