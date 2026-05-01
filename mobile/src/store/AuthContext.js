import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("user").then((raw) => {
      if (raw) setUser(JSON.parse(raw));
      setLoading(false);
    });
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/api/auth/login", { username, password });
    const { access_token, role } = res.data;
    await AsyncStorage.setItem("token", access_token);
    await AsyncStorage.setItem("user", JSON.stringify({ username, role }));
    setUser({ username, role });
    return role;
  };

  const logout = async () => {
    await AsyncStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
