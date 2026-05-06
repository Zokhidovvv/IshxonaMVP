import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import api from "../services/api";
import * as XLSX from "xlsx";
import { Line, Bar } from "react-chartjs-2";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  LineElement, PointElement, BarElement,
  Title, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, BarElement, Title, Tooltip, Legend, Filler);

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = n => Number(n || 0).toLocaleString();

function exportXLSX(rows, cols, filename) {
  const data = [cols.map(c => c.label), ...rows.map(r => cols.map(c => r[c.key] ?? ""))];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
      <div style={{ width: "40px", height: "40px", border: "4px solid #e2e8f0", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

function Inp({ value, onChange, type = "text", placeholder, required, min }) {
  return (
    <input type={type} value={value || ""} required={required} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min}
      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", color: "#1e293b", background: "#fff", boxSizing: "border-box" }}
      onFocus={e => e.target.style.borderColor = "#2563eb"}
      onBlur={e => e.target.style.borderColor = "#cbd5e1"}
    />
  );
}

function Sel({ value, onChange, children }) {
  return (
    <select value={value || ""} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", color: "#1e293b", background: "#fff", boxSizing: "border-box" }}>
      {children}
    </select>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: "13px", color: "#374151", marginBottom: "5px" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Btn({ onClick, type = "button", style: ext, disabled, children }) {
  const variants = { primary: { background: "#2563eb", color: "#fff" }, danger: { background: "#ef4444", color: "#fff" }, success: { background: "#10b981", color: "#fff" }, muted: { background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" } };
  const variant = ext?.variant || "primary";
  return <button type={type} onClick={onClick} disabled={disabled} style={{ padding: "10px 18px", borderRadius: "8px", border: "none", fontWeight: 600, fontSize: "14px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, minHeight: "48px", ...variants[variant], ...ext }}>{children}</button>;
}

function BtnSm({ onClick, variant = "primary", children }) {
  const bg = { primary: "#2563eb", danger: "#ef4444", success: "#10b981" };
  return <button onClick={onClick} style={{ padding: "8px 12px", borderRadius: "6px", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer", background: bg[variant], color: "#fff", minHeight: "44px" }}>{children}</button>;
}

const TH = ({ children }) => <th style={{ padding: "12px 14px", textAlign: "left", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: "13px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{children}</th>;
const TD = ({ children }) => <td style={{ padding: "11px 14px", fontSize: "14px", color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}>{children}</td>;

function TRow({ children, idx }) {
  const [hover, setHover] = useState(false);
  return <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ background: hover ? "#eff6ff" : idx % 2 === 0 ? "#fff" : "#f8fafc" }}>{children}</tr>;
}

const dateInp = { padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", outline: "none", color: "#1e293b", background: "#fff" };

const SIDEBAR_TABS = [
  { id: "stats", icon: "📊", label: "Statistika" },
  { id: "workers", icon: "👷", label: "Ishchilar" },
  { id: "materials", icon: "🧵", label: "Materiallar" },
  { id: "production", icon: "💰", label: "Kunlik maosh" },
  { id: "attendance", icon: "🗓", label: "Davomat" },
];

// ─── STATS TAB ────────────────────────────────────────────────────────────────

function StatsTab() {
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [daily, setDaily] = useState({});
  const [weekly, setWeekly] = useState([]);
  const [top, setTop] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [d, w, t, a] = await Promise.all([
        api.get("/api/dashboard/daily"),
        api.get("/api/dashboard/weekly"),
        api.get("/api/dashboard/top"),
        api.get("/api/dashboard/attendance"),
      ]);
      setDaily(d.data);
      setWeekly(w.data);
      setTop(t.data);
      setAttendance(a.data);
    } catch { showToast("Statistikani olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const lineData = {
    labels: weekly.map(d => d.label),
    datasets: [{ label: "Maosh (so'm)", data: weekly.map(d => d.production), borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,0.1)", fill: true, tension: 0.4 }]
  };
  const barData = {
    labels: weekly.map(d => d.label),
    datasets: [{ label: "Sotuv (so'm)", data: weekly.map(d => d.sales), backgroundColor: "#10b981", borderRadius: 6 }]
  };
  const chartOpts = { responsive: true, plugins: { legend: { labels: { font: { size: 12 } } } }, scales: { x: { grid: { color: "#f1f5f9" } }, y: { grid: { color: "#f1f5f9" } } } };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", marginBottom: "20px" }}>📊 Statistika</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { icon: "👷", label: "Faol ishchilar", value: daily.active_workers || 0, suffix: " kishi", color: "#3b82f6" },
          { icon: "💰", label: "Bugungi maosh", value: daily.today_production || 0, suffix: " so'm", color: "#10b981" },
          { icon: "💹", label: "Bugungi sotuv", value: daily.total_sales || 0, suffix: " so'm", color: "#f59e0b" },
          { icon: "✅", label: "Bugun keldi", value: attendance.keldi_count || 0, suffix: " kishi", color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: "28px" }}>{s.icon}</div>
            <div style={{ color: "#64748b", fontSize: "13px", marginTop: "8px" }}>{s.label}</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#1e293b", marginTop: "4px" }}>
              {fmt(s.value)}{s.suffix}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>📈 Haftalik maosh trendi</h3>
          <Line data={lineData} options={chartOpts} />
        </div>
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>📊 Haftalik sotuv</h3>
          <Bar data={barData} options={chartOpts} />
        </div>
      </div>
      {top.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>🏆 Top ishchilar</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>#</TH><TH>Ism</TH><TH>Jami maosh</TH></tr></thead>
              <tbody>
                {top.map((w, i) => (
                  <TRow key={i} idx={i}>
                    <TD>{["🥇", "🥈", "🥉"][i] || `#${w.rank}`}</TD>
                    <TD>{w.name}</TD>
                    <TD><span style={{ fontWeight: 700, color: "#10b981" }}>{fmt(w.total)} so'm</span></TD>
                  </TRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WORKERS TAB (readonly for boss) ─────────────────────────────────────────

function WorkersTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/api/workers"); setList(r.data); }
    catch { showToast("Ishchilarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const doExport = () => exportXLSX(
    list.map(w => ({ id: w.id, firstname: w.firstname, lastname: w.lastname, age: w.age || "", position: w.position || "" })),
    [{ key: "id", label: "ID" }, { key: "firstname", label: "Ism" }, { key: "lastname", label: "Familiya" }, { key: "age", label: "Yosh" }, { key: "position", label: "Lavozim" }],
    "ishchilar.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>👷 Ishchilar</h2>
        <Btn style={{ variant: "success" }} onClick={doExport}>📥 Excel</Btn>
      </div>
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>ID</TH><TH>Ism</TH><TH>Familiya</TH><TH>Yosh</TH><TH>Lavozim</TH></tr></thead>
            <tbody>
              {list.map((w, i) => (
                <TRow key={w.id} idx={i}>
                  <TD>{w.id}</TD><TD>{w.firstname}</TD><TD>{w.lastname}</TD>
                  <TD>{w.age || "—"}</TD><TD>{w.position || "—"}</TD>
                </TRow>
              ))}
              {!list.length && <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MATERIALS TAB ────────────────────────────────────────────────────────────

function MaterialsTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ start: "", end: "" });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.start) params.start = filter.start;
      if (filter.end) params.end = filter.end;
      const r = await api.get("/api/materials", { params });
      setList(r.data);
    } catch { showToast("Materiallarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const doExport = () => exportXLSX(
    list.map(m => ({ name: m.name, quantity_rolls: m.quantity_rolls, length_meters: m.length_meters, date: m.date })),
    [{ key: "name", label: "Nomi" }, { key: "quantity_rolls", label: "Rulon soni" }, { key: "length_meters", label: "Uzunlik (m)" }, { key: "date", label: "Sana" }],
    "materiallar.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>🧵 Materiallar</h2>
        <Btn style={{ variant: "success" }} onClick={doExport}>📥 Excel</Btn>
      </div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div><label style={{ fontSize: "13px", color: "#64748b", marginRight: "6px" }}>Dan:</label><input type="date" value={filter.start} onChange={e => setFilter(p => ({ ...p, start: e.target.value }))} style={dateInp} /></div>
        <div><label style={{ fontSize: "13px", color: "#64748b", marginRight: "6px" }}>Gacha:</label><input type="date" value={filter.end} onChange={e => setFilter(p => ({ ...p, end: e.target.value }))} style={dateInp} /></div>
        {(filter.start || filter.end) && <Btn style={{ variant: "muted" }} onClick={() => setFilter({ start: "", end: "" })}>Tozalash ✕</Btn>}
      </div>
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>Nomi</TH><TH>Rulon soni</TH><TH>Uzunlik (m)</TH><TH>Sana</TH></tr></thead>
            <tbody>
              {list.map((m, i) => (
                <TRow key={m.id} idx={i}><TD>{m.name}</TD><TD>{m.quantity_rolls}</TD><TD>{m.length_meters}</TD><TD>{m.date}</TD></TRow>
              ))}
              {!list.length && <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── PRODUCTION TAB ───────────────────────────────────────────────────────────

function ProductionTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ worker_id: "", start: "", end: "" });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.worker_id) params.worker_id = filter.worker_id;
      if (filter.start) params.start = filter.start;
      if (filter.end) params.end = filter.end;
      const [logs, ws] = await Promise.all([api.get("/api/production", { params }), api.get("/api/workers")]);
      setList(logs.data); setWorkers(ws.data);
    } catch { showToast("Xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const workerName = id => { const w = workers.find(w => w.id === id); return w ? `${w.firstname} ${w.lastname}` : "—"; };
  const total = list.reduce((s, l) => s + Number(l.daily_salary || 0), 0);

  const doExport = () => exportXLSX(
    list.map(l => ({ worker: workerName(l.worker_id), daily_salary: l.daily_salary, date: l.date })),
    [{ key: "worker", label: "Ishchi" }, { key: "daily_salary", label: "Maosh (so'm)" }, { key: "date", label: "Sana" }],
    "kunlik_maosh.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>💰 Kunlik maosh</h2>
        <Btn style={{ variant: "success" }} onClick={doExport}>📥 Excel</Btn>
      </div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <select value={filter.worker_id} onChange={e => setFilter(p => ({ ...p, worker_id: e.target.value }))} style={{ ...dateInp, minWidth: "160px" }}>
          <option value="">Barcha ishchilar</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.firstname} {w.lastname}</option>)}
        </select>
        <input type="date" value={filter.start} onChange={e => setFilter(p => ({ ...p, start: e.target.value }))} style={dateInp} />
        <input type="date" value={filter.end} onChange={e => setFilter(p => ({ ...p, end: e.target.value }))} style={dateInp} />
        {(filter.worker_id || filter.start || filter.end) && <Btn style={{ variant: "muted" }} onClick={() => setFilter({ worker_id: "", start: "", end: "" })}>Tozalash ✕</Btn>}
      </div>
      {loading ? <Spinner /> : (
        <>
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Ishchi</TH><TH>Maosh (so'm)</TH><TH>Sana</TH></tr></thead>
              <tbody>
                {list.map((l, i) => (
                  <TRow key={l.id} idx={i}><TD>{workerName(l.worker_id)}</TD><TD><span style={{ fontWeight: 600, color: "#10b981" }}>{fmt(l.daily_salary)} so'm</span></TD><TD>{l.date}</TD></TRow>
                ))}
                {!list.length && <tr><td colSpan={3} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
              </tbody>
            </table>
          </div>
          {list.length > 0 && (
            <div style={{ marginTop: "16px", padding: "16px 20px", background: "#eff6ff", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
              <span style={{ fontWeight: 700, color: "#1e3a5f" }}>Jami: </span>
              <span style={{ fontWeight: 800, color: "#2563eb", fontSize: "18px" }}>{fmt(total)} so'm</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── ATTENDANCE TAB ───────────────────────────────────────────────────────────

const STATUSES = [
  { value: "keldi", label: "✅ Keldi" }, { value: "kelmadi", label: "❌ Kelmadi" },
  { value: "yarim_kun", label: "🕐 Yarim kun" }, { value: "kasal", label: "🤒 Kasal" },
  { value: "tatil", label: "🏖 Ta'til" },
];

function AttendanceTab() {
  const { showToast } = useToast();
  const [date, setDate] = useState(todayStr());
  const [workers, setWorkers] = useState([]);
  const [attMap, setAttMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState([]);
  const [statsMonth, setStatsMonth] = useState(todayStr().slice(0, 7));

  const load = async () => {
    setLoading(true);
    try {
      const [ws, att] = await Promise.all([api.get("/api/workers"), api.get("/api/attendance", { params: { date } })]);
      setWorkers(ws.data);
      const map = {};
      att.data.forEach(a => { map[a.worker_id] = a.status; });
      setAttMap(map);
    } catch { showToast("Xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [date]);
  useEffect(() => {
    api.get("/api/attendance/stats", { params: { month: statsMonth } }).then(r => setStats(r.data)).catch(() => {});
  }, [statsMonth]);

  const doExport = () => exportXLSX(
    stats.map(s => ({ name: s.name, keldi: s.keldi, kelmadi: s.kelmadi, yarim_kun: s.yarim_kun, kasal: s.kasal, tatil: s.tatil, jami: s.jami })),
    [{ key: "name", label: "Ism" }, { key: "keldi", label: "Keldi" }, { key: "kelmadi", label: "Kelmadi" }, { key: "yarim_kun", label: "Yarim kun" }, { key: "kasal", label: "Kasal" }, { key: "tatil", label: "Ta'til" }, { key: "jami", label: "Jami" }],
    "davomat_statistika.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>🗓 Davomat</h2>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={dateInp} />
      </div>
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "28px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>Ism</TH><TH>Familiya</TH><TH>Status</TH></tr></thead>
            <tbody>
              {workers.map((w, i) => (
                <TRow key={w.id} idx={i}>
                  <TD>{w.firstname}</TD><TD>{w.lastname}</TD>
                  <TD>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>
                      {STATUSES.find(s => s.value === (attMap[w.id] || "keldi"))?.label || "—"}
                    </span>
                  </TD>
                </TRow>
              ))}
              {!workers.length && <tr><td colSpan={3} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ishchilar yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>📅 Oylik statistika</h3>
        <input type="month" value={statsMonth} onChange={e => setStatsMonth(e.target.value)} style={dateInp} />
        {stats.length > 0 && <Btn style={{ variant: "success" }} onClick={doExport}>📥 Excel</Btn>}
      </div>
      {stats.length > 0 && (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>Ism</TH><TH>✅ Keldi</TH><TH>❌ Kelmadi</TH><TH>🕐 Yarim</TH><TH>🤒 Kasal</TH><TH>🏖 Ta'til</TH><TH>Jami</TH></tr></thead>
            <tbody>
              {stats.map((s, i) => (
                <TRow key={s.worker_id} idx={i}>
                  <TD>{s.name}</TD>
                  <TD><span style={{ color: "#10b981", fontWeight: 600 }}>{s.keldi}</span></TD>
                  <TD><span style={{ color: "#ef4444", fontWeight: 600 }}>{s.kelmadi}</span></TD>
                  <TD><span style={{ color: "#f59e0b", fontWeight: 600 }}>{s.yarim_kun}</span></TD>
                  <TD><span style={{ color: "#d97706", fontWeight: 600 }}>{s.kasal}</span></TD>
                  <TD><span style={{ color: "#3b82f6", fontWeight: 600 }}>{s.tatil}</span></TD>
                  <TD><span style={{ fontWeight: 700 }}>{s.jami}</span></TD>
                </TRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MAIN BOSS PANEL ──────────────────────────────────────────────────────────

export default function BossPanel() {
  const [activeTab, setActiveTab] = useState("stats");
  const isMobile = useIsMobile();

  const renderTab = () => {
    switch (activeTab) {
      case "stats": return <StatsTab />;
      case "workers": return <WorkersTab />;
      case "materials": return <MaterialsTab />;
      case "production": return <ProductionTab />;
      case "attendance": return <AttendanceTab />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f0f4f8" }}>
      <Navbar title="Boss Panel" />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar tabs={SIDEBAR_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px" : "28px", paddingBottom: isMobile ? "80px" : "28px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: isMobile ? "16px" : "28px" }}>
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
}
