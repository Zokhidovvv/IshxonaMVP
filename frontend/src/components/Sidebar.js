import { useState, useEffect } from "react";

function getScreenSize() {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export default function Sidebar({ tabs, activeTab, onTabChange }) {
  const [screen, setScreen] = useState(getScreenSize());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onResize = () => setScreen(getScreenSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (screen === "mobile") {
    return (
      <>
        <div style={{ height: "60px" }} />
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff", borderTop: "1px solid #e2e8f0",
          display: "flex", zIndex: 50,
          overflowX: "auto", WebkitOverflowScrolling: "touch"
        }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{
                flex: "0 0 auto", minWidth: "64px",
                padding: "8px 6px 6px",
                display: "flex", flexDirection: "column", alignItems: "center",
                background: active ? "#eff6ff" : "transparent",
                border: "none", cursor: "pointer",
                color: active ? "#2563eb" : "#64748b",
                fontSize: "10px", fontWeight: active ? 700 : 500,
                borderTop: `3px solid ${active ? "#2563eb" : "transparent"}`,
                gap: "2px"
              }}>
                <span style={{ fontSize: "18px", lineHeight: 1 }}>{tab.icon}</span>
                <span style={{ whiteSpace: "nowrap", fontSize: "10px" }}>
                  {tab.shortLabel || tab.label.split(" ").slice(-1)[0]}
                </span>
              </button>
            );
          })}
        </nav>
      </>
    );
  }

  const isTablet = screen === "tablet";
  const isCollapsed = collapsed || isTablet;
  const width = isCollapsed ? "64px" : "240px";

  return (
    <aside style={{
      width, minWidth: width,
      background: "#fff",
      borderRight: "1px solid #e2e8f0",
      display: "flex", flexDirection: "column",
      transition: "width 0.25s ease",
      overflow: "hidden",
      flexShrink: 0
    }}>
      {!isTablet && (
        <button onClick={() => setCollapsed(!collapsed)} style={{
          padding: "16px",
          background: "none", border: "none", cursor: "pointer",
          display: "flex", justifyContent: isCollapsed ? "center" : "flex-end",
          color: "#94a3b8", fontSize: "16px",
          borderBottom: "1px solid #f1f5f9"
        }}>
          {isCollapsed ? "▶" : "◀"}
        </button>
      )}
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => onTabChange(tab.id)} title={tab.label} style={{
            padding: isCollapsed ? "14px" : "13px 18px",
            display: "flex", alignItems: "center",
            gap: "12px",
            background: active ? "#eff6ff" : "transparent",
            border: "none", cursor: "pointer",
            color: active ? "#2563eb" : "#64748b",
            fontWeight: active ? 600 : 400,
            textAlign: "left",
            borderLeft: `3px solid ${active ? "#2563eb" : "transparent"}`,
            fontSize: "14px",
            whiteSpace: "nowrap",
            width: "100%",
            justifyContent: isCollapsed ? "center" : "flex-start",
            transition: "background 0.15s"
          }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f8fafc"; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ fontSize: "20px", minWidth: "22px", textAlign: "center", lineHeight: 1 }}>
              {tab.icon}
            </span>
            {!isCollapsed && <span>{tab.label}</span>}
          </button>
        );
      })}
    </aside>
  );
}
