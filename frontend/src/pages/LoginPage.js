import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handler = e => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    setInstallPrompt(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const role = await login(form.username, form.password);
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
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img src="/logo.png" alt="Hadicha Wear" style={{ height: "72px", objectFit: "contain", marginBottom: "12px" }} />
          <h1 style={styles.title}>Hadicha Wear</h1>
          <p style={styles.sub}>Kirish uchun ma'lumot kiriting</p>
        </div>
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
            📺 Monitor — loginsiz
          </a>
        </div>
        {installPrompt && (
          <button onClick={handleInstall} style={styles.installBtn}>
            📱 Telefonga o'rnatish
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", padding: "16px" },
  card: { background: "#1e293b", padding: "2rem", borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" },
  title: { color: "#fff", textAlign: "center", fontSize: 26, marginBottom: 6, fontWeight: 800 },
  sub: { color: "#94a3b8", textAlign: "center", marginBottom: 0, fontSize: 14 },
  error: { background: "#dc2626", color: "#fff", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 },
  input: { width: "100%", padding: "12px 16px", marginBottom: 12, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#fff", fontSize: 16, boxSizing: "border-box" },
  btn: { width: "100%", padding: "14px", borderRadius: 8, background: "#2d6a4f", color: "#fff", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer", minHeight: "48px" },
  installBtn: { width: "100%", marginTop: 12, padding: "12px", borderRadius: 8, background: "#1e3a5f", color: "#93c5fd", border: "1px solid #3b82f6", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: "44px" },
};
