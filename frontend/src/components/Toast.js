import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => {
      setToasts(p => p.filter(t => t.id !== id));
    }, type === "error" ? 5000 : 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: "fixed", bottom: "24px", right: "24px",
        zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px",
        pointerEvents: "none"
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: "14px 20px",
            borderRadius: "10px",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            background: t.type === "error" ? "#ef4444" : t.type === "warning" ? "#f59e0b" : "#10b981",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            animation: "slideInRight 0.3s ease",
            maxWidth: "360px",
            wordBreak: "break-word",
            pointerEvents: "auto"
          }}>
            {t.type === "error" ? "❌ " : t.type === "warning" ? "⚠️ " : "✅ "}{t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
