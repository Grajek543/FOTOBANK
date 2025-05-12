import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000",
});

/* interceptor – przed każdym żądaniem dopina token */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");   // ← tak przechowywałeś po logowaniu
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;          // export domyślny
export { api };
