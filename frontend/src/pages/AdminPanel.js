import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import api from "../services/api";
import * as XLSX from "xlsx";

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = n => Number(n || 0).toLocaleString();

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

// ─── shared helpers ───────────────────────────────────────────────────────────

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
      <div style={{
        width: "40px", height: "40px",
        border: "4px solid #e2e8f0",
        borderTopColor: "#2563eb",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
    </div>
  );
}

function Inp({ value, onChange, type = "text", placeholder, required, min }) {
  return (
    <input
      type={type} value={value || ""} required={required}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder} min={min}
      style={{
        width: "100%", padding: "10px 12px",
        border: "1.5px solid #cbd5e1", borderRadius: "8px",
        fontSize: "14px", outline: "none", color: "#1e293b",
        background: "#fff", boxSizing: "border-box"
      }}
      onFocus={e => e.target.style.borderColor = "#2563eb"}
      onBlur={e => e.target.style.borderColor = "#cbd5e1"}
    />
  );
}

function Sel({ value, onChange, children }) {
  return (
    <select value={value || ""} onChange={e => onChange(e.target.value)} style={{
      width: "100%", padding: "10px 12px",
      border: "1.5px solid #cbd5e1", borderRadius: "8px",
      fontSize: "14px", outline: "none", color: "#1e293b",
      background: "#fff", boxSizing: "border-box", cursor: "pointer"
    }}>
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
    primary: { background: "#2563eb", color: "#fff" },
    danger: { background: "#ef4444", color: "#fff" },
    success: { background: "#10b981", color: "#fff" },
    muted: { background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" },
  };
  const variant = ext?.variant || "primary";
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      padding: "10px 18px", borderRadius: "8px", border: "none",
      fontWeight: 600, fontSize: "14px", cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1, minHeight: "48px",
      ...variants[variant], ...ext
    }}>{children}</button>
  );
}

function BtnSm({ onClick, variant = "primary", children, title }) {
  const bg = { primary: "#2563eb", danger: "#ef4444", success: "#10b981" };
  return (
    <button onClick={onClick} title={title} style={{
      padding: "8px 12px", borderRadius: "6px", border: "none",
      fontWeight: 600, fontSize: "13px", cursor: "pointer",
      background: bg[variant], color: "#fff", minHeight: "44px"
    }}>{children}</button>
  );
}

const TH = ({ children }) => (
  <th style={{
    padding: "12px 14px", textAlign: "left",
    background: "#f8fafc", color: "#64748b",
    fontWeight: 600, fontSize: "13px",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap"
  }}>{children}</th>
);

function TRow({ children, idx }) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: hover ? "#eff6ff" : idx % 2 === 0 ? "#fff" : "#f8fafc" }}
    >{children}</tr>
  );
}

const TD = ({ children }) => (
  <td style={{ padding: "11px 14px", fontSize: "14px", color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}>
    {children}
  </td>
);

function RoleBadge({ role }) {
  const colors = { admin: "#f59e0b", boss: "#10b981", sales: "#3b82f6" };
  return (
    <span style={{
      padding: "3px 10px", borderRadius: "20px",
      fontSize: "12px", fontWeight: 700, color: "#fff",
      background: colors[role] || "#64748b",
      textTransform: "uppercase"
    }}>{role}</span>
  );
}

const SIDEBAR_TABS = [
  { id: "workers", icon: "👷", label: "Ishchilar" },
  { id: "users", icon: "👥", label: "Foydalanuvchilar" },
  { id: "materials", icon: "🧵", label: "Materiallar" },
  { id: "production", icon: "💰", label: "Kunlik maosh" },
  { id: "attendance", icon: "🗓", label: "Davomat" },
  { id: "fields", icon: "📋", label: "Forma maydonlari" },
];

// ─── WORKERS TAB ─────────────────────────────────────────────────────────────

function WorkersTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstname: "", lastname: "", age: "", position: "" });

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/api/workers"); setList(r.data); }
    catch { showToast("Ishchilarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ firstname: "", lastname: "", age: "", position: "" }); setModal(true); };
  const openEdit = w => { setEditing(w); setForm({ firstname: w.firstname, lastname: w.lastname, age: w.age || "", position: w.position || "" }); setModal(true); };

  const save = async e => {
    e.preventDefault();
    if (!form.firstname || !form.lastname || !form.position) { showToast("Majburiy maydonlarni to'ldiring", "error"); return; }
    try {
      const body = { firstname: form.firstname, lastname: form.lastname, age: form.age ? parseInt(form.age) : null, position: form.position };
      if (editing) { await api.put(`/api/workers/${editing.id}`, body); showToast("Ishchi yangilandi"); }
      else { await api.post("/api/workers", body); showToast("Ishchi qo'shildi"); }
      setModal(false); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato yuz berdi", "error"); }
  };

  const del = async id => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await api.delete(`/api/workers/${id}`); showToast("O'chirildi"); load(); }
    catch { showToast("O'chirishda xato", "error"); }
  };

  const doExport = () => exportXLSX(
    list.map(w => ({ id: w.id, firstname: w.firstname, lastname: w.lastname, age: w.age || "", position: w.position || "" })),
    [{ key: "id", label: "ID" }, { key: "firstname", label: "Ism" }, { key: "lastname", label: "Familiya" }, { key: "age", label: "Yosh" }, { key: "position", label: "Lavozim" }],
    "ishchilar.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>👷 Ishchilar</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Btn style={{ variant: "success" }} onClick={doExport}>📥 Excel</Btn>
          <Btn onClick={openAdd}>➕ Qo'shish</Btn>
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><TH>ID</TH><TH>Ism</TH><TH>Familiya</TH><TH>Yosh</TH><TH>Lavozim</TH><TH>Amallar</TH></tr>
            </thead>
            <tbody>
              {list.map((w, i) => (
                <TRow key={w.id} idx={i}>
                  <TD>{w.id}</TD>
                  <TD>{w.firstname}</TD>
                  <TD>{w.lastname}</TD>
                  <TD>{w.age || "—"}</TD>
                  <TD>{w.position || "—"}</TD>
                  <TD>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <BtnSm onClick={() => openEdit(w)}>✏️</BtnSm>
                      <BtnSm variant="danger" onClick={() => del(w.id)}>🗑️</BtnSm>
                    </div>
                  </TD>
                </TRow>
              ))}
              {!list.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Ishchini tahrirlash" : "Ishchi qo'shish"}>
        <form onSubmit={save}>
          <Field label="Ism" required><Inp value={form.firstname} onChange={v => setForm(p => ({ ...p, firstname: v }))} placeholder="Ism" required /></Field>
          <Field label="Familiya" required><Inp value={form.lastname} onChange={v => setForm(p => ({ ...p, lastname: v }))} placeholder="Familiya" required /></Field>
          <Field label="Yosh"><Inp type="number" value={form.age} onChange={v => setForm(p => ({ ...p, age: v }))} placeholder="Yosh" min="14" /></Field>
          <Field label="Lavozim" required><Inp value={form.position} onChange={v => setForm(p => ({ ...p, position: v }))} placeholder="Lavozim" required /></Field>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <Btn style={{ variant: "muted", flex: 1 }} onClick={() => setModal(false)}>Bekor</Btn>
            <Btn type="submit" style={{ flex: 1 }}>Saqlash</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────

function UsersTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "admin" });

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/api/users"); setList(r.data); }
    catch { showToast("Foydalanuvchilarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async e => {
    e.preventDefault();
    if (!form.username || !form.password) { showToast("Username va parol kiriting", "error"); return; }
    try {
      await api.post("/api/users", form);
      showToast("Foydalanuvchi qo'shildi");
      setModal(false); setForm({ username: "", password: "", role: "admin" }); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
  };

  const del = async id => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await api.delete(`/api/users/${id}`); showToast("O'chirildi"); load(); }
    catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
  };

  const doExport = () => exportXLSX(
    list.map(u => ({ username: u.username, role: u.role, created_at: u.created_at ? new Date(u.created_at).toLocaleDateString() : "" })),
    [{ key: "username", label: "Username" }, { key: "role", label: "Rol" }, { key: "created_at", label: "Yaratilgan" }],
    "foydalanuvchilar.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>👥 Foydalanuvchilar</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Btn style={{ variant: "success" }} onClick={doExport}>📥 Excel</Btn>
          <Btn onClick={() => setModal(true)}>➕ Qo'shish</Btn>
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>Username</TH><TH>Rol</TH><TH>Yaratilgan</TH><TH>Amallar</TH></tr></thead>
            <tbody>
              {list.map((u, i) => (
                <TRow key={u.id} idx={i}>
                  <TD>{u.username}</TD>
                  <TD><RoleBadge role={u.role} /></TD>
                  <TD>{u.created_at ? new Date(u.created_at).toLocaleDateString("uz-UZ") : "—"}</TD>
                  <TD><BtnSm variant="danger" onClick={() => del(u.id)}>🗑️</BtnSm></TD>
                </TRow>
              ))}
              {!list.length && <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Foydalanuvchi qo'shish">
        <form onSubmit={save}>
          <Field label="Username" required><Inp value={form.username} onChange={v => setForm(p => ({ ...p, username: v }))} placeholder="Username" required /></Field>
          <Field label="Parol" required><Inp type="password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} placeholder="Parol" required /></Field>
          <Field label="Rol" required>
            <Sel value={form.role} onChange={v => setForm(p => ({ ...p, role: v }))}>
              <option value="admin">Admin</option>
              <option value="boss">Boss</option>
              <option value="sales">Sales</option>
            </Sel>
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

// ─── MATERIALS TAB ────────────────────────────────────────────────────────────

function MaterialsTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState({ start: "", end: "" });
  const [form, setForm] = useState({ name: "", quantity_rolls: "", length_meters: "", date: todayStr() });

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

  const save = async e => {
    e.preventDefault();
    if (!form.name || !form.quantity_rolls || !form.length_meters || !form.date) { showToast("Barcha maydonlarni to'ldiring", "error"); return; }
    try {
      await api.post("/api/materials", { name: form.name, quantity_rolls: parseInt(form.quantity_rolls), length_meters: parseFloat(form.length_meters), date: form.date });
      showToast("Material qo'shildi");
      setModal(false); setForm({ name: "", quantity_rolls: "", length_meters: "", date: todayStr() }); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
  };

  const del = async id => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await api.delete(`/api/materials/${id}`); showToast("O'chirildi"); load(); }
    catch { showToast("O'chirishda xato", "error"); }
  };

  const doExport = () => exportXLSX(
    list.map(m => ({ name: m.name, quantity_rolls: m.quantity_rolls, length_meters: m.length_meters, date: m.date })),
    [{ key: "name", label: "Nomi" }, { key: "quantity_rolls", label: "Rulon soni" }, { key: "length_meters", label: "Uzunlik (m)" }, { key: "date", label: "Sana" }],
    "materiallar.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>🧵 Materiallar</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Btn style={{ variant: "success" }} onClick={doExport}>📥 Excel</Btn>
          <Btn onClick={() => setModal(true)}>➕ Qo'shish</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: "13px", color: "#64748b", marginRight: "6px" }}>Dan:</label>
          <input type="date" value={filter.start} onChange={e => setFilter(p => ({ ...p, start: e.target.value }))} style={dateInp} />
        </div>
        <div>
          <label style={{ fontSize: "13px", color: "#64748b", marginRight: "6px" }}>Gacha:</label>
          <input type="date" value={filter.end} onChange={e => setFilter(p => ({ ...p, end: e.target.value }))} style={dateInp} />
        </div>
        {(filter.start || filter.end) && (
          <Btn style={{ variant: "muted" }} onClick={() => setFilter({ start: "", end: "" })}>Tozalash ✕</Btn>
        )}
      </div>
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>Nomi</TH><TH>Rulon soni</TH><TH>Uzunlik (m)</TH><TH>Sana</TH><TH>Amallar</TH></tr></thead>
            <tbody>
              {list.map((m, i) => (
                <TRow key={m.id} idx={i}>
                  <TD>{m.name}</TD>
                  <TD>{m.quantity_rolls}</TD>
                  <TD>{m.length_meters}</TD>
                  <TD>{m.date}</TD>
                  <TD><BtnSm variant="danger" onClick={() => del(m.id)}>🗑️</BtnSm></TD>
                </TRow>
              ))}
              {!list.length && <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Material qo'shish">
        <form onSubmit={save}>
          <Field label="Nomi" required><Inp value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Material nomi" required /></Field>
          <Field label="Rulon soni" required><Inp type="number" value={form.quantity_rolls} onChange={v => setForm(p => ({ ...p, quantity_rolls: v }))} placeholder="Rulon soni" required min="1" /></Field>
          <Field label="Uzunlik (m)" required><Inp type="number" value={form.length_meters} onChange={v => setForm(p => ({ ...p, length_meters: v }))} placeholder="Uzunlik metrlarda" required min="0" /></Field>
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

// ─── PRODUCTION TAB ───────────────────────────────────────────────────────────

function ProductionTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState({ worker_id: "", start: "", end: "" });
  const [form, setForm] = useState({ worker_id: "", daily_salary: "", date: todayStr() });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.worker_id) params.worker_id = filter.worker_id;
      if (filter.start) params.start = filter.start;
      if (filter.end) params.end = filter.end;
      const [logs, ws] = await Promise.all([
        api.get("/api/production", { params }),
        api.get("/api/workers")
      ]);
      setList(logs.data);
      setWorkers(ws.data);
      if (!form.worker_id && ws.data.length) setForm(p => ({ ...p, worker_id: ws.data[0].id }));
    } catch { showToast("Ma'lumotlarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const workerName = id => {
    const w = workers.find(w => w.id === id);
    return w ? `${w.firstname} ${w.lastname}` : "—";
  };

  const save = async e => {
    e.preventDefault();
    if (!form.worker_id || !form.daily_salary || !form.date) { showToast("Barcha majburiy maydonlarni to'ldiring", "error"); return; }
    try {
      await api.post("/api/production", { worker_id: parseInt(form.worker_id), daily_salary: parseFloat(form.daily_salary), date: form.date });
      showToast("Maosh kiritildi");
      setModal(false); setForm(p => ({ ...p, daily_salary: "" })); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
  };

  const total = list.reduce((s, l) => s + Number(l.daily_salary || 0), 0);

  const doExport = () => exportXLSX(
    list.map(l => ({ worker: workerName(l.worker_id), daily_salary: l.daily_salary, date: l.date })),
    [{ key: "worker", label: "Ishchi" }, { key: "daily_salary", label: "Maosh (so'm)" }, { key: "date", label: "Sana" }],
    "kunlik_maosh.xlsx"
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>💰 Kunlik maosh</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Btn style={{ variant: "success" }} onClick={doExport}>📥 Excel</Btn>
          <Btn onClick={() => setModal(true)}>➕ Qo'shish</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <select value={filter.worker_id} onChange={e => setFilter(p => ({ ...p, worker_id: e.target.value }))} style={{ ...dateInp, minWidth: "160px" }}>
          <option value="">Barcha ishchilar</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.firstname} {w.lastname}</option>)}
        </select>
        <input type="date" value={filter.start} onChange={e => setFilter(p => ({ ...p, start: e.target.value }))} style={dateInp} />
        <input type="date" value={filter.end} onChange={e => setFilter(p => ({ ...p, end: e.target.value }))} style={dateInp} />
        {(filter.worker_id || filter.start || filter.end) && (
          <Btn style={{ variant: "muted" }} onClick={() => setFilter({ worker_id: "", start: "", end: "" })}>Tozalash ✕</Btn>
        )}
      </div>
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
            <div style={{ marginTop: "16px", padding: "16px 20px", background: "#eff6ff", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
              <span style={{ fontWeight: 700, color: "#1e3a5f" }}>Jami maosh: </span>
              <span style={{ fontWeight: 800, color: "#2563eb", fontSize: "18px" }}>{fmt(total)} so'm</span>
            </div>
          )}
        </>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Maosh kiritish">
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

// ─── ATTENDANCE TAB ───────────────────────────────────────────────────────────

const STATUSES = [
  { value: "keldi", label: "✅ Keldi", color: "#10b981" },
  { value: "kelmadi", label: "❌ Kelmadi", color: "#ef4444" },
  { value: "yarim_kun", label: "🕐 Yarim kun", color: "#f59e0b" },
  { value: "kasal", label: "🤒 Kasal", color: "#d97706" },
  { value: "tatil", label: "🏖 Ta'til", color: "#3b82f6" },
];

function AttendanceTab() {
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
      const [ws, att] = await Promise.all([
        api.get("/api/workers"),
        api.get("/api/attendance", { params: { date } })
      ]);
      setWorkers(ws.data);
      const map = {}, notes = {};
      att.data.forEach(a => { map[a.worker_id] = a.status; notes[a.worker_id] = a.note || ""; });
      setAttMap(map);
      setNoteMap(notes);
    } catch { showToast("Ma'lumotlarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  const loadStats = async () => {
    try {
      const r = await api.get("/api/attendance/stats", { params: { month: statsMonth } });
      setStats(r.data);
    } catch { showToast("Statistika olishda xato", "error"); }
  };

  useEffect(() => { load(); }, [date]);
  useEffect(() => { loadStats(); }, [statsMonth]);

  const saveAll = async () => {
    const items = workers.map(w => ({
      worker_id: w.id,
      date,
      status: attMap[w.id] || "keldi",
      note: noteMap[w.id] || null
    }));
    setSaving(true);
    try {
      await api.post("/api/attendance/bulk", items);
      showToast("Davomat saqlandi");
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
    finally { setSaving(false); }
  };

  const statusBadge = (val) => {
    const st = STATUSES.find(s => s.value === val);
    if (!st) return null;
    return (
      <span style={{ fontSize: "12px", fontWeight: 600, color: st.color }}>
        {st.label}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>🗓 Davomat</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={dateInp} />
          <Btn onClick={saveAll} disabled={saving}>{saving ? "Saqlanmoqda..." : "💾 Saqlash"}</Btn>
        </div>
      </div>
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "32px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><TH>Ism</TH><TH>Familiya</TH><TH>Status</TH><TH>Izoh</TH></tr>
            </thead>
            <tbody>
              {workers.map((w, i) => {
                const status = attMap[w.id] || "keldi";
                return (
                  <TRow key={w.id} idx={i}>
                    <TD>{w.firstname}</TD>
                    <TD>{w.lastname}</TD>
                    <TD>
                      <select
                        value={status}
                        onChange={e => setAttMap(p => ({ ...p, [w.id]: e.target.value }))}
                        style={{
                          padding: "6px 10px", borderRadius: "6px",
                          border: "1.5px solid #e2e8f0", fontSize: "13px",
                          background: "#fff", cursor: "pointer"
                        }}
                      >
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </TD>
                    <TD>
                      <input
                        type="text"
                        value={noteMap[w.id] || ""}
                        onChange={e => setNoteMap(p => ({ ...p, [w.id]: e.target.value }))}
                        placeholder="Izoh..."
                        style={{
                          padding: "8px 10px", borderRadius: "6px",
                          border: "1px solid #e2e8f0", fontSize: "13px",
                          background: "#fff", width: isMobile ? "100px" : "180px",
                          minHeight: "40px"
                        }}
                      />
                    </TD>
                  </TRow>
                );
              })}
              {!workers.length && <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ishchilar yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Oylik statistika */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>📅 Oylik statistika</h3>
        <input type="month" value={statsMonth} onChange={e => setStatsMonth(e.target.value)} style={dateInp} />
      </div>
      {stats.length > 0 && (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>Ism</TH>
                <TH>✅ Keldi</TH>
                <TH>❌ Kelmadi</TH>
                <TH>🕐 Yarim</TH>
                <TH>🤒 Kasal</TH>
                <TH>🏖 Ta'til</TH>
                <TH>Jami</TH>
              </tr>
            </thead>
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

// ─── FIELDS TAB ───────────────────────────────────────────────────────────────

function FieldsTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", label: "", field_type: "text", options: "", is_required: false, module: "" });

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/api/fields"); setList(r.data); }
    catch { showToast("Maydonlarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async e => {
    e.preventDefault();
    if (!form.name || !form.label || !form.module) { showToast("Majburiy maydonlarni to'ldiring", "error"); return; }
    try {
      await api.post("/api/fields", form);
      showToast("Maydon qo'shildi");
      setModal(false); setForm({ name: "", label: "", field_type: "text", options: "", is_required: false, module: "" }); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
  };

  const del = async id => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    try { await api.delete(`/api/fields/${id}`); showToast("O'chirildi"); load(); }
    catch { showToast("Xato", "error"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>📋 Forma maydonlari</h2>
        <Btn onClick={() => setModal(true)}>➕ Qo'shish</Btn>
      </div>
      {loading ? <Spinner /> : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH>Nomi</TH><TH>Label</TH><TH>Turi</TH><TH>Modul</TH><TH>Majburiy</TH><TH>Amallar</TH></tr></thead>
            <tbody>
              {list.map((f, i) => (
                <TRow key={f.id} idx={i}>
                  <TD>{f.name}</TD>
                  <TD>{f.label}</TD>
                  <TD><span style={{ padding: "3px 8px", background: "#eff6ff", color: "#2563eb", borderRadius: "6px", fontSize: "12px" }}>{f.field_type}</span></TD>
                  <TD>{f.module}</TD>
                  <TD>{f.is_required ? "✅" : "—"}</TD>
                  <TD><BtnSm variant="danger" onClick={() => del(f.id)}>🗑️</BtnSm></TD>
                </TRow>
              ))}
              {!list.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Maydon qo'shish">
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
            <Field label="Variantlar (vergul bilan)">
              <Inp value={form.options} onChange={v => setForm(p => ({ ...p, options: v }))} placeholder="variant1,variant2" />
            </Field>
          )}
          <Field label="Modul" required><Inp value={form.module} onChange={v => setForm(p => ({ ...p, module: v }))} placeholder="workers, materials..." required /></Field>
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
    </div>
  );
}

// ─── MAIN ADMIN PANEL ─────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("workers");
  const isMobile = useIsMobile();

  const renderTab = () => {
    switch (activeTab) {
      case "workers": return <WorkersTab />;
      case "users": return <UsersTab />;
      case "materials": return <MaterialsTab />;
      case "production": return <ProductionTab />;
      case "attendance": return <AttendanceTab />;
      case "fields": return <FieldsTab />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f0f4f8" }}>
      <Navbar title="Admin Panel" />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar tabs={SIDEBAR_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <main style={{
          flex: 1, overflowY: "auto",
          padding: isMobile ? "12px" : "28px",
          paddingBottom: isMobile ? "80px" : "28px"
        }}>
          <div style={{
            background: "#fff", borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            padding: isMobile ? "16px" : "28px"
          }}>
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
}

const dateInp = {
  padding: "8px 12px", borderRadius: "8px",
  border: "1.5px solid #cbd5e1", fontSize: "14px",
  outline: "none", color: "#1e293b", background: "#fff",
  cursor: "pointer"
};
