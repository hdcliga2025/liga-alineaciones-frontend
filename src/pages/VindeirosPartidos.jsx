import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { supabase } from "../lib/supabaseClient";

// ====== Estilos ======
const WRAP = { maxWidth: 1080, margin: "0 auto", padding: "16px 12px 28px" };
const HEADER = { marginBottom: 10 };
const H1 = { font: "700 22px/1.2 Montserrat,system-ui,sans-serif", color: "#0f172a", margin: 0 };
const SUB = { font: "500 14.5px/1.35 Montserrat,system-ui,sans-serif", color: "#475569", margin: "6px 0 12px" };

const BAR_ERR = {
  background: "rgba(239,68,68,.09)",
  border: "1px solid rgba(239,68,68,.25)",
  color: "#b91c1c",
  borderRadius: 12,
  padding: "10px 12px",
  margin: "8px 0 14px",
};

const CTA = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  height: 36,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid rgba(16,185,129,.35)",
  background: "linear-gradient(180deg, rgba(16,185,129,.14), rgba(16,185,129,.06))",
  color: "#059669",
  font: "600 14px/1 Montserrat,system-ui,sans-serif",
  cursor: "pointer",
  userSelect: "none",
};

const LIST = { display: "grid", gap: 12, marginTop: 12 };

const CARD = (saved) => ({
  background: saved ? "linear-gradient(180deg, rgba(14,165,233,.05), rgba(14,165,233,.03))" : "#fff",
  border: `2px solid ${saved ? "#0ea5e9" : "#e5e7eb"}`,
  borderRadius: 18,
  boxShadow: "0 6px 18px rgba(0,0,0,.06)",
  padding: "10px 12px 12px",
});

const ROW_TOP = { display: "grid", gridTemplateColumns: "56px 1fr", gap: 10, alignItems: "center", paddingBottom: 6 };

const NBOX = (saved=false) => ({
  display: "grid",
  placeItems: "center",
  height: 34,
  borderRadius: 10,
  border: `2px solid ${saved ? "#0ea5e9" : "#cbd5e1"}`,
  color: saved ? "#0ea5e9" : "#64748b",
  font: "700 14px/1 Montserrat,system-ui,sans-serif",
  background: "#fff",
});

const TOP_INPUT_WRAP = {
  display: "grid",
  gridTemplateColumns: "1fr 42px 1fr",
  alignItems: "center",
  gap: 8,
  minHeight: 40,
  border: "1px dashed rgba(148,163,184,.45)",
  borderRadius: 12,
  padding: "6px 10px",
  background: "#f8fafc",
};

const VS = { font: "700 13px/1 Montserrat,system-ui,sans-serif", color: "#64748b", textAlign: "center" };

const TXT = (editable=true) => ({
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "8px 10px",
  font: "700 13px/1.1 Montserrat,system-ui,sans-serif",
  textTransform: "uppercase",
  color: "#0f172a",
  background: editable ? "#fff" : "#f1f5f9",
  outline: "none",
});

const ROW_BOTTOM = {
  display: "grid",
  gridTemplateColumns: "minmax(160px, 220px) minmax(180px, 260px) 48px", // fecha, comp, flecha
  gap: 10,
  alignItems: "center",
};

const INPUT_DATE = (editable=true) => ({
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "8px 12px",
  font: "700 13px/1.1 Montserrat,system-ui,sans-serif",
  color: "#0f172a",
  background: editable ? "#fff" : "#f1f5f9",
  outline: "none",
  textTransform: "uppercase",
});

const SELECT_WRAP = { position: "relative" };
const TROPHY = {
  position: "absolute",
  left: 10,
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none", // MUY IMPORTANTE: no bloquear el click
};
const SEL_BOX = (editable=true) => ({
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "8px 34px 8px 38px",
  font: "700 13px/1.1 Montserrat,system-ui,sans-serif",
  color: "#0f172a",
  background: editable ? "#fff" : "#f1f5f9",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, #64748b 50%), linear-gradient(135deg, #64748b 50%, transparent 50%)",
  backgroundPosition: "calc(100% - 14px) 13px, calc(100% - 8px) 13px",
  backgroundSize: "6px 6px, 6px 6px",
  backgroundRepeat: "no-repeat",
});

const BTN_PROMOTE = {
  display: "grid",
  placeItems: "center",
  width: 44,
  height: 40,
  border: "1px solid rgba(16,185,129,.45)",
  borderRadius: 12,
  background: "linear-gradient(180deg, rgba(16,185,129,.12), rgba(16,185,129,.06))",
  boxShadow: "0 3px 10px rgba(0,0,0,.06)",
  cursor: "pointer",
};

// ====== Utils ======
const compList = ["LaLiga", "Europa League", "Copa do Rei"];

// ====== Pagina ======
export default function VindeirosPartidos() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [local, setLocal] = useState([]); // edición (id, home, away, match_date(ISO), competition, _saved)
  const [err, setErr] = useState("");

  // admin?
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const email = s?.session?.user?.email || "";
      const uid = s?.session?.user?.id || null;
      let admin = false;
      if (email) {
        const e = email.toLowerCase();
        if (e === "hdcliga@gmail.com" || e === "hdcliga2@gmail.com") admin = true;
      }
      if (!admin && uid) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
        if ((prof?.role || "").toLowerCase() === "admin") admin = true;
      }
      setIsAdmin(admin);
    })();
  }, []);

  const load = async () => {
    setErr("");
    const { data, error } = await supabase
      .from("matches_vindeiros")
      .select("id, match_date, home, away, competition")
      .order("match_date", { ascending: true, nullsFirst: false });
    if (error) {
      setErr(error.message || "Erro cargando datos.");
      setLocal([]);
      return;
    }
    setLocal((data || []).map((r) => ({ ...r, _saved: true })));
  };

  useEffect(() => {
    load();
    const onVis = () => { if (!document.hidden) load(); };
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", load);
    };
  }, []);

  // Orden por data (vacías al final)
  const view = useMemo(() => {
    const arr = [...local];
    arr.sort((a, b) => {
      const ai = a?.match_date ? new Date(a.match_date).getTime() : Infinity;
      const bi = b?.match_date ? new Date(b.match_date).getTime() : Infinity;
      if (ai !== bi) return ai - bi;
      return (a?.id || 0) - (b?.id || 0);
    });
    return arr;
  }, [local]);

  const setField = (rowRef, patch) => {
    setLocal((prev) => {
      const copy = prev.slice();
      const idx = copy.indexOf(rowRef);
      if (idx === -1) return prev;
      copy[idx] = { ...copy[idx], ...patch, _saved: false };
      return copy;
    });
  };

  const canAutoSave = (r) =>
    !!(String(r?.home || "").trim() &&
       String(r?.away || "").trim() &&
       String(r?.match_date || "").trim() &&
       String(r?.competition || "").trim());

  // Toast
  const toastTimer = useRef(null);
  const toast = (msg) => {
    clearTimeout(toastTimer.current);
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style, {
      position: "fixed", left: "50%", top: "16px", transform: "translateX(-50%)",
      background: "#0ea5e9", color: "#fff",
      font: "700 12.5px/1 Montserrat,system-ui,sans-serif",
      padding: "8px 12px", borderRadius: "999px", boxShadow: "0 8px 22px rgba(0,0,0,.18)", zIndex: 1000,
    });
    document.body.appendChild(el);
    toastTimer.current = setTimeout(() => el.remove(), 1600);
  };

  const doSave = async (rowRef) => {
    if (!isAdmin) return;
    const r = rowRef;
    if (!canAutoSave(r)) {
      setErr("Cumprimenta os 4 campos para gardar automaticamente.");
      setTimeout(() => setErr(""), 1800);
      return;
    }
    try {
      const payload = {
        home: String(r.home || "").toUpperCase(),
        away: String(r.away || "").toUpperCase(),
        match_date: r.match_date || null, // yyyy-mm-dd
        competition: r.competition || null,
        partido: `${String(r.home || "").toUpperCase()} vs ${String(r.away || "").toUpperCase()}`,
      };
      if (r.id) {
        const { error } = await supabase.from("matches_vindeiros").update(payload).eq("id", r.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("matches_vindeiros")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        const newId = data?.id;
        setLocal((prev) =>
          prev.map((x) => (x === rowRef ? { ...x, id: newId } : x))
        );
      }
      setLocal((prev) => prev.map((x) => (x === rowRef ? { ...x, _saved: true } : x)));
      toast("REGISTRADO");
    } catch (e) {
      setErr(e?.message || "Erro gardando os datos.");
    }
  };

  const addBlank = () => {
    if (!isAdmin) return;
    setLocal((prev) => [...prev, { id: null, home: "", away: "", match_date: "", competition: "", _saved: false }]);
  };

  // Promover a Próximo Partido + borrar de vindeiros
  const promote = async (rowRef) => {
    if (!isAdmin) return;
    const r = rowRef;
    if (!canAutoSave(r)) {
      setErr("Completa os 4 campos antes de subir a Próximo Partido.");
      setTimeout(() => setErr(""), 1800);
      return;
    }
    try {
      const { error: e1 } = await supabase
        .from("next_match")
        .update({
          equipo1: String(r.home || "").toUpperCase(),
          equipo2: String(r.away || "").toUpperCase(),
          competition: r.competition || null,
          match_iso: r.match_date ? new Date(r.match_date + "T00:00:00Z").toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (e1) throw e1;

      if (r.id) {
        const { error: e2 } = await supabase.from("matches_vindeiros").delete().eq("id", r.id);
        if (e2) throw e2;
      }
      toast("REGISTRADO");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao subir o partido.");
    }
  };

  // ====== Render ======
  return (
    <main style={WRAP}>
      <header style={HEADER}>
        <h2 style={H1}>Vindeiros partidos</h2>
        <p style={SUB}>Axenda dos próximos encontros con data e hora confirmada.</p>

        {isAdmin && (
          <button type="button" onClick={addBlank} style={CTA}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Engadir outro partido
          </button>
        )}
      </header>

      {err ? <div style={BAR_ERR}>{err}</div> : null}

      <section style={LIST}>
        {view.map((r, idx) => (
          <article key={r?.id ?? `tmp-${idx}`} style={CARD(!!r._saved)}>
            {/* Fila 1: Nº + EQUIPO1 vs EQUIPO2 */}
            <div style={ROW_TOP}>
              <div style={NBOX(!!r._saved)}>{String(idx + 1).padStart(2, "0")}</div>

              <div style={TOP_INPUT_WRAP}>
                <input
                  style={TXT(isAdmin)}
                  disabled={!isAdmin}
                  value={(r.home || "").toUpperCase()}
                  onInput={(e) => isAdmin && setField(r, { home: e.currentTarget.value.toUpperCase() })}
                  onBlur={() => isAdmin && canAutoSave(r) && doSave(r)}
                  placeholder="EQUIPO 1"
                />
                <span style={VS}>vs</span>
                <input
                  style={TXT(isAdmin)}
                  disabled={!isAdmin}
                  value={(r.away || "").toUpperCase()}
                  onInput={(e) => isAdmin && setField(r, { away: e.currentTarget.value.toUpperCase() })}
                  onBlur={() => isAdmin && canAutoSave(r) && doSave(r)}
                  placeholder="EQUIPO 2"
                />
              </div>
            </div>

            {/* Fila 2: DATA + COMPETICIÓN + FLECHA */}
            <div style={ROW_BOTTOM}>
              {/* DATA con picker nativo */}
              <input
                type="date"
                style={INPUT_DATE(isAdmin)}
                disabled={!isAdmin}
                value={r.match_date || ""}
                onChange={(e) => {
                  if (!isAdmin) return;
                  const iso = e.currentTarget.value; // yyyy-mm-dd
                  setField(r, { match_date: iso });
                  if (canAutoSave({ ...r, match_date: iso })) doSave({ ...r, match_date: iso });
                }}
              />

              {/* COMPETICIÓN con select */}
              <div style={SELECT_WRAP}>
                <div style={TROPHY} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
                    <path d="M9 14h6v3H9z" />
                  </svg>
                </div>
                <select
                  style={SEL_BOX(isAdmin)}
                  disabled={!isAdmin}
                  value={r.competition || ""}
                  onChange={(e) => {
                    if (!isAdmin) return;
                    const v = e.currentTarget.value;
                    setField(r, { competition: v });
                    if (canAutoSave({ ...r, competition: v })) doSave({ ...r, competition: v });
                  }}
                >
                  <option value="" disabled>— COMPETICIÓN —</option>
                  {compList.map((c) => (
                    <option value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* FLECHA (promover) en la MISMA FILA */}
              <button
                type="button"
                title="Subir a Próximo Partido"
                style={BTN_PROMOTE}
                disabled={!isAdmin}
                onClick={() => promote(r)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 19V6" />
                  <path d="M7 10l5-5 5 5" />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
