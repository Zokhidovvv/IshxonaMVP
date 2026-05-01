import { useState } from "react";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { useAuth } from "../store/AuthContext";
import api from "../services/api";

export default function BossView() {
  const { logout, user } = useAuth();
  const [top, setTop] = useState([]);
  const [daily, setDaily] = useState({});
  const [weekly, setWeekly] = useState([]);

  useAutoRefresh(async () => {
    const [t, d, w] = await Promise.all([
      api.get("/api/dashboard/top"),
      api.get("/api/dashboard/daily"),
      api.get("/api/dashboard/weekly"),
    ]);
    setTop(t.data);
    setDaily(d.data);
    setWeekly(w.data);
  }, 30000);

  return (
    <div style={s.page}>
      <div style={s.nav}>
        <span style={s.navTitle}>👔 Boss Panel</span>
        <span style={s.navUser}>👤 {user?.username}</span>
        <button style={s.logoutBtn} onClick={logout}>Chiqish</button>
      </div>

      <div style={s.grid}>
        <MetricCard label="Faol ishchilar" value={daily.active_workers ?? 0} icon="👷" />
        <MetricCard label="Bugungi mahsulot" value={daily.total_production ?? 0} icon="📦" />
        <MetricCard label="Bugungi sotuv" value={`${(daily.total_sales ?? 0).toLocaleString()} so'm`} icon="💰" />
      </div>

      <div style={s.section}>
        <h2 style={s.sectionTitle}>🏆 Top 10 ishchi (barcha vaqt)</h2>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              <th style={s.th}>#</th>
              <th style={s.th}>Ism</th>
              <th style={s.th}>Jami mahsulot</th>
            </tr>
          </thead>
          <tbody>
            {top.map((w) => (
              <tr key={w.rank} style={s.tr}>
                <td style={s.td}>{w.rank <= 3 ? ["🥇","🥈","🥉"][w.rank-1] : w.rank}</td>
                <td style={s.td}>{w.name}</td>
                <td style={{ ...s.td, color: "#3b82f6", fontWeight: 700 }}>{w.total} dona</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={s.section}>
        <h2 style={s.sectionTitle}>📅 Haftalik ko'rsatkichlar</h2>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              <th style={s.th}>Kun</th>
              <th style={s.th}>Mahsulot</th>
              <th style={s.th}>Sotuv</th>
            </tr>
          </thead>
          <tbody>
            {weekly.map((d) => (
              <tr key={d.date} style={s.tr}>
                <td style={s.td}>{d.label} ({d.date})</td>
                <td style={s.td}>{d.production} dona</td>
                <td style={s.td}>{d.sales.toLocaleString()} so'm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div style={s.card}>
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: 0 },
  nav: { background: "#1e293b", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 },
  navTitle: { color: "#fff", fontSize: 20, fontWeight: 700, flex: 1 },
  navUser: { color: "#94a3b8", fontSize: 14 },
  logoutBtn: { background: "#dc2626", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, padding: 24 },
  card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", textAlign: "center" },
  section: { margin: "0 24px 24px", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },
  sectionTitle: { fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#1e293b" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f1f5f9" },
  th: { padding: "10px 16px", textAlign: "left", fontSize: 13, color: "#64748b", fontWeight: 600 },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 16px", fontSize: 15 },
};
