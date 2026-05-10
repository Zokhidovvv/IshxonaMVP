import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import { PurchasesTable } from "./SalesPage";
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
const SKOCH_PRICES = { "40": 130000, "32": 100000, "28": 100000 };
const POSITIONS = ["Tikuvchi", "Bichuvchi", "Yordamchi", "Toshchi", "Dazmolchi", "Presschi"];

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

function Inp({ value, onChange, type = "text", placeholder, required, min, step }) {
  return (
    <input type={type} value={value || ""} required={required} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min} step={step}
      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "16px", outline: "none", color: "#1e293b", background: "#fff", boxSizing: "border-box" }}
      onFocus={e => e.target.style.borderColor = "#2d6a4f"}
      onBlur={e => e.target.style.borderColor = "#cbd5e1"}
    />
  );
}

function Sel({ value, onChange, children }) {
  return (
    <select value={value || ""} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "16px", outline: "none", color: "#1e293b", background: "#fff", boxSizing: "border-box", cursor: "pointer" }}>
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
      style={{ padding: "10px 18px", borderRadius: "8px", border: "none", fontWeight: 600, fontSize: "14px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, minHeight: "44px", ...variants[variant], ...ext }}>
      {children}
    </button>
  );
}

function BtnSm({ onClick, variant = "primary", children, title }) {
  const bg = { primary: "#2d6a4f", danger: "#ef4444", success: "#10b981" };
  return (
    <button onClick={onClick} title={title}
      style={{ padding: "8px 12px", borderRadius: "6px", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer", background: bg[variant], color: "#fff", minHeight: "40px" }}>
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
      fontSize: "12px", fontWeight: 700, background: ROLE_COLORS[role] || "#64748b", color: "#fff", textTransform: "uppercase"
    }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

const dateInp = { padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "16px", outline: "none", color: "#1e293b", background: "#fff", cursor: "pointer" };
const inp = { width: "100%", padding: "10px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "16px", outline: "none", color: "#1e293b", background: "#fff", boxSizing: "border-box" };

function SubmitBtn({ loading, children }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: "100%", padding: "13px", background: loading ? "#6ee7b7" : "#2d6a4f",
      color: "#fff", border: "none", borderRadius: "8px",
      fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
      marginTop: "8px", minHeight: "48px"
    }}>{loading ? "Saqlanmoqda..." : children}</button>
  );
}

function TotalCard({ label, value }) {
  return (
    <div style={{ marginTop: "16px", padding: "14px 18px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
      <span style={{ fontWeight: 700, color: "#1e293b" }}>{label}: </span>
      <span style={{ fontWeight: 800, color: "#2d6a4f", fontSize: "18px" }}>{fmt(value)} so'm</span>
    </div>
  );
}

function DelBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "8px 12px", borderRadius: "6px", border: "none", background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontSize: "14px", fontWeight: 700, minHeight: "40px" }}>
      🗑️
    </button>
  );
}

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
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#1e293b", marginTop: "4px" }}>{fmt(s.value)}{s.suffix}</div>
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
          <div className="table-wrapper" style={{ overflowX: "auto" }}>
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

// ─── ADMIN: WORKERS TAB ───────────────────────────────────────────────────────

function AdminWorkersTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstname: "", lastname: "", age: "", position: "", positionSel: "" });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "id", dir: 1 });

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/api/workers"); setList(Array.isArray(r.data) ? r.data : []); }
    catch { showToast("Ishchilarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ firstname: "", lastname: "", age: "", position: "", positionSel: "" }); setModal(true); };
  const openEdit = w => {
    const ps = POSITIONS.includes(w.position || "") ? (w.position || "") : (w.position ? "Boshqa" : "");
    setEditing(w); setForm({ firstname: w.firstname, lastname: w.lastname, age: w.age || "", position: w.position || "", positionSel: ps }); setModal(true);
  };

  const save = async e => {
    e.preventDefault();
    if (!form.firstname || !form.lastname || !form.position) { showToast("Majburiy maydonlarni to'ldiring", "error"); return; }
    try {
      const body = { firstname: form.firstname, lastname: form.lastname, age: form.age ? parseInt(form.age) : null, position: form.position };
      if (editing) { await api.put(`/api/workers/${editing.id}`, body); showToast("Yangilandi"); }
      else { await api.post("/api/workers", body); showToast("Qo'shildi"); }
      setModal(false); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
  };

  const del = async id => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await api.delete(`/api/workers/${id}`); showToast("O'chirildi"); load(); }
    catch { showToast("Xato", "error"); }
  };

  const toggleSort = key => setSort(p => ({ key, dir: p.key === key ? -p.dir : 1 }));
  const filtered = list.filter(w => `${w.firstname} ${w.lastname} ${w.position || ""}`.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    const va = String(a[sort.key] ?? "").toLowerCase(), vb = String(b[sort.key] ?? "").toLowerCase();
    return va < vb ? -sort.dir : va > vb ? sort.dir : 0;
  });

  const doExport = () => exportXLSX(
    sorted.map(w => ({ id: w.id, firstname: w.firstname, lastname: w.lastname, age: w.age || "", position: w.position || "" })),
    [{ key: "id", label: "ID" }, { key: "firstname", label: "Ism" }, { key: "lastname", label: "Familiya" }, { key: "age", label: "Yosh" }, { key: "position", label: "Lavozim" }],
    "ishchilar.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>👷 Ishchilar</h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Qidirish..."
            style={{ padding: "8px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "16px", minWidth: "160px", outline: "none" }} />
          <BtnSm variant="success" onClick={doExport}>📥 Excel</BtnSm>
          <BtnSm onClick={openAdd}>➕ Qo'shish</BtnSm>
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div className="table-wrapper" style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <SortTH sortKey="id" sort={sort} onSort={toggleSort}>ID</SortTH>
              <SortTH sortKey="firstname" sort={sort} onSort={toggleSort}>Ism</SortTH>
              <SortTH sortKey="lastname" sort={sort} onSort={toggleSort}>Familiya</SortTH>
              <SortTH sortKey="age" sort={sort} onSort={toggleSort}>Yosh</SortTH>
              <SortTH sortKey="position" sort={sort} onSort={toggleSort}>Lavozim</SortTH>
              <TH>Amallar</TH>
            </tr></thead>
            <tbody>
              {sorted.map((w, i) => (
                <TRow key={w.id} idx={i}>
                  <TD>{w.id}</TD><TD>{w.firstname}</TD><TD>{w.lastname}</TD>
                  <TD>{w.age || "—"}</TD><TD>{w.position || "—"}</TD>
                  <TD><div style={{ display: "flex", gap: "6px" }}>
                    <BtnSm onClick={() => openEdit(w)}>✏️</BtnSm>
                    <BtnSm variant="danger" onClick={() => del(w.id)}>🗑️</BtnSm>
                  </div></TD>
                </TRow>
              ))}
              {!sorted.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>{search ? "Topilmadi" : "Ma'lumot yo'q"}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Ishchini tahrirlash" : "Ishchi qo'shish"}>
        <form onSubmit={save}>
          <Field label="Ism" required><Inp value={form.firstname} onChange={v => setForm(p => ({ ...p, firstname: v }))} placeholder="Ism" required /></Field>
          <Field label="Familiya" required><Inp value={form.lastname} onChange={v => setForm(p => ({ ...p, lastname: v }))} placeholder="Familiya" required /></Field>
          <Field label="Yosh"><Inp type="number" value={form.age} onChange={v => setForm(p => ({ ...p, age: v }))} placeholder="Yosh" min="14" /></Field>
          <Field label="Lavozim" required>
            <Sel value={form.positionSel} onChange={v => {
              if (v === "Boshqa") setForm(p => ({ ...p, positionSel: "Boshqa", position: "" }));
              else setForm(p => ({ ...p, positionSel: v, position: v }));
            }}>
              <option value="">— Tanlang —</option>
              {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              <option value="Boshqa">Boshqa...</option>
            </Sel>
            {form.positionSel === "Boshqa" && (
              <div style={{ marginTop: "8px" }}>
                <Inp value={form.position} onChange={v => setForm(p => ({ ...p, position: v }))} placeholder="Lavozimni kiriting..." required />
              </div>
            )}
          </Field>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <Btn style={{ variant: "muted", flex: 1 }} onClick={() => setModal(false)}>Bekor</Btn>
            <Btn type="submit" style={{ flex: 1 }}>Saqlash</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── ADMIN: MATERIALS TAB ─────────────────────────────────────────────────────

function AdminMaterialsTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ start: "", end: "" });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "date", dir: -1 });
  const [form, setForm] = useState({ name: "", quantity_rolls: "", length_meters: "", date: todayStr() });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.start) params.start = filter.start;
      if (filter.end) params.end = filter.end;
      const r = await api.get("/api/materials", { params });
      setList(Array.isArray(r.data) ? r.data : []);
    } catch { showToast("Xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const openAdd = () => { setEditing(null); setForm({ name: "", quantity_rolls: "", length_meters: "", date: todayStr() }); setModal(true); };
  const openEdit = m => { setEditing(m); setForm({ name: m.name, quantity_rolls: m.quantity_rolls, length_meters: m.length_meters, date: m.date }); setModal(true); };

  const save = async e => {
    e.preventDefault();
    if (!form.name || !form.quantity_rolls || !form.length_meters) { showToast("Barcha maydonlarni to'ldiring", "error"); return; }
    try {
      const body = { name: form.name, quantity_rolls: parseInt(form.quantity_rolls), length_meters: parseFloat(form.length_meters), date: form.date };
      if (editing) { await api.put(`/api/materials/${editing.id}`, body); showToast("Saqlandi ✅"); }
      else { await api.post("/api/materials", body); showToast("Qo'shildi"); }
      setModal(false); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato ❌", "error"); }
  };

  const del = async id => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await api.delete(`/api/materials/${id}`); showToast("O'chirildi ✅"); load(); }
    catch { showToast("Xato ❌", "error"); }
  };

  const toggleSort = key => setSort(p => ({ key, dir: p.key === key ? -p.dir : 1 }));
  const filtered = list.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const sorted = [...filtered].sort((a, b) => {
    const va = String(a[sort.key] || "").toLowerCase(), vb = String(b[sort.key] || "").toLowerCase();
    return va < vb ? -sort.dir : va > vb ? sort.dir : 0;
  });

  const doExport = () => exportXLSX(
    sorted.map(m => ({ name: m.name, quantity_rolls: m.quantity_rolls, length_meters: m.length_meters, date: m.date })),
    [{ key: "name", label: "Nomi" }, { key: "quantity_rolls", label: "Rulon soni" }, { key: "length_meters", label: "Uzunlik (m)" }, { key: "date", label: "Sana" }],
    "materiallar.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>🧵 Materiallar</h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Qidirish..."
            style={{ padding: "8px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "16px", minWidth: "140px", outline: "none" }} />
          <BtnSm variant="success" onClick={doExport}>📥 Excel</BtnSm>
          <BtnSm onClick={openAdd}>➕ Qo'shish</BtnSm>
        </div>
      </div>
      <DateRangeFilter filter={filter} onChange={setFilter} />
      {loading ? <Spinner /> : (
        <div className="table-wrapper" style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <SortTH sortKey="name" sort={sort} onSort={toggleSort}>Nomi</SortTH>
              <SortTH sortKey="quantity_rolls" sort={sort} onSort={toggleSort}>Rulon soni</SortTH>
              <SortTH sortKey="length_meters" sort={sort} onSort={toggleSort}>Uzunlik (m)</SortTH>
              <SortTH sortKey="date" sort={sort} onSort={toggleSort}>Sana</SortTH>
              <TH>Amallar</TH>
            </tr></thead>
            <tbody>
              {sorted.map((m, i) => (
                <TRow key={m.id} idx={i}>
                  <TD>{m.name}</TD><TD>{m.quantity_rolls}</TD><TD>{m.length_meters}</TD><TD>{m.date}</TD>
                  <TD><div style={{ display: "flex", gap: "6px" }}>
                    <BtnSm onClick={() => openEdit(m)}>✏️</BtnSm>
                    <BtnSm variant="danger" onClick={() => del(m.id)}>🗑️</BtnSm>
                  </div></TD>
                </TRow>
              ))}
              {!sorted.length && <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>{search ? "Topilmadi" : "Ma'lumot yo'q"}</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Materialni tahrirlash" : "Material qo'shish"}>
        <form onSubmit={save}>
          <Field label="Nomi" required><Inp value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Material nomi" required /></Field>
          <Field label="Rulon soni" required><Inp type="number" value={form.quantity_rolls} onChange={v => setForm(p => ({ ...p, quantity_rolls: v }))} placeholder="Rulon soni" required min="1" /></Field>
          <Field label="Uzunlik (m)" required><Inp type="number" value={form.length_meters} onChange={v => setForm(p => ({ ...p, length_meters: v }))} placeholder="Metrlarda" required min="0" step="0.1" /></Field>
          <Field label="Sana" required><Inp type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} required /></Field>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <Btn style={{ variant: "muted", flex: 1 }} onClick={() => setModal(false)}>Bekor</Btn>
            <Btn type="submit" style={{ flex: 1 }}>Saqlash</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── ADMIN: PRODUCTION TAB ────────────────────────────────────────────────────

function AdminProductionTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ worker_id: "", start: "", end: "" });
  const [form, setForm] = useState({ worker_id: "", daily_salary: "", date: todayStr() });

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
      if (!form.worker_id && ws.data.length) setForm(p => ({ ...p, worker_id: ws.data[0].id }));
    } catch { showToast("Xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const workerName = id => { const w = workers.find(w => w.id === id); return w ? `${w.firstname} ${w.lastname}` : "—"; };
  const total = list.reduce((s, l) => s + Number(l.daily_salary || 0), 0);

  const openAdd = () => { setEditing(null); setForm(p => ({ ...p, daily_salary: "" })); setModal(true); };
  const openEdit = l => { setEditing(l); setForm({ worker_id: l.worker_id, daily_salary: l.daily_salary, date: l.date }); setModal(true); };

  const save = async e => {
    e.preventDefault();
    if (!form.worker_id || !form.daily_salary || !form.date) { showToast("Barcha maydonlarni to'ldiring", "error"); return; }
    try {
      const body = { worker_id: parseInt(form.worker_id), daily_salary: parseFloat(form.daily_salary), date: form.date };
      if (editing) { await api.put(`/api/production/${editing.id}`, body); showToast("Saqlandi ✅"); }
      else { await api.post("/api/production", body); showToast("Maosh kiritildi"); }
      setModal(false); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato ❌", "error"); }
  };

  const del = async id => {
    if (!window.confirm("Rostan o'chirmoqchimisiz?")) return;
    try { await api.delete(`/api/production/${id}`); showToast("O'chirildi ✅"); load(); }
    catch { showToast("Xato ❌", "error"); }
  };

  const doExport = () => exportXLSX(
    list.map(l => ({ worker: workerName(l.worker_id), daily_salary: l.daily_salary, date: l.date })),
    [{ key: "worker", label: "Ishchi" }, { key: "daily_salary", label: "Maosh (so'm)" }, { key: "date", label: "Sana" }],
    "kunlik_maosh.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>💰 Kunlik maosh</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <BtnSm variant="success" onClick={doExport}>📥 Excel</BtnSm>
          <BtnSm onClick={openAdd}>➕ Qo'shish</BtnSm>
        </div>
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
          <div className="table-wrapper" style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Ishchi</TH><TH>Maosh (so'm)</TH><TH>Sana</TH><TH>Amallar</TH></tr></thead>
              <tbody>
                {list.map((l, i) => (
                  <TRow key={l.id} idx={i}>
                    <TD>{workerName(l.worker_id)}</TD>
                    <TD><span style={{ fontWeight: 600, color: "#10b981" }}>{fmt(l.daily_salary)} so'm</span></TD>
                    <TD>{l.date}</TD>
                    <TD><div style={{ display: "flex", gap: "6px" }}>
                      <BtnSm onClick={() => openEdit(l)}>✏️</BtnSm>
                      <BtnSm variant="danger" onClick={() => del(l.id)}>🗑️</BtnSm>
                    </div></TD>
                  </TRow>
                ))}
                {!list.length && <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
              </tbody>
            </table>
          </div>
          {list.length > 0 && (
            <div style={{ marginTop: "16px", padding: "16px 20px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
              <span style={{ fontWeight: 700, color: "#14532d" }}>Jami maosh: </span>
              <span style={{ fontWeight: 800, color: "#2d6a4f", fontSize: "18px" }}>{fmt(total)} so'm</span>
            </div>
          )}
        </>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Maoshni tahrirlash" : "Maosh kiritish"}>
        <form onSubmit={save}>
          <Field label="Ishchi" required>
            <Sel value={form.worker_id} onChange={v => setForm(p => ({ ...p, worker_id: v }))}>
              <option value="">Tanlang...</option>
              {workers.map(w => <option key={w.id} value={w.id}>{w.firstname} {w.lastname}</option>)}
            </Sel>
          </Field>
          <Field label="Maosh (so'm)" required><Inp type="number" value={form.daily_salary} onChange={v => setForm(p => ({ ...p, daily_salary: v }))} placeholder="0" required min="0" /></Field>
          <Field label="Sana" required><Inp type="date" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} required /></Field>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <Btn style={{ variant: "muted", flex: 1 }} onClick={() => setModal(false)}>Bekor</Btn>
            <Btn type="submit" style={{ flex: 1 }}>Saqlash</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── ADMIN: ATTENDANCE TAB ────────────────────────────────────────────────────

const STATUSES = [
  { value: "keldi", label: "✅ Keldi", color: "#10b981" },
  { value: "kelmadi", label: "❌ Kelmadi", color: "#ef4444" },
  { value: "yarim_kun", label: "🕐 Yarim kun", color: "#f59e0b" },
  { value: "kasal", label: "🤒 Kasal", color: "#d97706" },
  { value: "tatil", label: "🏖 Ta'til", color: "#3b82f6" },
];

function AdminAttendanceTab() {
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [date, setDate] = useState(todayStr());
  const [workers, setWorkers] = useState([]);
  const [attMap, setAttMap] = useState({});
  const [noteMap, setNoteMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState([]);
  const [statsMonth, setStatsMonth] = useState(todayStr().slice(0, 7));

  const load = async () => {
    setLoading(true);
    try {
      const [ws, att] = await Promise.all([api.get("/api/workers"), api.get("/api/attendance", { params: { date } })]);
      setWorkers(Array.isArray(ws.data) ? ws.data : []);
      const map = {}, notes = {};
      (Array.isArray(att.data) ? att.data : []).forEach(a => { map[a.worker_id] = a.status; notes[a.worker_id] = a.note || ""; });
      setAttMap(map); setNoteMap(notes);
    } catch { showToast("Xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [date]);
  useEffect(() => {
    api.get("/api/attendance/stats", { params: { month: statsMonth } }).then(r => setStats(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [statsMonth]);

  const saveAll = async () => {
    const items = workers.map(w => ({ worker_id: w.id, date, status: attMap[w.id] || "keldi", note: noteMap[w.id] || null }));
    setSaving(true);
    try { await api.post("/api/attendance/bulk", items); showToast("Davomat saqlandi"); }
    catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
    finally { setSaving(false); }
  };

  const doExport = () => exportXLSX(
    stats.map(s => ({ name: s.name, keldi: s.keldi, kelmadi: s.kelmadi, yarim_kun: s.yarim_kun, kasal: s.kasal, tatil: s.tatil, jami: s.jami })),
    [{ key: "name", label: "Ism" }, { key: "keldi", label: "Keldi" }, { key: "kelmadi", label: "Kelmadi" }, { key: "yarim_kun", label: "Yarim kun" }, { key: "kasal", label: "Kasal" }, { key: "tatil", label: "Ta'til" }, { key: "jami", label: "Jami" }],
    "davomat.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>🗓 Davomat</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={dateInp} />
          <Btn onClick={saveAll} disabled={saving}>{saving ? "Saqlanmoqda..." : "💾 Saqlash"}</Btn>
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div className="table-wrapper" style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "32px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>Ism</TH><TH>Familiya</TH><TH>Status</TH>{!isMobile && <TH>Izoh</TH>}</tr></thead>
            <tbody>
              {workers.map((w, i) => {
                const status = attMap[w.id] || "keldi";
                return (
                  <TRow key={w.id} idx={i}>
                    <TD>{w.firstname}</TD><TD>{w.lastname}</TD>
                    <TD>
                      <select value={status} onChange={e => setAttMap(p => ({ ...p, [w.id]: e.target.value }))}
                        style={{ padding: "8px 10px", borderRadius: "6px", border: "1.5px solid #e2e8f0", fontSize: "13px", background: "#fff", cursor: "pointer", minHeight: "40px" }}>
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </TD>
                    {!isMobile && (
                      <TD>
                        <input type="text" value={noteMap[w.id] || ""} onChange={e => setNoteMap(p => ({ ...p, [w.id]: e.target.value }))}
                          placeholder="Izoh..." style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "13px", background: "#fff", width: "150px", minHeight: "40px" }} />
                      </TD>
                    )}
                  </TRow>
                );
              })}
              {!workers.length && <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ishchilar yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
        <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>📅 Oylik statistika</h3>
        <input type="month" value={statsMonth} onChange={e => setStatsMonth(e.target.value)} style={dateInp} />
        {stats.length > 0 && <BtnSm variant="success" onClick={doExport}>📥 Excel</BtnSm>}
      </div>
      {stats.length > 0 && (
        <div className="table-wrapper" style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
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

// ─── ADMIN: USERS TAB ─────────────────────────────────────────────────────────

const ROLES = [{ value: "admin", label: "Admin" }, { value: "boss", label: "Boss" }, { value: "sales", label: "Sales" }];

function AdminUsersTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", role: "sales" });

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/api/users"); setList(Array.isArray(r.data) ? r.data : []); }
    catch { showToast("Foydalanuvchilarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ username: "", password: "", role: "sales" }); setModal(true); };
  const openEdit = u => { setEditing(u); setForm({ username: u.username, password: "", role: u.role }); setModal(true); };

  const save = async e => {
    e.preventDefault();
    if (editing) {
      setSaving(true);
      try {
        await api.put(`/api/users/${editing.id}`, { role: form.role, password: form.password || undefined });
        showToast("Saqlandi ✅"); setModal(false); load();
      } catch (e) { showToast(e.response?.data?.detail || "Xato ❌", "error"); }
      finally { setSaving(false); }
    } else {
      if (!form.username || !form.password) { showToast("Barcha maydonlarni to'ldiring", "error"); return; }
      setSaving(true);
      try {
        await api.post("/api/users", form);
        showToast("Foydalanuvchi qo'shildi");
        setForm({ username: "", password: "", role: "sales" });
        setModal(false); load();
      } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
      finally { setSaving(false); }
    }
  };

  const del = async id => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await api.delete(`/api/users/${id}`); showToast("O'chirildi ✅"); load(); }
    catch { showToast("Xato ❌", "error"); }
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
          <BtnSm onClick={openAdd}>➕ Qo'shish</BtnSm>
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div className="table-wrapper" style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>ID</TH><TH>Login</TH><TH>Rol</TH><TH>Amallar</TH></tr></thead>
            <tbody>
              {list.map((u, i) => (
                <TRow key={u.id} idx={i}>
                  <TD>{u.id}</TD>
                  <TD><span style={{ fontWeight: 600 }}>{u.username}</span></TD>
                  <TD><RoleBadge role={u.role} /></TD>
                  <TD><div style={{ display: "flex", gap: "6px" }}>
                    <BtnSm onClick={() => openEdit(u)}>✏️</BtnSm>
                    <BtnSm variant="danger" onClick={() => del(u.id)}>🗑️</BtnSm>
                  </div></TD>
                </TRow>
              ))}
              {!list.length && <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Foydalanuvchilar yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}>
        <form onSubmit={save}>
          {!editing && <Field label="Login" required><Inp value={form.username} onChange={v => setForm(p => ({ ...p, username: v }))} placeholder="foydalanuvchi nomi" required /></Field>}
          {editing && <div style={{ marginBottom: "14px", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", fontSize: "14px", color: "#64748b" }}>Login: <strong>{form.username}</strong></div>}
          <Field label={editing ? "Yangi parol (ixtiyoriy)" : "Parol"} required={!editing}>
            <Inp type="password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} placeholder="••••••••" required={!editing} />
          </Field>
          <Field label="Rol" required>
            <Sel value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Sel>
          </Field>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <Btn type="submit" disabled={saving} style={{ flex: 1 }}>{saving ? "Saqlanmoqda..." : editing ? "Saqlash" : "➕ Qo'shish"}</Btn>
            <Btn onClick={() => setModal(false)} style={{ variant: "muted" }}>Bekor</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}


// ─── TAB CONFIGS ─────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { id: "stats", icon: "📊", label: "Statistika" },
  { id: "admin", icon: "📋", label: "Admin paneli" },
  { id: "sales", icon: "💰", label: "Sales paneli" },
];

const ADMIN_SUB_TABS = [
  { id: "workers", icon: "👷", label: "Ishchilar" },
  { id: "materials", icon: "🧵", label: "Materiallar" },
  { id: "production", icon: "💰", label: "Kunlik maosh" },
  { id: "attendance", icon: "🗓", label: "Davomat" },
  { id: "users", icon: "👥", label: "Foydalanuvchilar" },
];


// ─── MAIN BOSS PANEL ──────────────────────────────────────────────────────────

export default function BossPanel() {
  const [mainTab, setMainTab] = useState("stats");
  const [adminSub, setAdminSub] = useState("workers");
  const isMobile = useIsMobile();

  const renderAdminTab = () => {
    switch (adminSub) {
      case "workers": return <AdminWorkersTab />;
      case "materials": return <AdminMaterialsTab />;
      case "production": return <AdminProductionTab />;
      case "attendance": return <AdminAttendanceTab />;
      case "users": return <AdminUsersTab />;
      default: return null;
    }
  };

  const subTabStyle = (on) => ({
    padding: isMobile ? "10px 14px" : "12px 20px",
    border: "none",
    background: on ? "#fff" : "transparent",
    color: on ? "#2d6a4f" : "#64748b",
    fontWeight: on ? 700 : 500,
    fontSize: isMobile ? "12px" : "13px",
    cursor: "pointer",
    borderBottom: on ? "2px solid #2d6a4f" : "2px solid transparent",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f0f4f8" }}>
      <Navbar title="Boss Panel" />

      {/* ── 3 main tabs ── */}
      <div style={{ background: "#fff", borderBottom: "2px solid #e2e8f0", display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch", flexShrink: 0 }}>
        {MAIN_TABS.map(t => {
          const on = mainTab === t.id;
          return (
            <button key={t.id} onClick={() => setMainTab(t.id)} style={{
              padding: isMobile ? "14px 18px" : "16px 32px",
              border: "none", background: "transparent",
              color: on ? "#2d6a4f" : "#64748b",
              fontWeight: on ? 700 : 500,
              fontSize: isMobile ? "13px" : "15px",
              cursor: "pointer",
              borderBottom: on ? "3px solid #2d6a4f" : "3px solid transparent",
              whiteSpace: "nowrap", flexShrink: 0,
              transition: "all 0.15s",
            }}>
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px" : "24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* Stats */}
        {mainTab === "stats" && (
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: isMobile ? "16px" : "28px" }}>
            <StatsTab />
          </div>
        )}

        {/* Admin panel */}
        {mainTab === "admin" && (
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ borderBottom: "1px solid #e2e8f0", display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch", background: "#f8fafc" }}>
              {ADMIN_SUB_TABS.map(t => (
                <button key={t.id} onClick={() => setAdminSub(t.id)} style={subTabStyle(adminSub === t.id)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div style={{ padding: isMobile ? "16px" : "28px" }}>
              {renderAdminTab()}
            </div>
          </div>
        )}

        {/* Sales panel — unified purchases table */}
        {mainTab === "sales" && (
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: isMobile ? "16px" : "24px", minHeight: "600px", display: "flex", flexDirection: "column" }}>
            <PurchasesTable />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
