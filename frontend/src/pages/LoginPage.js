import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { useToast } from "../components/Toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast("Username va parol kiriting", "error");
      return;
    }
    setLoading(true);
    try {
      const role = await login(username.trim(), password);
      if (role === "admin") navigate("/admin");
      else if (role === "boss") navigate("/boss");
      else if (role === "sales") navigate("/sales");
      else navigate("/tv");
    } catch (err) {
      showToast(err.response?.data?.detail || "Login yoki parol xato", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui,sans-serif", background: isMobile ? "#1e3a5f" : undefined }}>
      {/* Chap panel */}
      <div style={{
        width: "40%", background: "#1e3a5f",
        display: isMobile ? "none" : "flex", flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 40px"
      }}>
        <div>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🏭</div>
          <h1 style={{
            fontSize: "22px", fontWeight: 800,
            color: "#fff", letterSpacing: "1.5px",
            lineHeight: 1.4, marginBottom: "12px"
          }}>
            ISHLAB CHIQARISH<br />TIZIMI
          </h1>
          <p style={{
            color: "#93c5fd", fontSize: "14px",
            lineHeight: 1.7, marginBottom: "36px"
          }}>
            Zavodingiz ma'lumotlarini real vaqtda kuzating
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { icon: "📊", label: "Statistika", desc: "Real vaqt tahlil" },
              { icon: "👷", label: "Ishchilar", desc: "Davomat va maosh" },
              { icon: "📦", label: "Material", desc: "Xom ashyo hisobi" }
            ].map(f => (
              <div key={f.label} style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: "10px", padding: "13px 16px",
                display: "flex", alignItems: "center", gap: "14px",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                <span style={{ fontSize: "26px" }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>{f.label}</div>
                  <div style={{ color: "#93c5fd", fontSize: "12px", marginTop: "2px" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
          © 2026 Zavod Tizimi
        </div>
      </div>

      {/* O'ng panel */}
      <div style={{
        flex: 1, background: isMobile ? "#1e3a5f" : "#f0f4f8",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: isMobile ? "24px 16px" : "40px 24px"
      }}>
        <div style={{
          background: "#fff", borderRadius: "16px",
          padding: isMobile ? "24px" : "44px 40px",
          width: "100%", maxWidth: isMobile ? "100%" : "440px",
          boxShadow: "0 4px 30px rgba(0,0,0,0.15)",
          border: "1px solid #e2e8f0"
        }}>
          <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#1e293b", marginBottom: "6px" }}>
            Xush kelibsiz 👋
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "32px" }}>
            Hisobingizga kiring
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}>
              <label style={lbl}>Username <Req /></label>
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Foydalanuvchi nomi"
                style={inp}
                onFocus={e => e.target.style.borderColor = "#2563eb"}
                onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                autoComplete="username"
              />
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={lbl}>Parol <Req /></label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Parolni kiriting"
                  style={{ ...inp, paddingRight: "46px" }}
                  onFocus={e => e.target.style.borderColor = "#2563eb"}
                  onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  cursor: "pointer", fontSize: "18px", color: "#94a3b8"
                }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px",
              background: loading ? "#93c5fd" : "#2563eb",
              color: "#fff", border: "none", borderRadius: "9px",
              fontSize: "15px", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 14px rgba(37,99,235,0.35)"
            }}>
              {loading ? "Kirmoqda..." : "Kirish"}
            </button>
          </form>

          <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "24px", paddingTop: "18px" }}>
            <a href="/tv" style={{
              display: "block", textAlign: "center",
              color: "#64748b", fontSize: "13px",
              textDecoration: "none"
            }}>📺 TV Dashboard — loginsiz kirish</a>
          </div>
        </div>
        <p style={{ marginTop: "20px", color: "#94a3b8", fontSize: "12px" }}>v1.0.0</p>
      </div>
    </div>
  );
}

const lbl = { display: "block", marginBottom: "7px", fontWeight: 600, color: "#1e293b", fontSize: "14px" };
const inp = {
  width: "100%", padding: "11px 14px",
  border: "1.5px solid #cbd5e1", borderRadius: "8px",
  fontSize: "15px", outline: "none", color: "#1e293b",
  background: "#fff", boxSizing: "border-box"
};
function Req() { return <span style={{ color: "#ef4444" }}>*</span>; }
