import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import api from "../services/api";
import * as XLSX from "xlsx";
import { Line, Bar } from "react-chartjs-2";
import DateRangeFilter from "../components/DateRangeFilter";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  LineElement, PointElement, BarElement,
  Title, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, BarElement, Title, Tooltip, Legend, Filler);

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

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
      <div style={{ width: "40px", height: "40px", border: "4px solid #e2e8f0", borderTopColor: "#2d6a4f", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

function Inp({ value, onChange, type = "text", placeholder, required, min }) {
  return (
    <input type={type} value={value || ""} required={required} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min}
      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", color: "#1e293b", background: "#fff", boxSizing: "border-box" }}
      onFocus={e => e.target.style.borderColor = "#2d6a4f"}
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
  const variants = {
    primary: { background: "#2d6a4f", color: "#fff" },
    danger: { background: "#ef4444", color: "#fff" },
    success: { background: "#10b981", color: "#fff" },
    muted: { background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }
  };
  const variant = ext?.variant || "primary";
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ padding: "10px 18px", borderRadius: "8px", border: "none", fontWeight: 600, fontSize: "14px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, minHeight: "48px", ...variants[variant], ...ext }}>
      {children}
    </button>
  );
}

function BtnSm({ onClick, variant = "primary", children }) {
  const bg = { primary: "#2d6a4f", danger: "#ef4444", success: "#10b981" };
  return (
    <button onClick={onClick}
      style={{ padding: "8px 12px", borderRadius: "6px", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer", background: bg[variant], color: "#fff", minHeight: "44px" }}>
      {children}
    </button>
  );
}

const TH = ({ children }) => (
  <th style={{ padding: "12px 14px", textAlign: "left", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: "13px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
    {children}
  </th>
);

function SortTH({ children, sortKey, sort, onSort }) {
  const active = sort.key === sortKey;
  return (
    <th onClick={() => onSort(sortKey)} style={{
      padding: "12px 14px", textAlign: "left", background: "#f8fafc",
      color: active ? "#2d6a4f" : "#64748b", fontWeight: 600, fontSize: "13px",
      borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap",
      cursor: "pointer", userSelect: "none"
    }}>
      {children}{active ? (sort.dir === 1 ? " ▲" : " ▼") : " ·"}
    </th>
  );
}

const TD = ({ children }) => (
  <td style={{ padding: "11px 14px", fontSize: "14px", color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}>
    {children}
  </td>
);

function TRow({ children, idx }) {
  const [hover, setHover] = useState(false);
  return (
    <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? "#f0fdf4" : idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
      {children}
    </tr>
  );
}

const ROLE_COLORS = { admin: "#f59e0b", boss: "#2d6a4f", sales: "#3b82f6" };
const ROLE_LABELS = { admin: "Admin", boss: "Boss", sales: "Sales" };

function RoleBadge({ role }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: "20px",
      fontSize: "12px", fontWeight: 700, letterSpacing: "0.5px",
      background: ROLE_COLORS[role] || "#64748b", color: "#fff",
      textTransform: "uppercase"
    }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

const dateInp = { padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "14px", outline: "none", color: "#1e293b", background: "#fff" };

const SIDEBAR_TABS = [
  { id: "stats", icon: "📊", label: "Statistika" },
  { id: "workers", icon: "👷", label: "Ishchilar" },
  { id: "materials", icon: "🧵", label: "Materiallar" },
  { id: "production", icon: "💰", label: "Kunlik maosh" },
  { id: "attendance", icon: "🗓", label: "Davomat" },
  { id: "fields", icon: "📋", label: "Forma maydonlari" },
  { id: "users", icon: "👥", label: "Foydalanuvchilar" },
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
      setWeekly(Array.isArray(w.data) ? w.data : []);
      setTop(Array.isArray(t.data) ? t.data : []);
      setAttendance(a.data);
    } catch { showToast("Statistikani olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const safeWeekly = Array.isArray(weekly) ? weekly : [];

  const lineData = {
    labels: safeWeekly.map(d => d.label),
    datasets: [{ label: "Maosh (so'm)", data: safeWeekly.map(d => d.production), borderColor: "#2d6a4f", backgroundColor: "rgba(45,106,79,0.1)", fill: true, tension: 0.4 }]
  };
  const barData = {
    labels: safeWeekly.map(d => d.label),
    datasets: [{ label: "Sotuv (so'm)", data: safeWeekly.map(d => d.sales), backgroundColor: "#10b981", borderRadius: 6 }]
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
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "id", dir: 1 });

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/api/workers"); setList(Array.isArray(r.data) ? r.data : []); }
    catch { showToast("Ishchilarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleSort = key => setSort(p => ({ key, dir: p.key === key ? -p.dir : 1 }));

  const filtered = list.filter(w =>
    `${w.firstname} ${w.lastname} ${w.position || ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    const va = String(a[sort.key] ?? "").toLowerCase();
    const vb = String(b[sort.key] ?? "").toLowerCase();
    return va < vb ? -sort.dir : va > vb ? sort.dir : 0;
  });

  const doExport = () => exportXLSX(
    list.map(w => ({ id: w.id, firstname: w.firstname, lastname: w.lastname, age: w.age || "", position: w.position || "" })),
    [{ key: "id", label: "ID" }, { key: "firstname", label: "Ism" }, { key: "lastname", label: "Familiya" }, { key: "age", label: "Yosh" }, { key: "position", label: "Lavozim" }],
    "ishchilar.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>👷 Ishchilar</h2>
        <Btn style={{ variant: "success" }} onClick={doExport}>📥 Excel</Btn>
      </div>
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Qidirish: ism, familiya, lavozim..."
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", outline: "none", color: "#1e293b", background: "#fff", boxSizing: "border-box", marginBottom: "14px" }}
        onFocus={e => e.target.style.borderColor = "#2d6a4f"}
        onBlur={e => e.target.style.borderColor = "#cbd5e1"}
      />
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <SortTH sortKey="id" sort={sort} onSort={toggleSort}>ID</SortTH>
                <SortTH sortKey="firstname" sort={sort} onSort={toggleSort}>Ism</SortTH>
                <SortTH sortKey="lastname" sort={sort} onSort={toggleSort}>Familiya</SortTH>
                <SortTH sortKey="age" sort={sort} onSort={toggleSort}>Yosh</SortTH>
                <SortTH sortKey="position" sort={sort} onSort={toggleSort}>Lavozim</SortTH>
              </tr>
            </thead>
            <tbody>
              {sorted.map((w, i) => (
                <TRow key={w.id} idx={i}>
                  <TD>{w.id}</TD><TD>{w.firstname}</TD><TD>{w.lastname}</TD>
                  <TD>{w.age || "—"}</TD><TD>{w.position || "—"}</TD>
                </TRow>
              ))}
              {!sorted.length && <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
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
      setList(Array.isArray(r.data) ? r.data : []);
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
      <DateRangeFilter filter={filter} onChange={setFilter} />
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
      setList(Array.isArray(logs.data) ? logs.data : []);
      setWorkers(Array.isArray(ws.data) ? ws.data : []);
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
      <div style={{ marginBottom: "10px" }}>
        <select value={filter.worker_id} onChange={e => setFilter(p => ({ ...p, worker_id: e.target.value }))} style={{ ...dateInp, minWidth: "180px" }}>
          <option value="">Barcha ishchilar</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.firstname} {w.lastname}</option>)}
        </select>
      </div>
      <DateRangeFilter filter={filter} onChange={v => setFilter(p => ({ ...p, ...v }))} />
      {loading ? <Spinner /> : (
        <>
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Ishchi</TH><TH>Maosh (so'm)</TH><TH>Sana</TH></tr></thead>
              <tbody>
                {list.map((l, i) => (
                  <TRow key={l.id} idx={i}>
                    <TD>{workerName(l.worker_id)}</TD>
                    <TD><span style={{ fontWeight: 600, color: "#10b981" }}>{fmt(l.daily_salary)} so'm</span></TD>
                    <TD>{l.date}</TD>
                  </TRow>
                ))}
                {!list.length && <tr><td colSpan={3} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
              </tbody>
            </table>
          </div>
          {list.length > 0 && (
            <div style={{ marginTop: "16px", padding: "16px 20px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
              <span style={{ fontWeight: 700, color: "#1e293b" }}>Jami: </span>
              <span style={{ fontWeight: 800, color: "#2d6a4f", fontSize: "18px" }}>{fmt(total)} so'm</span>
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
      setWorkers(Array.isArray(ws.data) ? ws.data : []);
      const map = {};
      (Array.isArray(att.data) ? att.data : []).forEach(a => { map[a.worker_id] = a.status; });
      setAttMap(map);
    } catch { showToast("Xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [date]);
  useEffect(() => {
    api.get("/api/attendance/stats", { params: { month: statsMonth } }).then(r => setStats(Array.isArray(r.data) ? r.data : [])).catch(() => {});
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
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
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

// ─── FIELDS TAB (Boss: ko'rish + CRUD, admin va sales panelidagi maydonlar) ───

const PANEL_TABS = [
  { id: "admin", label: "📋 Admin maydonlari" },
  { id: "sales", label: "💰 Sales maydonlari" },
];

function FieldsTab() {
  const { showToast } = useToast();
  const [panelView, setPanelView] = useState("admin");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", label: "", field_type: "text", options: "", is_required: false, module: "" });

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/api/fields", { params: { panel: panelView } }); setList(Array.isArray(r.data) ? r.data : []); }
    catch { showToast("Maydonlarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [panelView]);

  const openAdd = () => {
    setForm({ name: "", label: "", field_type: "text", options: "", is_required: false, module: panelView === "admin" ? "production" : "sales" });
    setModal(true);
  };

  const save = async e => {
    e.preventDefault();
    if (!form.name || !form.label) { showToast("Majburiy maydonlarni to'ldiring", "error"); return; }
    try {
      await api.post("/api/fields", { ...form, panel: panelView });
      showToast("Maydon qo'shildi");
      setModal(false); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
  };

  const del = async id => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await api.delete(`/api/fields/${id}`); showToast("O'chirildi"); load(); }
    catch { showToast("Xato", "error"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>📋 Forma maydonlari</h2>
        <Btn onClick={openAdd}>➕ Qo'shish</Btn>
      </div>

      {/* Panel toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {PANEL_TABS.map(pt => {
          const on = panelView === pt.id;
          return (
            <button key={pt.id} onClick={() => setPanelView(pt.id)} style={{
              padding: "8px 18px", borderRadius: "8px", cursor: "pointer", minHeight: "40px",
              border: `1.5px solid ${on ? "#1e3a5f" : "#cbd5e1"}`,
              background: on ? "#1e3a5f" : "#fff",
              color: on ? "#fff" : "#64748b",
              fontWeight: on ? 700 : 400, fontSize: "14px",
            }}>{pt.label}</button>
          );
        })}
      </div>

      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>Nomi</TH><TH>Label</TH><TH>Turi</TH><TH>Modul</TH><TH>Majburiy</TH><TH></TH></tr></thead>
            <tbody>
              {list.map((f, i) => (
                <TRow key={f.id} idx={i}>
                  <TD>{f.name}</TD>
                  <TD>{f.label}</TD>
                  <TD><span style={{ padding: "3px 8px", background: "#f0fdf4", color: "#2d6a4f", borderRadius: "6px", fontSize: "12px" }}>{f.field_type}</span></TD>
                  <TD>{f.module}</TD>
                  <TD>{f.is_required ? "✅" : "—"}</TD>
                  <TD>
                    <button onClick={() => del(f.id)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontWeight: 700, minHeight: "36px" }}>🗑️</button>
                  </TD>
                </TRow>
              ))}
              {!list.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={`${panelView === "admin" ? "Admin" : "Sales"} maydon qo'shish`} onClose={() => setModal(false)}>
          <form onSubmit={save}>
            <Field label="Nomi (name)" required><Inp value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="field_name" required /></Field>
            <Field label="Sarlavha (label)" required><Inp value={form.label} onChange={v => setForm(p => ({ ...p, label: v }))} placeholder="Ko'rsatma matn" required /></Field>
            <Field label="Turi">
              <Sel value={form.field_type} onChange={v => setForm(p => ({ ...p, field_type: v }))}>
                <option value="text">Matn</option>
                <option value="number">Raqam</option>
                <option value="select">Tanlash</option>
                <option value="date">Sana</option>
              </Sel>
            </Field>
            {form.field_type === "select" && (
              <Field label="Variantlar (vergul bilan)"><Inp value={form.options} onChange={v => setForm(p => ({ ...p, options: v }))} placeholder="variant1,variant2" /></Field>
            )}
            <Field label="Modul"><Inp value={form.module} onChange={v => setForm(p => ({ ...p, module: v }))} placeholder="production, sales..." /></Field>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "16px" }}>
              <input type="checkbox" checked={form.is_required} onChange={e => setForm(p => ({ ...p, is_required: e.target.checked }))} />
              <span style={{ fontSize: "14px", color: "#1e293b" }}>Majburiy maydon</span>
            </label>
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <Btn style={{ variant: "muted", flex: 1 }} onClick={() => setModal(false)}>Bekor</Btn>
              <Btn type="submit" style={{ flex: 1 }}>Saqlash</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "boss", label: "Boss" },
  { value: "sales", label: "Sales" },
];

function UsersTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "sales" });

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/api/users"); setList(Array.isArray(r.data) ? r.data : []); }
    catch { showToast("Foydalanuvchilarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async e => {
    e.preventDefault();
    if (!form.username || !form.password) { showToast("Barcha maydonlarni to'ldiring", "error"); return; }
    setSaving(true);
    try {
      await api.post("/api/users", form);
      showToast("Foydalanuvchi qo'shildi");
      setForm({ username: "", password: "", role: "sales" });
      setShowModal(false);
      load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!window.confirm("Foydalanuvchini o'chirishni tasdiqlaysizmi?")) return;
    try { await api.delete(`/api/users/${id}`); showToast("O'chirildi"); load(); }
    catch { showToast("Xato", "error"); }
  };

  const doExport = () => exportXLSX(
    list.map(u => ({ id: u.id, username: u.username, role: u.role })),
    [{ key: "id", label: "ID" }, { key: "username", label: "Login" }, { key: "role", label: "Rol" }],
    "foydalanuvchilar.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>👥 Foydalanuvchilar</h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <BtnSm variant="success" onClick={doExport}>📥 Excel</BtnSm>
          <BtnSm onClick={() => setShowModal(true)}>➕ Qo'shish</BtnSm>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>ID</TH><TH>Login</TH><TH>Rol</TH><TH></TH></tr></thead>
            <tbody>
              {list.map((u, i) => (
                <TRow key={u.id} idx={i}>
                  <TD>{u.id}</TD>
                  <TD><span style={{ fontWeight: 600 }}>{u.username}</span></TD>
                  <TD><RoleBadge role={u.role} /></TD>
                  <TD>
                    <button onClick={() => del(u.id)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontSize: "14px", fontWeight: 700, minHeight: "36px" }}>
                      🗑️
                    </button>
                  </TD>
                </TRow>
              ))}
              {!list.length && <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Foydalanuvchilar yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="Yangi foydalanuvchi" onClose={() => setShowModal(false)}>
          <form onSubmit={save}>
            <Field label="Login" required>
              <Inp value={form.username} onChange={v => setForm(p => ({ ...p, username: v }))} placeholder="foydalanuvchi nomi" required />
            </Field>
            <Field label="Parol" required>
              <Inp type="password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} placeholder="••••••••" required />
            </Field>
            <Field label="Rol" required>
              <Sel value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Sel>
            </Field>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <Btn type="submit" disabled={saving} style={{ flex: 1, variant: "primary" }}>
                {saving ? "Saqlanmoqda..." : "➕ Qo'shish"}
              </Btn>
              <Btn onClick={() => setShowModal(false)} style={{ variant: "muted" }}>Bekor</Btn>
            </div>
          </form>
        </Modal>
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
      case "fields": return <FieldsTab />;
      case "users": return <UsersTab />;
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
