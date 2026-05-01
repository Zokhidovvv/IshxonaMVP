export default function Modal({ open, onClose, title, children, maxWidth = "500px" }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", backdropFilter: "blur(2px)"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "14px",
          padding: "28px", width: "100%", maxWidth,
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "fadeIn 0.2s ease"
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px"
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9", border: "none", cursor: "pointer",
              width: "32px", height: "32px", borderRadius: "50%",
              fontSize: "18px", color: "#64748b", display: "flex",
              alignItems: "center", justifyContent: "center",
              lineHeight: 1
            }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
