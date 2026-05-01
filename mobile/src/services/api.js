import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ Bu yerga serveringiz manzilini yozing
const BASE_URL = "http://192.168.1.100:8000";

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.clear();
    }
    return Promise.reject(err);
  }
);

export default api;
