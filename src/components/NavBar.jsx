// src/components/NavBar.jsx
import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient.js";

export default function NavBar({ currentPath = "" }) {
  const isPublic = ["/", "/login", "/register"].includes(currentPath || "/");
  if (isPublic) return null;

  const [targetMs, setTargetMs] = useState(null); // peche = match_iso - 2h
  const [now, setNow] = useState(() => Date.now());
  const archKeyRef = useRef("");
  const ticking = useRef(false);

  const headerRef = useRef(null);
  const [spacerH, setSpacerH] = useState(64);

  useEffect(() => {
    const hasRO = typeof ResizeObserver !== "undefined";
    let ro;
    const measure = () => {
      const h = headerRef.current?.getBoundingClientRect?.().height || 64;
      setSpacerH(Math.max(56, Math.round(h)));
    };
    if (hasRO) {
      ro = new ResizeObserver(measure);
      if (headerRef.current) ro.observe(headerRef.current);
    }
    const onR = () => measure();
    window.addEventListener("resize", onR);
    measure();
    return () => {
      if (ro) try { ro.disconnect(); } catch {}
      window.removeEventListener("resize", onR);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function fetchTarget() {
    try {
      const { data } = await supabase
        .from("next_match")
        .select("equipo1,equipo2,lugar,competition,match_iso,weather_json")
        .eq("id", 1)
        .maybeSingle();

      if (data?.match_iso) {
        const startTs = new Date(data.match_iso).getTime();
        const closeAt = startTs - 2 * 3600 * 1000;
        setTargetMs(closeAt);
        archKeyRef.current = `archived:${data.match_iso}`;
      } else {
        setTargetMs(null);
        archKeyRef.current = "";
      }
    } catch (e) {
      // nunca tumbes a SPA por fallo de BBDD
      console.error("[NavBar] fetchTarget", e);
      setTargetMs(null);
      archKeyRef.current = "";
    }
  }

  useEffect(() => {
    let alive = true;
    const doFetch = () => alive && fetchTarget();
    doFetch();
    const poll = setInterval(doFetch, 30000);
    const onVis = () => { if (!document.hidden) doFetch(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; clearInterval(poll); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  useEffect(() => {
    let alive = true;

    const tryArchive = async () => {
      try {
        if (!archKeyRef.current) return;
        if (localStorage.getItem(archKeyRef.current) === "1") return;

        const { data: nm } = await supabase
          .from("next_match")
          .select("equipo1,equipo2,lugar,competition,match_iso")
          .eq("id", 1)
          .maybeSingle();

        if (!nm?.match_iso) return;

        const startTs = new Date(nm.match_iso).getTime();
        const archiveAt = startTs + 3 * 3600 * 1000;
        if (Date.now() < archiveAt) return;

        const { data: exists } = await supabase
          .from("matches_finalizados")
          .select("id")
          .eq("match_iso", nm.match_iso)
          .limit(1);

        if (!exists || exists.length === 0) {
          await supabase.from("matches_finalizados").insert({
            equipo1: (nm.equipo1 || "").toUpperCase(),
            equipo2: (nm.equipo2 || "").toUpperCase(),
            lugar: nm.lugar || null,
            competition: nm.competition || null,
            match_iso: nm.match_iso,
            updated_at: new Date().toISOString(),
          });
        }

        await supabase.from("matches_vindeiros").delete().eq("match_iso", nm.match_iso);

        await supabase
          .from("next_match")
          .update({
            equipo1: null, equipo2: null, lugar: null, competition: null,
            match_iso: null, weather_json: null, updated_at: new Date().toISOString(),
          })
          .eq("id", 1);

        localStorage.setItem(archKeyRef.current, "1");
        setTargetMs(null);
      } catch (e) {
        console.error("[NavBar] tryArchive", e);
      }
    };

    const loop = async () => {
      if (!alive || ticking.current) return;
      ticking.current = true;
      try { await tryArchive(); } finally { ticking.current = false; }
    };

    loop();
    const id = setInterval(loop, 15000);
    return () => { alive = false; clearInterval(id); };
  }, [targetMs]);

  const remainStr = useMemo(() => {
    if (!targetMs) return "00D-00H-00M-00S";
    let diff = targetMs - now;
    if (diff <= 0) return "00D-00H-00M-00S";
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(days)}D-${pad(h)}H-${pad(m)}M-${pad(s)}S`;
  }, [targetMs, now]);

  const colorNow = "#0ea5e9";
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 480 : false
  );
  useEffect(() => {
    const onR = () => { setIsNarrow(window.innerWidth <= 480); };
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const fw = 400;
  const fz = isNarrow ? 17 : 20;
  const sx = isNarrow ? 0.89 : 1.30;

  const styles = {
    header: {
      position:"fixed", top:0,left:0,right:0, zIndex:100,
      background:"rgba(255,255,255,0.9)",
      backdropFilter:"saturate(180%) blur(8px)",
      borderBottom:"1px solid #e5e7eb"
    },
    container: { maxWidth:1080, margin:"0 auto", padding:"8px 12px",
      display:"grid", gridTemplateColumns:"auto 1fr auto",
      alignItems:"center", gap:isNarrow?6:8
    },
    leftGroup: { display:"flex", alignItems:"center", gap:isNarrow?8:10, whiteSpace:"nowrap" },
    centerClock: { justifySelf:"center", textAlign:"center", userSelect:"none",
      fontFamily:"Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", lineHeight:1.0 },
    time: { margin:0, color:colorNow, fontWeight:fw, fontSize:fz,
      transform:`scaleX(${sx})`, transformOrigin:"center",
      letterSpacing:isNarrow?"0.35px":"0.6px", whiteSpace:"nowrap" },
    rightGroup: { justifySelf:"end", display:"flex", alignItems:"center", gap:isNarrow?8:10, whiteSpace:"nowrap" },
    iconBtn: { width:isNarrow?36:38, height:isNarrow?36:38, display:"grid", placeItems:"center",
      borderRadius:12, background:"#fff", border:"1px solid #eef2ff",
      boxShadow:"0 4px 14px rgba(0,0,0,.06)", textDecoration:"none", outline:"none", cursor:"pointer" },
    spacer: { height: spacerH }
  };

  const common = { fill:"none", stroke:"#0ea5e9", strokeWidth:1.8, strokeLinecap:"round", strokeLinejoin:"round" };

  const onBack = (e) => {
    e.preventDefault();
    try { if (history.length > 1) history.back(); else location.href="/dashboard"; }
    catch { location.href="/dashboard"; }
  };

  return (
    <>
      <header ref={headerRef} style={styles.header}>
        <div style={styles.container}>
          <div style={styles.leftGroup}>
            <a href="/dashboard" title="Atrás" style={styles.iconBtn} onClick={onBack} aria-label="Volver">
              <svg width="22" height="22" viewBox="0 0 24 24" {...common}><path d="M4 12h16"/><path d="M10 6l-6 6 6 6"/></svg>
            </a>
            <a href="/notificacions" title="Notificacións" style={styles.iconBtn} aria-label="Notificacións">
              <svg width="22" height="22" viewBox="0 0 24 24" {...common}><path d="M12 3a5 5 0 00-5 5v2.5c0 .7-.27 1.37-.75 1.87L5 14h14l-1.25-1.63A2.5 2.5 0 0117 10.5V8a5 5 0 00-5-5z"/><path d="M9.5 18a2.5 2.5 0 005 0"/></svg>
            </a>
          </div>

          <div style={styles.centerClock} aria-label="Peche das aliñacións">
            <p style={styles.time}>{remainStr}</p>
          </div>

          <div style={styles.rightGroup}>
            <a href="/perfil" title="Perfil" style={styles.iconBtn} aria-label="Perfil">
              <svg width="22" height="22" viewBox="0 0 24 24" {...common}><circle cx="12" cy="8" r="3.2"/><path d="M4.5 19.5a7.5 7.5 0 0115 0"/></svg>
            </a>
            <a href="/logout?to=/" title="Pechar sesión" style={styles.iconBtn} aria-label="Pechar sesión">
              <svg width="22" height="22" viewBox="0 0 24 24" {...common}><path d="M6 6l12 12M18 6L6 18"/></svg>
            </a>
          </div>
        </div>
      </header>
      <div style={styles.spacer} />
    </>
  );
}


