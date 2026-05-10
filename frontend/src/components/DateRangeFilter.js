import { useState, useEffect } from "react";

const PRESETS = [
  { id: "today", label: "Bugun" },
  { id: "week", label: "Bu hafta" },
  { id: "month", label: "Bu oy" },
  { id: "year", label: "Bu yil" },
  { id: "all", label: "Hammasi" },
];

function useIsMobile() {
  const [v, setV] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setV(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return v;
}

function getPresetDates(id) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  if (id === "today") return { start: today, end: today };
  if (id === "week") {
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    return { start: mon.toISOString().split("T")[0], end: today };
  }
  if (id === "month") {
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return { start: `${now.getFullYear()}-${m}-01`, end: today };
  }
  if (id === "year") {
    return { start: `${now.getFullYear()}-01-01`, end: today };
  }
  return { start: "", end: "" };
}

function getActivePreset(filter) {
  for (const p of PRESETS) {
    const d = getPresetDates(p.id);
    if (d.start === (filter.start || "") && d.end === (filter.end || "")) return p.id;
  }
  return null;
}

const dateInpStyle = {
  padding: "8px 12px", borderRadius: "8px",
  border: "1.5px solid #cbd5e1", fontSize: "16px",
  outline: "none", color: "#1e293b", background: "#fff",
  cursor: "pointer",
};

export default function DateRangeFilter({ filter, onChange }) {
  const isMobile = useIsMobile();
  const active = getActivePreset(filter);
  return (
    <div style={{ marginBottom: "14px" }}>
      {/* Preset tugmalari — mobile da gorizontal scroll */}
      <div className="filter-btns" style={{
        display: "flex", gap: "6px", marginBottom: "10px",
        overflowX: "auto", paddingBottom: "2px",
        WebkitOverflowScrolling: "touch",
      }}>
        {PRESETS.map(p => {
          const on = active === p.id;
          return (
            <button key={p.id} onClick={() => onChange(getPresetDates(p.id))} style={{
              padding: "8px 16px", borderRadius: "20px", flexShrink: 0,
              border: `1.5px solid ${on ? "#1e3a5f" : "#cbd5e1"}`,
              background: on ? "#1e3a5f" : "#fff",
              color: on ? "#fff" : "#64748b",
              fontSize: "13px", fontWeight: on ? 700 : 400,
              cursor: "pointer", whiteSpace: "nowrap", minHeight: "40px",
            }}>{p.label}</button>
          );
        })}
      </div>
      {/* Sana diapazoni */}
      <div style={{
        display: "flex", gap: "8px",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
          <label style={{ fontSize: "13px", color: "#64748b", whiteSpace: "nowrap", minWidth: "40px" }}>Dan:</label>
          <input type="date" value={filter.start || ""}
            onChange={e => onChange({ ...filter, start: e.target.value })}
            style={{ ...dateInpStyle, flex: 1, minWidth: 0 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
          <label style={{ fontSize: "13px", color: "#64748b", whiteSpace: "nowrap", minWidth: "40px" }}>Gacha:</label>
          <input type="date" value={filter.end || ""}
            onChange={e => onChange({ ...filter, end: e.target.value })}
            style={{ ...dateInpStyle, flex: 1, minWidth: 0 }} />
        </div>
      </div>
    </div>
  );
}
