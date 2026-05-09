import { useState, useEffect } from "react";

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

export default function Modal({ open, onClose, title, children, maxWidth = "500px" }) {
  const isMobile = useIsMobile();
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? "0" : "20px",
        backdropFilter: "blur(2px)"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: isMobile ? "20px 20px 0 0" : "14px",
          padding: isMobile ? "20px 16px 32px" : "28px",
          width: "100%",
          maxWidth: isMobile ? "100%" : maxWidth,
          maxHeight: isMobile ? "92vh" : "90vh",
          overflowY: "auto",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.18)",
          animation: isMobile ? "slideUp 0.25s ease" : "fadeIn 0.2s ease"
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: isMobile ? "16px" : "24px"
        }}>
          <h2 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 700, color: "#1e293b" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9", border: "none", cursor: "pointer",
              width: "36px", height: "36px", borderRadius: "50%",
              fontSize: "20px", color: "#64748b", display: "flex",
              alignItems: "center", justifyContent: "center",
              lineHeight: 1, flexShrink: 0
            }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
