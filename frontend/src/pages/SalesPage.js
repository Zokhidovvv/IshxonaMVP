import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useToast } from "../components/Toast";
import api from "../services/api";
import * as XLSX from "xlsx";

// ─── KONSTANTLAR ─────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = n => Number(n || 0).toLocaleString();
const fmtSum = n => Number(n || 0).toLocaleString() + " so'm";

const TYPES = [
  { value: "ip", label: "Ip" },
  { value: "skoch", label: "Skoch" },
  { value: "material", label: "Material" },
  { value: "tosh", label: "Tosh" },
];
const TYPE_LABELS = { ip: "Ip", skoch: "Skoch", material: "Material", tosh: "Tosh" };
const TYPE_COLORS = { ip: "#3b82f6", skoch: "#10b981", material: "#8b5cf6", tosh: "#f59e0b" };
const IP_COLORS = ["Qora", "Oq", "Qizil", "Yashil", "Ko'k", "Sariq", "Pushti", "Jigarrang", "Kulrang", "Boshqa"];
const SKOCH_SIZES = ["40mm", "32mm", "28mm"];
const SKOCH_PRICES = { "40mm": 130000, "32mm": 100000, "28mm": 100000 };

const emptyForm = () => ({
  date: todayStr(),
  type: "ip",
  detail: "Qora",
  soni: "",
  narxi: "",
  notes: "",
});

function getDefaultDetail(type) {
  if (type === "ip") return "Qora";
  if (type === "skoch") return "40mm";
  return "";
}

function getDefaultPrice(type, detail) {
  if (type === "skoch" && SKOCH_PRICES[detail]) return SKOCH_PRICES[detail];
  return "";
}

// ─── YORDAMCHI KOMPONENTLAR ───────────────────────────────────────────────────
function useIsMobile() {
  const [v, setV] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setV(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return v;
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
      <div style={{ width: "36px", height: "36px", border: "4px solid #e2e8f0", borderTopColor: "#2d6a4f", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

function TypeBadge({ type }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: "12px",
      fontSize: "12px", fontWeight: 700,
      background: TYPE_COLORS[type] + "20", color: TYPE_COLORS[type],
      border: `1px solid ${TYPE_COLORS[type]}40`
    }}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

// Tafsilot maydoni (tur ga qarab)
function DetailInput({ type, value, onChange, style }) {
  const s = { ...cellInp, ...style };
  if (type === "ip") {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={s}>
        {IP_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    );
  }
  if (type === "skoch") {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={s}>
        {SKOCH_SIZES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    );
  }
  return (
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={type === "tosh" ? "Turi..." : "Nomi..."}
      style={s}
    />
  );
}

// ─── FILTER BAR ───────────────────────────────────────────────────────────────
function FilterBar({ filter, onChange, isMobile }) {
  const today = todayStr();
  const getRange = (preset) => {
    const d = new Date();
    if (preset === "today") return { from: today, to: today };
    if (preset === "week") {
      const w = new Date(d); w.setDate(d.getDate() - 6);
      return { from: w.toISOString().split("T")[0], to: today };
    }
    if (preset === "month") return { from: `${today.slice(0, 7)}-01`, to: today };
    if (preset === "year") return { from: `${today.slice(0, 4)}-01-01`, to: today };
    return { from: "", to: "" };
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
      {/* Date presets */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {[
          { key: "all", label: "Hammasi" },
          { key: "today", label: "Bugun" },
          { key: "week", label: "Hafta" },
          { key: "month", label: "Oy" },
          { key: "year", label: "Yil" },
        ].map(p => (
          <button key={p.key} onClick={() => {
            const r = getRange(p.key);
            onChange({ ...filter, datePreset: p.key, from: r.from, to: r.to });
          }} style={{
            padding: "6px 12px", borderRadius: "6px", border: "none",
            fontWeight: 600, fontSize: "13px", cursor: "pointer",
            background: filter.datePreset === p.key ? "#2d6a4f" : "#f1f5f9",
            color: filter.datePreset === p.key ? "#fff" : "#475569",
            minHeight: "36px",
          }}>{p.label}</button>
        ))}
      </div>
      {/* Custom date range */}
      <input type="date" value={filter.from} onChange={e => onChange({ ...filter, datePreset: "custom", from: e.target.value })}
        style={dateInp} title="Dan" />
      <span style={{ color: "#94a3b8", fontSize: "13px" }}>—</span>
      <input type="date" value={filter.to} onChange={e => onChange({ ...filter, datePreset: "custom", to: e.target.value })}
        style={dateInp} title="Gacha" />
      {/* Type filter */}
      <select value={filter.typeFilter} onChange={e => onChange({ ...filter, typeFilter: e.target.value })} style={{ ...dateInp, minWidth: "110px" }}>
        <option value="">Barcha tur</option>
        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      {/* Search */}
      <input type="text" value={filter.search} onChange={e => onChange({ ...filter, search: e.target.value })}
        placeholder="🔍 Qidirish..."
        style={{ ...dateInp, minWidth: isMobile ? "140px" : "180px" }} />
    </div>
  );
}

// ─── ASOSIY PURCHASES TABLE ───────────────────────────────────────────────────
export function PurchasesTable({ showNav = false }) {
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null); // null | "new" | number
  const [editForm, setEditForm] = useState(emptyForm());
  const [filter, setFilter] = useState({ datePreset: "month", from: `${todayStr().slice(0, 7)}-01`, to: todayStr(), typeFilter: "", search: "" });
  const [sort, setSort] = useState({ key: "date", dir: -1 });
  const rowRef = useRef(null);
  const importRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.from) params.start = filter.from;
      if (filter.to) params.end = filter.to;
      if (filter.typeFilter) params.type = filter.typeFilter;
      const r = await api.get("/api/purchases", { params });
      setRows(Array.isArray(r.data) ? r.data : []);
    } catch { showToast("Ma'lumotlarni olishda xato", "error"); }
    finally { setLoading(false); }
  }, [filter.from, filter.to, filter.typeFilter]);

  useEffect(() => { load(); }, [load]);

  // ─── FILTER + SORT ────────────────────────────────────────────────────────
  const filtered = rows.filter(r => {
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const hay = `${r.date} ${TYPE_LABELS[r.type] || r.type} ${r.detail || ""} ${r.notes || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sort.key] ?? "", bv = b[sort.key] ?? "";
    if (av < bv) return -sort.dir;
    if (av > bv) return sort.dir;
    return 0;
  });

  const toggleSort = key => setSort(p => ({ key, dir: p.key === key ? -p.dir : 1 }));
  const sortIcon = key => sort.key === key ? (sort.dir === 1 ? " ▲" : " ▼") : " ·";

  // ─── TOTALS ───────────────────────────────────────────────────────────────
  const totals = sorted.reduce((acc, r) => {
    const s = Number(r.narxi) * Number(r.soni);
    acc.count++;
    acc.sum += s;
    if (!acc.byType[r.type]) acc.byType[r.type] = { count: 0, sum: 0 };
    acc.byType[r.type].count++;
    acc.byType[r.type].sum += s;
    return acc;
  }, { count: 0, sum: 0, byType: {} });

  // ─── EDIT FORM ────────────────────────────────────────────────────────────
  const startNew = () => {
    const f = emptyForm();
    setEditForm(f);
    setEditingId("new");
    setTimeout(() => rowRef.current?.querySelector("input,select")?.focus(), 50);
  };

  const startEdit = (row) => {
    setEditForm({
      date: row.date,
      type: row.type,
      detail: row.detail || "",
      soni: row.soni,
      narxi: row.narxi,
      notes: row.notes || "",
    });
    setEditingId(row.id);
    setTimeout(() => rowRef.current?.querySelector("input,select")?.focus(), 50);
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(emptyForm()); };

  const handleTypeChange = (type) => {
    const detail = getDefaultDetail(type);
    const narxi = getDefaultPrice(type, detail);
    setEditForm(p => ({ ...p, type, detail, narxi: narxi || p.narxi }));
  };

  const handleDetailChange = (detail) => {
    const narxi = getDefaultPrice(editForm.type, detail);
    setEditForm(p => ({ ...p, detail, narxi: narxi || p.narxi }));
  };

  const saveRow = async () => {
    if (!editForm.date || !editForm.type || !editForm.soni || !editForm.narxi) {
      showToast("Sana, tur, soni va narxni to'ldiring", "error"); return;
    }
    setSaving(true);
    try {
      const body = {
        date: editForm.date,
        type: editForm.type,
        detail: editForm.detail || null,
        soni: parseInt(editForm.soni),
        narxi: parseFloat(editForm.narxi),
        notes: editForm.notes || null,
      };
      if (editingId === "new") {
        await api.post("/api/purchases", body);
        showToast("Qo'shildi ✅");
      } else {
        await api.put(`/api/purchases/${editingId}`, body);
        showToast("Yangilandi ✅");
      }
      setEditingId(null);
      setEditForm(emptyForm());
      load();
    } catch (e) {
      showToast(e.response?.data?.detail || "Xato ❌", "error");
    } finally { setSaving(false); }
  };

  const deleteRow = async (id) => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/api/purchases/${id}`);
      showToast("O'chirildi");
      load();
    } catch { showToast("O'chirishda xato", "error"); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); saveRow(); }
    if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
  };

  // Click outside row to save
  const handleRowBlur = (e) => {
    if (rowRef.current && !rowRef.current.contains(e.relatedTarget)) {
      if (editForm.soni && editForm.narxi) saveRow();
      else cancelEdit();
    }
  };

  // ─── EXCEL EKSPORT ────────────────────────────────────────────────────────
  const exportExcel = () => {
    const headers = ["№", "Sana", "Tur", "Tafsilot", "Soni", "Narxi (so'm)", "Jami (so'm)", "Izoh"];
    const data = sorted.map((r, i) => [
      i + 1,
      r.date,
      TYPE_LABELS[r.type] || r.type,
      r.detail || "-",
      r.soni,
      Number(r.narxi),
      Number(r.narxi) * Number(r.soni),
      r.notes || "",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws["!cols"] = [{ wch: 4 }, { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 20 }];
    // Header bold
    headers.forEach((_, ci) => {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: ci })];
      if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: "2D6A4F" } }, font2: { color: { rgb: "FFFFFF" } } };
    });
    // Total row
    const totalRow = ["", "", "JAMI", "", totals.count, "", totals.sum, ""];
    XLSX.utils.sheet_add_aoa(ws, [totalRow], { origin: data.length + 1 });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Xaridlar");
    XLSX.writeFile(wb, `xaridlar_${todayStr()}.xlsx`);
  };

  // ─── EXCEL IMPORT ─────────────────────────────────────────────────────────
  const importExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const rows = data.slice(1).filter(r => r.length >= 5 && r[0] && r[1]);
        if (!rows.length) { showToast("Ma'lumot topilmadi", "error"); return; }
        let ok = 0, err = 0;
        for (const r of rows) {
          // Format: Sana | Tur | Tafsilot | Soni | Narxi | Izoh
          const [sana, tur, tafsilot, soni, narxi, izoh] = r;
          const typeMap = { ip: "ip", skoch: "skoch", material: "material", tosh: "tosh", "Ip": "ip", "Skoch": "skoch", "Material": "material", "Tosh": "tosh" };
          const type = typeMap[String(tur).trim()] || "ip";
          const dateVal = typeof sana === "number"
            ? new Date(Math.round((sana - 25569) * 86400 * 1000)).toISOString().split("T")[0]
            : String(sana).trim();
          try {
            await api.post("/api/purchases", {
              date: dateVal,
              type,
              detail: String(tafsilot || "").trim() || null,
              soni: parseInt(soni) || 1,
              narxi: parseFloat(narxi) || 0,
              notes: String(izoh || "").trim() || null,
            });
            ok++;
          } catch { err++; }
        }
        showToast(`${ok} ta qo'shildi${err ? `, ${err} ta xato` : ""}`);
        load();
      } catch { showToast("Faylni o'qishda xato", "error"); }
      e.target.value = "";
    };
    reader.readAsBinaryString(file);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  const cellStyle = {
    padding: "0 8px", height: "42px", borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #f1f5f9", fontSize: "15px", color: "#1e293b",
    whiteSpace: "nowrap",
  };
  const editCellStyle = { ...cellStyle, padding: "4px 6px", background: "#fffbeb" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* ── Toolbar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>🛒 Xaridlar</h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => window.print()} style={outlineBtn}>🖨️ Chop etish</button>
          <button onClick={() => importRef.current?.click()} style={outlineBtn}>📤 Import</button>
          <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={importExcel} />
          <button onClick={exportExcel} style={outlineBtn}>📥 Export</button>
          <button onClick={startNew} disabled={editingId !== null} style={primaryBtn}>
            ➕ Yangi qator
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <FilterBar filter={filter} onChange={setFilter} isMobile={isMobile} />

      {/* ── Table ── */}
      {loading ? <Spinner /> : (
        <div style={{ flex: 1, overflowX: "auto", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "750px" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
              <tr>
                <th style={thStyle}>№</th>
                {[
                  { key: "date", label: "Sana" },
                  { key: "type", label: "Tur" },
                  { key: "detail", label: "Tafsilot" },
                  { key: "soni", label: "Soni" },
                  { key: "narxi", label: "Narxi" },
                ].map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)} style={{ ...thStyle, cursor: "pointer", userSelect: "none", color: sort.key === col.key ? "#2d6a4f" : "#64748b" }}>
                    {col.label}{sortIcon(col.key)}
                  </th>
                ))}
                <th style={thStyle}>Jami</th>
                <th style={thStyle}>Izoh</th>
                <th style={{ ...thStyle, textAlign: "center" }}>⚙️</th>
              </tr>
            </thead>
            <tbody>
              {/* Yangi qator */}
              {editingId === "new" && (
                <tr ref={rowRef} onBlur={handleRowBlur} onKeyDown={handleKeyDown} style={{ background: "#fffbeb", outline: "2px solid #f59e0b", outlineOffset: "-2px" }}>
                  <td style={editCellStyle} />
                  <td style={editCellStyle}>
                    <input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} style={cellInp} />
                  </td>
                  <td style={editCellStyle}>
                    <select value={editForm.type} onChange={e => handleTypeChange(e.target.value)} style={cellInp}>
                      {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </td>
                  <td style={editCellStyle}>
                    <DetailInput type={editForm.type} value={editForm.detail} onChange={handleDetailChange} />
                  </td>
                  <td style={editCellStyle}>
                    <input type="number" value={editForm.soni} onChange={e => setEditForm(p => ({ ...p, soni: e.target.value }))} placeholder="0" min="1" style={cellInp} />
                  </td>
                  <td style={editCellStyle}>
                    <input type="number" value={editForm.narxi} onChange={e => setEditForm(p => ({ ...p, narxi: e.target.value }))} placeholder="0" min="0" style={cellInp} />
                  </td>
                  <td style={{ ...editCellStyle, color: "#2d6a4f", fontWeight: 700 }}>
                    {editForm.soni && editForm.narxi ? fmt(editForm.soni * editForm.narxi) : "—"}
                  </td>
                  <td style={editCellStyle}>
                    <input type="text" value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} placeholder="Izoh..." style={cellInp} />
                  </td>
                  <td style={{ ...editCellStyle, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                      <button onClick={saveRow} disabled={saving} style={saveBtn}>✓</button>
                      <button onClick={cancelEdit} style={cancelBtn}>✗</button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Mavjud qatorlar */}
              {sorted.map((row, i) => {
                const isEdit = editingId === row.id;
                const total = Number(row.narxi) * Number(row.soni);
                const bg = isEdit ? "#fffbeb" : i % 2 === 0 ? "#fff" : "#f8fafc";
                return (
                  <tr
                    key={row.id}
                    ref={isEdit ? rowRef : null}
                    onBlur={isEdit ? handleRowBlur : undefined}
                    onKeyDown={isEdit ? handleKeyDown : undefined}
                    onDoubleClick={!isEdit && editingId === null ? () => startEdit(row) : undefined}
                    style={{ background: bg, cursor: isEdit ? "default" : "pointer", transition: "background 0.1s" }}
                  >
                    <td style={{ ...cellStyle, color: "#94a3b8", textAlign: "center", width: "40px" }}>{i + 1}</td>

                    {isEdit ? (
                      <>
                        <td style={editCellStyle}>
                          <input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} style={cellInp} />
                        </td>
                        <td style={editCellStyle}>
                          <select value={editForm.type} onChange={e => handleTypeChange(e.target.value)} style={cellInp}>
                            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </td>
                        <td style={editCellStyle}>
                          <DetailInput type={editForm.type} value={editForm.detail} onChange={handleDetailChange} />
                        </td>
                        <td style={editCellStyle}>
                          <input type="number" value={editForm.soni} onChange={e => setEditForm(p => ({ ...p, soni: e.target.value }))} min="1" style={cellInp} />
                        </td>
                        <td style={editCellStyle}>
                          <input type="number" value={editForm.narxi} onChange={e => setEditForm(p => ({ ...p, narxi: e.target.value }))} min="0" style={cellInp} />
                        </td>
                        <td style={{ ...editCellStyle, color: "#2d6a4f", fontWeight: 700 }}>
                          {editForm.soni && editForm.narxi ? fmt(editForm.soni * editForm.narxi) : "—"}
                        </td>
                        <td style={editCellStyle}>
                          <input type="text" value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} placeholder="Izoh..." style={cellInp} />
                        </td>
                        <td style={{ ...editCellStyle, textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button onClick={saveRow} disabled={saving} style={saveBtn}>✓</button>
                            <button onClick={cancelEdit} style={cancelBtn}>✗</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={cellStyle}>{row.date}</td>
                        <td style={cellStyle}><TypeBadge type={row.type} /></td>
                        <td style={cellStyle}>{row.detail || "—"}</td>
                        <td style={{ ...cellStyle, textAlign: "right" }}>{fmt(row.soni)}</td>
                        <td style={{ ...cellStyle, textAlign: "right" }}>{fmt(row.narxi)}</td>
                        <td style={{ ...cellStyle, textAlign: "right", fontWeight: 700, color: "#2d6a4f" }}>{fmt(total)}</td>
                        <td style={{ ...cellStyle, color: "#64748b", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis" }}>{row.notes || ""}</td>
                        <td style={{ ...cellStyle, textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button onClick={e => { e.stopPropagation(); startEdit(row); }} style={editBtn} title="Tahrirlash">✏️</button>
                            <button onClick={e => { e.stopPropagation(); deleteRow(row.id); }} style={delBtn} title="O'chirish">🗑️</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}

              {!sorted.length && !loading && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: "15px" }}>
                    {filter.search || filter.typeFilter ? "Qidiruv bo'yicha topilmadi" : "Ma'lumot yo'q"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer totals ── */}
      {!loading && sorted.length > 0 && (
        <div style={{ marginTop: "14px", padding: "14px 18px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "15px" }}>Jami xaridlar: </span>
              <span style={{ fontWeight: 800, color: "#2d6a4f", fontSize: "17px" }}>{totals.count} ta</span>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "15px" }}>Umumiy summa: </span>
              <span style={{ fontWeight: 800, color: "#2d6a4f", fontSize: "17px" }}>{fmt(totals.sum)} so'm</span>
            </div>
            {TYPES.map(t => totals.byType[t.value] && (
              <div key={t.value} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <TypeBadge type={t.value} />
                <span style={{ color: "#475569", fontSize: "14px" }}>
                  {totals.byType[t.value].count} ta — {fmt(totals.byType[t.value].sum)} so'm
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          nav, aside, button, .no-print { display: none !important; }
          body { background: white !important; }
          table { font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}

// ─── SALES PAGE ───────────────────────────────────────────────────────────────
const SIDEBAR_TABS = [
  { id: "purchases", icon: "🛒", label: "Xaridlar" },
];

export default function SalesPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f0f4f8" }}>
      <Navbar title="Xaridlar" />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 24px", paddingBottom: "24px" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "24px", minHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
            <PurchasesTable />
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const thStyle = {
  padding: "12px 10px", textAlign: "left",
  background: "#f8fafc", color: "#64748b",
  fontWeight: 700, fontSize: "14px",
  borderBottom: "2px solid #e2e8f0",
  borderRight: "1px solid #f1f5f9",
  whiteSpace: "nowrap",
};

const cellInp = {
  width: "100%", padding: "6px 8px",
  border: "1.5px solid #cbd5e1", borderRadius: "6px",
  fontSize: "14px", outline: "none", color: "#1e293b",
  background: "#fff", boxSizing: "border-box",
  height: "34px",
};

const dateInp = {
  padding: "6px 10px", borderRadius: "7px",
  border: "1.5px solid #cbd5e1", fontSize: "13px",
  outline: "none", color: "#1e293b", background: "#fff",
  cursor: "pointer",
};

const primaryBtn = {
  padding: "8px 16px", borderRadius: "8px",
  border: "none", fontWeight: 700, fontSize: "14px",
  cursor: "pointer", background: "#2d6a4f", color: "#fff",
  minHeight: "38px",
};

const outlineBtn = {
  padding: "8px 14px", borderRadius: "8px",
  border: "1.5px solid #cbd5e1", fontWeight: 600, fontSize: "13px",
  cursor: "pointer", background: "#fff", color: "#475569",
  minHeight: "38px",
};

const saveBtn = {
  padding: "6px 10px", borderRadius: "6px", border: "none",
  fontWeight: 700, fontSize: "14px", cursor: "pointer",
  background: "#2d6a4f", color: "#fff", minHeight: "32px",
};

const cancelBtn = {
  padding: "6px 10px", borderRadius: "6px", border: "none",
  fontWeight: 700, fontSize: "14px", cursor: "pointer",
  background: "#f1f5f9", color: "#64748b", minHeight: "32px",
};

const editBtn = {
  padding: "5px 9px", borderRadius: "5px", border: "none",
  fontSize: "13px", cursor: "pointer",
  background: "#dbeafe", color: "#2563eb", minHeight: "30px",
};

const delBtn = {
  padding: "5px 9px", borderRadius: "5px", border: "none",
  fontSize: "13px", cursor: "pointer",
  background: "#fee2e2", color: "#ef4444", minHeight: "30px",
};
