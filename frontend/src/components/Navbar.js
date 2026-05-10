import { useState, useEffect } from "react";
import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";

const roleColor = { admin: "#f59e0b", boss: "#2d6a4f", sales: "#3b82f6" };
const roleLabel = { admin: "Admin", boss: "Boss", sales: "Sales" };

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={{
      height: "64px", background: "#1e3a5f",
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px", gap: "8px",
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
      flexShrink: 0
    }}>
      {/* Left: logo + brand/title */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
        <img src="/logo.png" alt="Hadicha Wear" style={{ height: "36px", objectFit: "contain", flexShrink: 0, borderRadius: "6px" }} />
        {isMobile ? (
          title && (
            <span style={{ color: "#93c5fd", fontWeight: 700, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </span>
          )
        ) : (
          <span style={{ color: "#fff", fontWeight: 800, fontSize: "15px", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
            Hadicha Wear
          </span>
        )}
      </div>

      {/* Center title (desktop only) */}
      {title && !isMobile && (
        <span style={{
          color: "#93c5fd", fontWeight: 600, fontSize: "14px",
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          whiteSpace: "nowrap", pointerEvents: "none"
        }}>{title}</span>
      )}

      {/* Right: user info + logout */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "6px" : "10px", flexShrink: 0 }}>
          {!isMobile && (
            <span style={{ color: "#cbd5e1", fontSize: "13px" }}>{user.username}</span>
          )}
          <span style={{
            padding: "3px 8px", borderRadius: "20px",
            fontSize: "11px", fontWeight: 700,
            background: roleColor[user.role] || "#64748b",
            color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px",
            whiteSpace: "nowrap"
          }}>
            {roleLabel[user.role] || user.role}
          </span>
          <button onClick={handleLogout} style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            padding: isMobile ? "10px 14px" : "6px 14px",
            borderRadius: "7px", cursor: "pointer",
            fontSize: "13px", fontWeight: 600,
            minHeight: "44px", whiteSpace: "nowrap"
          }}>
            {isMobile ? "✕" : "Chiqish"}
          </button>
        </div>
      )}
    </nav>
  );
}
