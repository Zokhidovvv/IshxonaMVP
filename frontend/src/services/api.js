import axios from "axios";

const BASE_URL = "https://factory-api-t3cb.onrender.com";

const api = axios.create({ baseURL: BASE_URL });

// Har bir so'rovga token qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 bo'lsa login sahifasiga yuborish
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
