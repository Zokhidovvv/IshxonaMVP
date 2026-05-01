import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";

const roleColor = { admin: "#f59e0b", boss: "#10b981", sales: "#3b82f6" };
const roleLabel = { admin: "Admin", boss: "Boss", sales: "Sales" };

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={{
      height: "64px", background: "#1e3a5f",
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      position: "sticky", top: 0, zIndex: 100,
      boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
      flexShrink: 0
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "22px" }}>🏭</span>
        <span style={{
          color: "#fff", fontWeight: 800,
          fontSize: "15px", letterSpacing: "1.5px",
          display: window.innerWidth < 480 ? "none" : "block"
        }}>
          ZAVOD TIZIMI
        </span>
      </div>

      {title && (
        <span style={{
          color: "#93c5fd", fontWeight: 600,
          fontSize: "14px", position: "absolute",
          left: "50%", transform: "translateX(-50%)"
        }}>{title}</span>
      )}

      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#cbd5e1", fontSize: "13px", display: window.innerWidth < 600 ? "none" : "block" }}>
            {user.username}
          </span>
          <span style={{
            padding: "3px 10px", borderRadius: "20px",
            fontSize: "11px", fontWeight: 700,
            background: roleColor[user.role] || "#64748b",
            color: "#fff", textTransform: "uppercase", letterSpacing: "0.5px"
          }}>
            {roleLabel[user.role] || user.role}
          </span>
          <button onClick={handleLogout} style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", padding: "6px 14px",
            borderRadius: "7px", cursor: "pointer",
            fontSize: "13px", fontWeight: 600,
            transition: "background 0.2s"
          }}
            onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.22)"}
            onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.12)"}
          >
            Chiqish
          </button>
        </div>
      )}
    </nav>
  );
}
