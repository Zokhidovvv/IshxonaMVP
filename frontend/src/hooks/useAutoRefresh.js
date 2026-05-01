import { useEffect } from "react";

export function useAutoRefresh(callback, ms = 30000) {
  useEffect(() => {
    callback();
    const timer = setInterval(callback, ms);
    return () => clearInterval(timer);
  }, []);
}
