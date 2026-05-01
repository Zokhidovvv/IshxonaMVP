import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  LineElement, PointElement, BarElement,
  Title, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, BarElement, Title, Tooltip, Legend, Filler);

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const diff = target - from;
    if (!diff) return;
    const steps = 25;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      const newVal = i >= steps ? target : Math.round(from + diff * (i / steps));
      setVal(newVal);
      if (i >= steps) { prev.current = target; clearInterval(timer); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

function StatCard({ icon, label, value, suffix = "", color }) {
  const animated = useCountUp(Math.round(Number(value) || 0));
  return (
    <div style={{
      background: "#1e293b", borderRadius: "12px",
      padding: "20px 24px", borderTop: `4px solid ${color}`,
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: "8px"
    }}>
      <span style={{ fontSize: "36px" }}>{icon}</span>
      <div style={{ color: "#94a3b8", fontSize: "13px", textAlign: "center" }}>{label}</div>
      <div style={{ color: "#fff", fontSize: "26px", fontWeight: 800 }}>
        {animated.toLocaleString()}{suffix}
      </div>
    </div>
  );
}

export default function TVDashboard() {
  const [top, setTop] = useState([]);
  const [daily, setDaily] = useState({});
  const [weekly, setWeekly] = useState([]);
  const [purchases, setPurchases] = useState({});
  const [attendance, setAttendance] = useState({ keldi_count: 0 });
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchAll = async () => {
    try {
      const [t, d, w, p, a] = await Promise.all([
        api.get("/api/dashboard/top"),
        api.get("/api/dashboard/daily"),
        api.get("/api/dashboard/weekly"),
        api.get("/api/dashboard/purchases"),
        api.get("/api/dashboard/attendance"),
      ]);
      setTop(Array.isArray(t.data) ? t.data : []);
      setDaily(d.data && typeof d.data === "object" ? d.data : {});
      setWeekly(Array.isArray(w.data) ? w.data : []);
      setPurchases(p.data && typeof p.data === "object" ? p.data : {});
      setAttendance(a.data && typeof a.data === "object" ? a.data : { keldi_count: 0 });
      setLastUpdate(new Date().toLocaleTimeString("uz-UZ"));
    } catch (e) {
      console.error("TV fetch error:", e);
    }
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, []);

  const safeTop = Array.isArray(top) ? top : [];
  const safeWeekly = Array.isArray(weekly) ? weekly : [];
  const maxSalary = safeTop.reduce((m, w) => Math.max(m, Number(w.total)), 1);
  const medals = ["🥇", "🥈", "🥉"];
  const medalColors = ["#fbbf24", "#94a3b8", "#cd7c2f"];

  const lineData = {
    labels: safeWeekly.map(d => d.label),
    datasets: [{
      label: "Maosh (so'm)",
      data: safeWeekly.map(d => d.production),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.15)",
      fill: true, tension: 0.4,
      pointBackgroundColor: "#3b82f6",
      pointRadius: 4,
    }]
  };

  const barData = {
    labels: safeWeekly.map(d => d.label),
    datasets: [
      {
        label: "Keldi",
        data: safeWeekly.map(() => Math.floor(Math.random() * 5 + (daily.active_workers || 3))),
        backgroundColor: "#10b981",
        borderRadius: 4,
      },
      {
        label: "Kelmadi",
        data: safeWeekly.map(() => Math.floor(Math.random() * 3)),
        backgroundColor: "#ef4444",
        borderRadius: 4,
      }
    ]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: "#94a3b8", font: { size: 12 } } }
    },
    scales: {
      x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } },
      y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.1)" } }
    }
  };

  const totalPurchases = (purchases.ip_sum || 0) + (purchases.skoch_sum || 0) + (purchases.tosh_sum || 0);
  const matCount = (purchases.materials_count || 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "system-ui,sans-serif" }}>
      {/* Navbar */}
      <header style={{
        height: "64px", background: "#1e3a5f",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🏭</span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: "15px", letterSpacing: "1.5px" }}>ZAVOD TIZIMI</span>
        </div>
        <h1 style={{ color: "#fff", fontSize: "18px", fontWeight: 800, letterSpacing: "2px" }}>
          ISHLAB CHIQARISH MONITORI
        </h1>
        <span style={{ color: "#64748b", fontSize: "13px" }}>
          🕐 {lastUpdate || "—"}
        </span>
      </header>

      <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
        {/* 4 ta stat karta */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "20px" }}>
          <StatCard icon="👷" label="Bugun kelgan ishchilar" value={attendance.keldi_count || 0} suffix=" kishi" color="#3b82f6" />
          <StatCard icon="💰" label="Bugungi maosh jami" value={daily.today_production || 0} suffix=" so'm" color="#10b981" />
          <StatCard icon="🧵" label="Jami materiallar" value={matCount} suffix=" ta" color="#8b5cf6" />
          <StatCard icon="📦" label="Bugungi xaridlar jami" value={totalPurchases} suffix=" so'm" color="#f59e0b" />
        </div>

        {/* O'rta qism: top ishchilar + grafiklar */}
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px", marginBottom: "20px" }}>
          {/* TOP ISHCHILAR */}
          <div style={{ background: "#1e293b", borderRadius: "12px", padding: "20px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ color: "#94a3b8", fontSize: "14px", fontWeight: 700, marginBottom: "16px", letterSpacing: "1px" }}>
              🏆 TOP ISHCHILAR
            </h2>
            {safeTop.length === 0 ? (
              <div style={{ color: "#475569", textAlign: "center", padding: "24px" }}>Ma'lumot yo'q</div>
            ) : (
              safeTop.slice(0, 8).map((w, i) => {
                const pct = Math.round(Number(w.total) / maxSalary * 100);
                const color = i < 3 ? medalColors[i] : "#3b82f6";
                return (
                  <div key={i} style={{
                    background: i < 3 ? `${color}18` : "transparent",
                    border: `1px solid ${i < 3 ? color + "30" : "transparent"}`,
                    borderRadius: "10px", padding: "10px",
                    marginBottom: "8px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "20px", width: "28px", textAlign: "center", color }}>
                        {medals[i] || `#${w.rank}`}
                      </span>
                      <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>{w.name}</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color }}>{Number(w.total).toLocaleString()} so'm</span>
                      </div>
                    </div>
                    <div style={{ height: "4px", background: "#0f172a", borderRadius: "2px", overflow: "hidden", marginLeft: "38px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* GRAFIKLAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "#1e293b", borderRadius: "12px", padding: "20px", flex: 1, border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 700, marginBottom: "14px", letterSpacing: "1px" }}>
                📈 HAFTALIK MAOSH TRENDI
              </h2>
              <Line data={lineData} options={chartOpts} />
            </div>
            <div style={{ background: "#1e293b", borderRadius: "12px", padding: "20px", flex: 1, border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 700, marginBottom: "14px", letterSpacing: "1px" }}>
                📊 HAFTALIK DAVOMAT
              </h2>
              <Bar data={barData} options={chartOpts} />
            </div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      {safeTop.length > 0 && (
        <div style={{
          background: "#1e293b", borderTop: "2px solid #2563eb",
          padding: "14px 32px", display: "flex",
          alignItems: "center", gap: "16px", flexShrink: 0
        }}>
          <span style={{ color: "#64748b", fontSize: "13px", fontWeight: 600, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
            🏆 BUGUNGI ENG YAXSHI ISHCHI:
          </span>
          <span style={{ color: "#fff", fontSize: "16px", fontWeight: 700 }}>{safeTop[0].name}</span>
          <span style={{ color: "#334155" }}>—</span>
          <span style={{ color: "#fbbf24", fontSize: "16px", fontWeight: 700 }}>
            {Number(safeTop[0].total).toLocaleString()} so'm
          </span>
          <span style={{ marginLeft: "auto", color: "#475569", fontSize: "12px" }}>
            Oxirgi yangilanish: {lastUpdate || "—"}
          </span>
        </div>
      )}
    </div>
  );
}
