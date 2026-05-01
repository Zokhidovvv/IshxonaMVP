import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (username, password) => {
    const res = await api.post("/api/auth/login", { username, password });
    const { access_token, role } = res.data;
    localStorage.setItem("token", access_token);
    localStorage.setItem("user", JSON.stringify({ username, role }));
    setUser({ username, role });
    return role;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
