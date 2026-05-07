const PRESETS = [
  { id: "today", label: "Bugun" },
  { id: "week", label: "Bu hafta" },
  { id: "month", label: "Bu oy" },
  { id: "year", label: "Bu yil" },
  { id: "all", label: "Hammasi" },
];

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
  border: "1.5px solid #cbd5e1", fontSize: "14px",
  outline: "none", color: "#1e293b", background: "#fff",
  cursor: "pointer",
};

export default function DateRangeFilter({ filter, onChange }) {
  const active = getActivePreset(filter);
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{
        display: "flex", gap: "6px", marginBottom: "10px",
        overflowX: "auto", paddingBottom: "2px",
        WebkitOverflowScrolling: "touch",
      }}>
        {PRESETS.map(p => {
          const on = active === p.id;
          return (
            <button key={p.id} onClick={() => onChange(getPresetDates(p.id))} style={{
              padding: "6px 16px", borderRadius: "20px", flexShrink: 0,
              border: `1.5px solid ${on ? "#1e3a5f" : "#cbd5e1"}`,
              background: on ? "#1e3a5f" : "#fff",
              color: on ? "#fff" : "#64748b",
              fontSize: "13px", fontWeight: on ? 700 : 400,
              cursor: "pointer", whiteSpace: "nowrap", minHeight: "34px",
            }}>{p.label}</button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label style={{ fontSize: "13px", color: "#64748b", whiteSpace: "nowrap" }}>Dan:</label>
          <input type="date" value={filter.start || ""}
            onChange={e => onChange({ ...filter, start: e.target.value })}
            style={dateInpStyle} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label style={{ fontSize: "13px", color: "#64748b", whiteSpace: "nowrap" }}>Gacha:</label>
          <input type="date" value={filter.end || ""}
            onChange={e => onChange({ ...filter, end: e.target.value })}
            style={dateInpStyle} />
        </div>
      </div>
    </div>
  );
}
