import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import api from "../services/api";
import DateRangeFilter from "../components/DateRangeFilter";

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = n => Number(n || 0).toLocaleString();
const SKOCH_PRICES = { "40": 130000, "32": 100000, "28": 100000 };

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
      <div style={{ width: "36px", height: "36px", border: "4px solid #e2e8f0", borderTopColor: "#2d6a4f", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

const TH = ({ children }) => <th style={{ padding: "11px 14px", textAlign: "left", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: "13px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{children}</th>;
const TD = ({ children }) => <td style={{ padding: "10px 14px", fontSize: "14px", color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}>{children}</td>;

function TRow({ children, idx }) {
  const [hover, setHover] = useState(false);
  return <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ background: hover ? "#f0fdf4" : idx % 2 === 0 ? "#fff" : "#f8fafc" }}>{children}</tr>;
}

const inp = {
  width: "100%", padding: "10px 12px", border: "1.5px solid #cbd5e1",
  borderRadius: "8px", fontSize: "14px", outline: "none",
  color: "#1e293b", background: "#fff", boxSizing: "border-box"
};

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: "13px", color: "#374151", marginBottom: "6px" }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

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

function EditBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "8px 12px", borderRadius: "6px", border: "none", background: "#dbeafe", color: "#2563eb", cursor: "pointer", fontSize: "14px", fontWeight: 700, minHeight: "40px" }}>
      ✏️
    </button>
  );
}

// ─── IP TAB ───────────────────────────────────────────────────────────────────

function IpTab() {
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ soni: "", narxi: "", date: "" });
  const [filter, setFilter] = useState({ start: todayStr(), end: todayStr() });
  const [form, setForm] = useState({ soni: "", narxi: "", date: todayStr() });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.start) params.start = filter.start;
      if (filter.end) params.end = filter.end;
      const r = await api.get("/api/ip", { params });
      setList(r.data);
    } catch { showToast("Ma'lumotlarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const save = async e => {
    e.preventDefault();
    if (!form.soni || !form.narxi || !form.date) { showToast("Barcha maydonlarni to'ldiring", "error"); return; }
    setSaving(true);
    try {
      await api.post("/api/ip", { soni: parseInt(form.soni), narxi: parseFloat(form.narxi), date: form.date });
      showToast("Ip kiritildi");
      setForm(p => ({ ...p, soni: "", narxi: "" }));
      load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
    finally { setSaving(false); }
  };

  const openEdit = l => { setEditItem(l); setEditForm({ soni: l.soni, narxi: l.narxi, date: l.date }); setEditModal(true); };

  const saveEdit = async e => {
    e.preventDefault();
    try {
      await api.put(`/api/ip/${editItem.id}`, { soni: parseInt(editForm.soni), narxi: parseFloat(editForm.narxi), date: editForm.date });
      showToast("Saqlandi ✅"); setEditModal(false); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato ❌", "error"); }
  };

  const del = async id => {
    if (!window.confirm("Rostan o'chirmoqchimisiz?")) return;
    try { await api.delete(`/api/ip/${id}`); showToast("O'chirildi ✅"); load(); }
    catch { showToast("Xato ❌", "error"); }
  };

  const total = list.reduce((s, l) => s + Number(l.soni) * Number(l.narxi), 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 3fr", gap: "24px" }}>
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "18px" }}>🪡 Ip kiritish</h3>
        <form onSubmit={save}>
          <Field label="Soni (pachka)" required>
            <input type="number" value={form.soni} onChange={e => setForm(p => ({ ...p, soni: e.target.value }))} placeholder="0" style={inp} min="1" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Narxi (so'm)" required>
            <input type="number" value={form.narxi} onChange={e => setForm(p => ({ ...p, narxi: e.target.value }))} placeholder="0" style={inp} min="0" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Sana" required>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          {form.soni && form.narxi && (
            <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", marginBottom: "12px", fontSize: "14px", color: "#065f46", fontWeight: 600 }}>
              Jami: {fmt(Number(form.soni) * Number(form.narxi))} so'm
            </div>
          )}
          <SubmitBtn loading={saving}>➕ Qo'shish</SubmitBtn>
        </form>
      </div>
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>Kiritilganlar</h3>
        <DateRangeFilter filter={filter} onChange={setFilter} />
        {loading ? <Spinner /> : (
          <>
            <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Soni</TH><TH>Narxi</TH><TH>Jami</TH><TH>Sana</TH><TH>Amallar</TH></tr></thead>
                <tbody>
                  {list.map((l, i) => (
                    <TRow key={l.id} idx={i}>
                      <TD>{l.soni} pachka</TD>
                      <TD>{fmt(l.narxi)} so'm</TD>
                      <TD><span style={{ fontWeight: 700, color: "#10b981" }}>{fmt(Number(l.soni) * Number(l.narxi))} so'm</span></TD>
                      <TD>{l.date}</TD>
                      <TD><div style={{ display: "flex", gap: "6px" }}>
                        <EditBtn onClick={() => openEdit(l)} />
                        <DelBtn onClick={() => del(l.id)} />
                      </div></TD>
                    </TRow>
                  ))}
                  {!list.length && <tr><td colSpan={5} style={{ textAlign: "center", padding: "28px", color: "#94a3b8" }}>Hali kiritilmagan</td></tr>}
                </tbody>
              </table>
            </div>
            {list.length > 0 && <TotalCard label="Jami" value={total} />}
          </>
        )}
      </div>
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Ipni tahrirlash">
        <form onSubmit={saveEdit}>
          <Field label="Soni (pachka)" required>
            <input type="number" value={editForm.soni} onChange={e => setEditForm(p => ({ ...p, soni: e.target.value }))} style={inp} min="1" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Narxi (so'm)" required>
            <input type="number" value={editForm.narxi} onChange={e => setEditForm(p => ({ ...p, narxi: e.target.value }))} style={inp} min="0" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Sana" required>
            <input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button type="button" onClick={() => setEditModal(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f1f5f9", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Bekor</button>
            <button type="submit" style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#2d6a4f", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Saqlash</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── SKOCH TAB ────────────────────────────────────────────────────────────────

function SkochTab() {
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ razmer: "40", soni: "", date: "" });
  const [filter, setFilter] = useState({ start: todayStr(), end: todayStr() });
  const [form, setForm] = useState({ razmer: "40", soni: "", date: todayStr() });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.start) params.start = filter.start;
      if (filter.end) params.end = filter.end;
      const r = await api.get("/api/skoch", { params });
      setList(r.data);
    } catch { showToast("Xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const save = async e => {
    e.preventDefault();
    if (!form.soni || !form.date) { showToast("Barcha maydonlarni to'ldiring", "error"); return; }
    const narxi = SKOCH_PRICES[form.razmer];
    setSaving(true);
    try {
      await api.post("/api/skoch", { razmer: form.razmer, soni: parseInt(form.soni), narxi, date: form.date });
      showToast("Skoch kiritildi");
      setForm(p => ({ ...p, soni: "" }));
      load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
    finally { setSaving(false); }
  };

  const openEdit = l => { setEditItem(l); setEditForm({ razmer: l.razmer, soni: l.soni, date: l.date }); setEditModal(true); };

  const saveEdit = async e => {
    e.preventDefault();
    const narxi = SKOCH_PRICES[editForm.razmer];
    try {
      await api.put(`/api/skoch/${editItem.id}`, { razmer: editForm.razmer, soni: parseInt(editForm.soni), narxi, date: editForm.date });
      showToast("Saqlandi ✅"); setEditModal(false); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato ❌", "error"); }
  };

  const del = async id => {
    if (!window.confirm("Rostan o'chirmoqchimisiz?")) return;
    try { await api.delete(`/api/skoch/${id}`); showToast("O'chirildi ✅"); load(); }
    catch { showToast("Xato ❌", "error"); }
  };

  const total = list.reduce((s, l) => s + Number(l.soni) * Number(l.narxi), 0);
  const autoNarxi = SKOCH_PRICES[form.razmer];

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 3fr", gap: "24px" }}>
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "18px" }}>📦 Skoch kiritish</h3>
        <form onSubmit={save}>
          <Field label="Razmer" required>
            <select value={form.razmer} onChange={e => setForm(p => ({ ...p, razmer: e.target.value }))} style={inp}>
              <option value="40">40 mm</option>
              <option value="32">32 mm</option>
              <option value="28">28 mm</option>
            </select>
          </Field>
          <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", marginBottom: "14px", fontSize: "14px", color: "#1e3a5f" }}>
            💡 Narxi: <strong>{fmt(autoNarxi)} so'm</strong> (avtomatik)
          </div>
          <Field label="Soni (dona)" required>
            <input type="number" value={form.soni} onChange={e => setForm(p => ({ ...p, soni: e.target.value }))} placeholder="0" style={inp} min="1" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Sana" required>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          {form.soni && (
            <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", marginBottom: "12px", fontSize: "14px", color: "#065f46", fontWeight: 600 }}>
              Jami: {fmt(Number(form.soni) * autoNarxi)} so'm
            </div>
          )}
          <SubmitBtn loading={saving}>➕ Qo'shish</SubmitBtn>
        </form>
      </div>
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>Kiritilganlar</h3>
        <DateRangeFilter filter={filter} onChange={setFilter} />
        {loading ? <Spinner /> : (
          <>
            <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Razmer</TH><TH>Narxi</TH><TH>Soni</TH><TH>Jami</TH><TH>Sana</TH><TH>Amallar</TH></tr></thead>
                <tbody>
                  {list.map((l, i) => (
                    <TRow key={l.id} idx={i}>
                      <TD>{l.razmer} mm</TD>
                      <TD>{fmt(l.narxi)} so'm</TD>
                      <TD>{l.soni} dona</TD>
                      <TD><span style={{ fontWeight: 700, color: "#10b981" }}>{fmt(Number(l.soni) * Number(l.narxi))} so'm</span></TD>
                      <TD>{l.date}</TD>
                      <TD><div style={{ display: "flex", gap: "6px" }}>
                        <EditBtn onClick={() => openEdit(l)} />
                        <DelBtn onClick={() => del(l.id)} />
                      </div></TD>
                    </TRow>
                  ))}
                  {!list.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: "28px", color: "#94a3b8" }}>Hali kiritilmagan</td></tr>}
                </tbody>
              </table>
            </div>
            {list.length > 0 && <TotalCard label="Jami" value={total} />}
          </>
        )}
      </div>
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Skochni tahrirlash">
        <form onSubmit={saveEdit}>
          <Field label="Razmer" required>
            <select value={editForm.razmer} onChange={e => setEditForm(p => ({ ...p, razmer: e.target.value }))} style={inp}>
              <option value="40">40 mm</option><option value="32">32 mm</option><option value="28">28 mm</option>
            </select>
          </Field>
          <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", marginBottom: "14px", fontSize: "14px", color: "#1e3a5f" }}>
            💡 Narxi: <strong>{fmt(SKOCH_PRICES[editForm.razmer])} so'm</strong>
          </div>
          <Field label="Soni (dona)" required>
            <input type="number" value={editForm.soni} onChange={e => setEditForm(p => ({ ...p, soni: e.target.value }))} style={inp} min="1" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Sana" required>
            <input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button type="button" onClick={() => setEditModal(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f1f5f9", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Bekor</button>
            <button type="submit" style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#2d6a4f", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Saqlash</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── MATERIAL TAB ─────────────────────────────────────────────────────────────

function MaterialTab() {
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", quantity_rolls: "", length_meters: "", date: "" });
  const [filter, setFilter] = useState({ start: todayStr(), end: todayStr() });
  const [form, setForm] = useState({ name: "", quantity_rolls: "", length_meters: "", date: todayStr() });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.start) params.start = filter.start;
      if (filter.end) params.end = filter.end;
      const r = await api.get("/api/materials", { params });
      setList(r.data);
    } catch { showToast("Xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const save = async e => {
    e.preventDefault();
    if (!form.name || !form.quantity_rolls || !form.length_meters) { showToast("Barcha maydonlarni to'ldiring", "error"); return; }
    setSaving(true);
    try {
      await api.post("/api/materials", { name: form.name, quantity_rolls: parseInt(form.quantity_rolls), length_meters: parseFloat(form.length_meters), date: form.date });
      showToast("Material kiritildi");
      setForm({ name: "", quantity_rolls: "", length_meters: "", date: todayStr() });
      load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
    finally { setSaving(false); }
  };

  const openEdit = m => { setEditItem(m); setEditForm({ name: m.name, quantity_rolls: m.quantity_rolls, length_meters: m.length_meters, date: m.date }); setEditModal(true); };

  const saveEdit = async e => {
    e.preventDefault();
    try {
      await api.put(`/api/materials/${editItem.id}`, { name: editForm.name, quantity_rolls: parseInt(editForm.quantity_rolls), length_meters: parseFloat(editForm.length_meters), date: editForm.date });
      showToast("Saqlandi ✅"); setEditModal(false); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato ❌", "error"); }
  };

  const del = async id => {
    if (!window.confirm("Rostan o'chirmoqchimisiz?")) return;
    try { await api.delete(`/api/materials/${id}`); showToast("O'chirildi ✅"); load(); }
    catch { showToast("Xato ❌", "error"); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 3fr", gap: "24px" }}>
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "18px" }}>🧵 Material kiritish</h3>
        <form onSubmit={save}>
          <Field label="Nomi" required>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Material nomi" style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Rulon soni" required>
            <input type="number" value={form.quantity_rolls} onChange={e => setForm(p => ({ ...p, quantity_rolls: e.target.value }))} placeholder="0" style={inp} min="1" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Uzunlik (m)" required>
            <input type="number" value={form.length_meters} onChange={e => setForm(p => ({ ...p, length_meters: e.target.value }))} placeholder="0" style={inp} min="0" step="0.1" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Sana" required>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <SubmitBtn loading={saving}>➕ Qo'shish</SubmitBtn>
        </form>
      </div>
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>Kiritilganlar</h3>
        <DateRangeFilter filter={filter} onChange={setFilter} />
        {loading ? <Spinner /> : (
          <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Nomi</TH><TH>Rulon</TH><TH>Uzunlik</TH><TH>Sana</TH><TH>Amallar</TH></tr></thead>
              <tbody>
                {list.map((m, i) => (
                  <TRow key={m.id} idx={i}>
                    <TD>{m.name}</TD><TD>{m.quantity_rolls} ta</TD>
                    <TD>{m.length_meters} m</TD><TD>{m.date}</TD>
                    <TD><div style={{ display: "flex", gap: "6px" }}>
                      <EditBtn onClick={() => openEdit(m)} />
                      <DelBtn onClick={() => del(m.id)} />
                    </div></TD>
                  </TRow>
                ))}
                {!list.length && <tr><td colSpan={5} style={{ textAlign: "center", padding: "28px", color: "#94a3b8" }}>Hali kiritilmagan</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Materialni tahrirlash">
        <form onSubmit={saveEdit}>
          <Field label="Nomi" required>
            <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Rulon soni" required>
            <input type="number" value={editForm.quantity_rolls} onChange={e => setEditForm(p => ({ ...p, quantity_rolls: e.target.value }))} style={inp} min="1" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Uzunlik (m)" required>
            <input type="number" value={editForm.length_meters} onChange={e => setEditForm(p => ({ ...p, length_meters: e.target.value }))} style={inp} min="0" step="0.1" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Sana" required>
            <input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button type="button" onClick={() => setEditModal(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f1f5f9", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Bekor</button>
            <button type="submit" style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#2d6a4f", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Saqlash</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── TOSH TAB ─────────────────────────────────────────────────────────────────

function ToshTab() {
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ turi: "", soni: "", narxi: "", date: "" });
  const [filter, setFilter] = useState({ start: todayStr(), end: todayStr() });
  const [form, setForm] = useState({ turi: "", soni: "", narxi: "", date: todayStr() });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.start) params.start = filter.start;
      if (filter.end) params.end = filter.end;
      const r = await api.get("/api/tosh", { params });
      setList(r.data);
    } catch { showToast("Xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const save = async e => {
    e.preventDefault();
    if (!form.turi || !form.soni || !form.narxi) { showToast("Barcha maydonlarni to'ldiring", "error"); return; }
    setSaving(true);
    try {
      await api.post("/api/tosh", { turi: form.turi, soni: parseInt(form.soni), narxi: parseFloat(form.narxi), date: form.date });
      showToast("Tosh kiritildi");
      setForm(p => ({ ...p, turi: "", soni: "", narxi: "" }));
      load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato", "error"); }
    finally { setSaving(false); }
  };

  const openEdit = l => { setEditItem(l); setEditForm({ turi: l.turi, soni: l.soni, narxi: l.narxi, date: l.date }); setEditModal(true); };

  const saveEdit = async e => {
    e.preventDefault();
    try {
      await api.put(`/api/tosh/${editItem.id}`, { turi: editForm.turi, soni: parseInt(editForm.soni), narxi: parseFloat(editForm.narxi), date: editForm.date });
      showToast("Saqlandi ✅"); setEditModal(false); load();
    } catch (e) { showToast(e.response?.data?.detail || "Xato ❌", "error"); }
  };

  const del = async id => {
    if (!window.confirm("Rostan o'chirmoqchimisiz?")) return;
    try { await api.delete(`/api/tosh/${id}`); showToast("O'chirildi ✅"); load(); }
    catch { showToast("Xato ❌", "error"); }
  };

  const total = list.reduce((s, l) => s + Number(l.soni) * Number(l.narxi), 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 3fr", gap: "24px" }}>
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "18px" }}>🪨 Tosh kiritish</h3>
        <form onSubmit={save}>
          <Field label="Turi" required>
            <input type="text" value={form.turi} onChange={e => setForm(p => ({ ...p, turi: e.target.value }))} placeholder="Tosh turi" style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Soni (pachka)" required>
            <input type="number" value={form.soni} onChange={e => setForm(p => ({ ...p, soni: e.target.value }))} placeholder="0" style={inp} min="1" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Narxi (so'm)" required>
            <input type="number" value={form.narxi} onChange={e => setForm(p => ({ ...p, narxi: e.target.value }))} placeholder="0" style={inp} min="0" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Sana" required>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          {form.soni && form.narxi && (
            <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", marginBottom: "12px", fontSize: "14px", color: "#065f46", fontWeight: 600 }}>
              Jami: {fmt(Number(form.soni) * Number(form.narxi))} so'm
            </div>
          )}
          <SubmitBtn loading={saving}>➕ Qo'shish</SubmitBtn>
        </form>
      </div>
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>Kiritilganlar</h3>
        <DateRangeFilter filter={filter} onChange={setFilter} />
        {loading ? <Spinner /> : (
          <>
            <div style={{ overflowX: "auto", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Turi</TH><TH>Soni</TH><TH>Narxi</TH><TH>Jami</TH><TH>Sana</TH><TH>Amallar</TH></tr></thead>
                <tbody>
                  {list.map((l, i) => (
                    <TRow key={l.id} idx={i}>
                      <TD>{l.turi}</TD><TD>{l.soni} pachka</TD>
                      <TD>{fmt(l.narxi)} so'm</TD>
                      <TD><span style={{ fontWeight: 700, color: "#10b981" }}>{fmt(Number(l.soni) * Number(l.narxi))} so'm</span></TD>
                      <TD>{l.date}</TD>
                      <TD><div style={{ display: "flex", gap: "6px" }}>
                        <EditBtn onClick={() => openEdit(l)} />
                        <DelBtn onClick={() => del(l.id)} />
                      </div></TD>
                    </TRow>
                  ))}
                  {!list.length && <tr><td colSpan={6} style={{ textAlign: "center", padding: "28px", color: "#94a3b8" }}>Hali kiritilmagan</td></tr>}
                </tbody>
              </table>
            </div>
            {list.length > 0 && <TotalCard label="Bugungi jami" value={total} />}
          </>
        )}
      </div>
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Toshni tahrirlash">
        <form onSubmit={saveEdit}>
          <Field label="Turi" required>
            <input type="text" value={editForm.turi} onChange={e => setEditForm(p => ({ ...p, turi: e.target.value }))} style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Soni (pachka)" required>
            <input type="number" value={editForm.soni} onChange={e => setEditForm(p => ({ ...p, soni: e.target.value }))} style={inp} min="1" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Narxi (so'm)" required>
            <input type="number" value={editForm.narxi} onChange={e => setEditForm(p => ({ ...p, narxi: e.target.value }))} style={inp} min="0" required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <Field label="Sana" required>
            <input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} style={inp} required
              onFocus={e => e.target.style.borderColor = "#2d6a4f"} onBlur={e => e.target.style.borderColor = "#cbd5e1"} />
          </Field>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button type="button" onClick={() => setEditModal(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f1f5f9", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Bekor</button>
            <button type="submit" style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#2d6a4f", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>Saqlash</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── FIELDS TAB (Sales: faqat ko'rish) ───────────────────────────────────────

function FieldsTab() {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/api/fields", { params: { panel: "sales" } }); setList(Array.isArray(r.data) ? r.data : []); }
    catch { showToast("Maydonlarni olishda xato", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const TH2 = ({ children }) => <th style={{ padding: "11px 14px", textAlign: "left", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: "13px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{children}</th>;
  const TD2 = ({ children }) => <td style={{ padding: "10px 14px", fontSize: "14px", color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}>{children}</td>;

  return (
    <div>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b", marginBottom: "20px" }}>📋 Forma maydonlari</h2>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <div style={{ width: "36px", height: "36px", border: "4px solid #e2e8f0", borderTopColor: "#2d6a4f", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><TH2>Nomi</TH2><TH2>Label</TH2><TH2>Turi</TH2><TH2>Majburiy</TH2></tr></thead>
            <tbody>
              {list.map((f, i) => (
                <tr key={f.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <TD2>{f.name}</TD2>
                  <TD2>{f.label}</TD2>
                  <TD2><span style={{ padding: "3px 8px", background: "#f0fdf4", color: "#2d6a4f", borderRadius: "6px", fontSize: "12px" }}>{f.field_type}</span></TD2>
                  <TD2>{f.is_required ? "✅" : "—"}</TD2>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={4} style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Ma'lumot yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MAIN SALES PAGE ──────────────────────────────────────────────────────────

const SIDEBAR_TABS = [
  { id: "ip", icon: "🪡", label: "Ip" },
  { id: "skoch", icon: "📦", label: "Skoch" },
  { id: "material", icon: "🧵", label: "Material" },
  { id: "tosh", icon: "🪨", label: "Tosh" },
  { id: "fields", icon: "📋", label: "Forma maydonlari" },
];

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState("ip");
  const isMobile = useIsMobile();

  const renderTab = () => {
    switch (activeTab) {
      case "ip": return <IpTab />;
      case "skoch": return <SkochTab />;
      case "material": return <MaterialTab />;
      case "tosh": return <ToshTab />;
      case "fields": return <FieldsTab />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f0f4f8" }}>
      <Navbar title="Sales Panel" />
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
