import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const role = await login(form.username, form.password);
      console.log("[Login] role:", role);
      const r = (role || "").trim().toLowerCase();
      if (r === "admin") navigate("/admin");
      else if (r === "boss") navigate("/boss");
      else if (r === "sales") navigate("/sales");
      else navigate("/tv");
    } catch {
      setError("Login yoki parol xato!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>🏭 Zavod Tizimi</h1>
        <p style={styles.sub}>Kirish uchun ma'lumot kiriting</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            placeholder="Login"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Parol"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Kirmoqda..." : "Kirish"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a href="/tv" style={{ color: "#94a3b8", fontSize: 14 }}>
            📺 TV Dashboard — loginsiz
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" },
  card: { background: "#1e293b", padding: "2.5rem", borderRadius: 16, width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" },
  title: { color: "#fff", textAlign: "center", fontSize: 28, marginBottom: 8 },
  sub: { color: "#94a3b8", textAlign: "center", marginBottom: 24 },
  error: { background: "#dc2626", color: "#fff", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  input: { width: "100%", padding: "12px 16px", marginBottom: 12, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#fff", fontSize: 16, boxSizing: "border-box" },
  btn: { width: "100%", padding: "14px", borderRadius: 8, background: "#3b82f6", color: "#fff", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer" },
};