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

function StatCard({ icon, label, value, suffix = "", color, isMobile }) {
  const animated = useCountUp(Math.round(Number(value) || 0));
  return (
    <div style={{
      background: "#1e293b", borderRadius: "12px",
      padding: isMobile ? "14px 12px" : "20px 24px",
      borderTop: `4px solid ${color}`,
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: isMobile ? "4px" : "8px"
    }}>
      <span style={{ fontSize: isMobile ? "24px" : "36px" }}>{icon}</span>
      <div style={{ color: "#94a3b8", fontSize: isMobile ? "11px" : "13px", textAlign: "center", lineHeight: 1.3 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: isMobile ? "18px" : "26px", fontWeight: 800 }}>
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

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
      legend: { labels: { color: "#94a3b8", font: { size: isMobile ? 10 : 12 } } }
    },
    scales: {
      x: { ticks: { color: "#94a3b8", font: { size: isMobile ? 9 : 11 } }, grid: { color: "rgba(148,163,184,0.1)" } },
      y: { ticks: { color: "#94a3b8", font: { size: isMobile ? 9 : 11 } }, grid: { color: "rgba(148,163,184,0.1)" } }
    }
  };

  const totalPurchases = (purchases.ip_sum || 0) + (purchases.skoch_sum || 0) + (purchases.tosh_sum || 0);
  const matCount = (purchases.materials_count || 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", fontFamily: "system-ui,sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "#1e3a5f",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 14px" : "0 28px",
        height: "56px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0, gap: "8px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span style={{ fontSize: isMobile ? "18px" : "22px" }}>🏭</span>
          {!isMobile && (
            <span style={{ color: "#fff", fontWeight: 800, fontSize: "15px", letterSpacing: "1.5px" }}>ZAVOD TIZIMI</span>
          )}
        </div>
        <h1 style={{ color: "#fff", fontSize: isMobile ? "12px" : "18px", fontWeight: 800, letterSpacing: isMobile ? "0.5px" : "2px", textAlign: "center", flex: 1 }}>
          {isMobile ? "ISHLAB CHIQARISH" : "ISHLAB CHIQARISH MONITORI"}
        </h1>
        <span style={{ color: "#64748b", fontSize: isMobile ? "11px" : "13px", flexShrink: 0 }}>
          🕐 {lastUpdate || "—"}
        </span>
      </header>

      <div style={{ flex: 1, padding: isMobile ? "12px" : "20px 24px", overflowY: "auto" }}>
        {/* Stat kartalar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
          gap: isMobile ? "10px" : "16px",
          marginBottom: isMobile ? "14px" : "20px"
        }}>
          <StatCard icon="👷" label="Bugun kelgan ishchilar" value={attendance.keldi_count || 0} suffix=" kishi" color="#3b82f6" isMobile={isMobile} />
          <StatCard icon="💰" label="Bugungi maosh jami" value={daily.today_production || 0} suffix=" so'm" color="#10b981" isMobile={isMobile} />
          <StatCard icon="🧵" label="Jami materiallar" value={matCount} suffix=" ta" color="#8b5cf6" isMobile={isMobile} />
          <StatCard icon="📦" label="Bugungi xaridlar jami" value={totalPurchases} suffix=" so'm" color="#f59e0b" isMobile={isMobile} />
        </div>

        {/* O'rta qism: top ishchilar + grafiklar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "340px 1fr",
          gap: isMobile ? "14px" : "20px",
          marginBottom: "20px"
        }}>
          {/* TOP ISHCHILAR */}
          <div style={{ background: "#1e293b", borderRadius: "12px", padding: isMobile ? "14px" : "20px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 700, marginBottom: "12px", letterSpacing: "1px" }}>
              🏆 TOP ISHCHILAR
            </h2>
            {safeTop.length === 0 ? (
              <div style={{ color: "#475569", textAlign: "center", padding: "24px" }}>Ma'lumot yo'q</div>
            ) : (
              safeTop.slice(0, isMobile ? 5 : 8).map((w, i) => {
                const pct = Math.round(Number(w.total) / maxSalary * 100);
                const color = i < 3 ? medalColors[i] : "#3b82f6";
                return (
                  <div key={i} style={{
                    background: i < 3 ? `${color}18` : "transparent",
                    border: `1px solid ${i < 3 ? color + "30" : "transparent"}`,
                    borderRadius: "10px", padding: isMobile ? "8px" : "10px",
                    marginBottom: "6px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: isMobile ? "16px" : "20px", width: "24px", textAlign: "center", color, flexShrink: 0 }}>
                        {medals[i] || `#${w.rank}`}
                      </span>
                      <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "4px", minWidth: 0 }}>
                        <span style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</span>
                        <span style={{ fontSize: isMobile ? "11px" : "13px", fontWeight: 700, color, flexShrink: 0 }}>{Number(w.total).toLocaleString()} so'm</span>
                      </div>
                    </div>
                    <div style={{ height: "3px", background: "#0f172a", borderRadius: "2px", overflow: "hidden", marginLeft: "32px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* GRAFIKLAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "#1e293b", borderRadius: "12px", padding: isMobile ? "14px" : "20px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 700, marginBottom: "12px", letterSpacing: "1px" }}>
                📈 HAFTALIK MAOSH TRENDI
              </h2>
              <Line data={lineData} options={chartOpts} />
            </div>
            {!isMobile && (
              <div style={{ background: "#1e293b", borderRadius: "12px", padding: "20px", flex: 1, border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 700, marginBottom: "14px", letterSpacing: "1px" }}>
                  📊 HAFTALIK DAVOMAT
                </h2>
                <Bar data={barData} options={chartOpts} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticker */}
      {safeTop.length > 0 && (
        <div style={{
          background: "#1e293b", borderTop: "2px solid #2563eb",
          padding: isMobile ? "10px 16px" : "14px 32px",
          display: "flex", alignItems: "center",
          gap: isMobile ? "8px" : "16px", flexShrink: 0,
          flexWrap: isMobile ? "wrap" : "nowrap"
        }}>
          <span style={{ color: "#64748b", fontSize: isMobile ? "11px" : "13px", fontWeight: 600, whiteSpace: "nowrap" }}>
            🏆 ENG YAXSHI:
          </span>
          <span style={{ color: "#fff", fontSize: isMobile ? "14px" : "16px", fontWeight: 700 }}>{safeTop[0].name}</span>
          <span style={{ color: "#fbbf24", fontSize: isMobile ? "14px" : "16px", fontWeight: 700 }}>
            {Number(safeTop[0].total).toLocaleString()} so'm
          </span>
          {!isMobile && (
            <span style={{ marginLeft: "auto", color: "#475569", fontSize: "12px" }}>
              Oxirgi yangilanish: {lastUpdate || "—"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
