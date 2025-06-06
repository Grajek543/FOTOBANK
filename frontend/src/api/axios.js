// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000",
});

// Interceptor dodający token w nagłówku
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Flaga, by nie wywoływać wielokrotnego pokazywania modala
let isLoggingOut = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jeżeli to 401 z endpointu /users/login, po prostu odrzucamy błąd
    const reqUrl = error.config?.url || "";
    if (
      error.response?.status === 401 &&
      reqUrl.endsWith("/users/login")
    ) {
      // reset flagi, żeby przy kolejnych 401 (już poza logowaniem) modal mógł się pokazać
      isLoggingOut = false;
      return Promise.reject(error);
    }

    // Teraz: jeśli 401 pochodzi z dowolnego innego miejsca, pokazujemy powiadomienie
    if (error.response?.status === 401 && !isLoggingOut) {
      isLoggingOut = true;

      // 1) Wyślij globalne zdarzenie z komunikatem
      window.dispatchEvent(
        new CustomEvent("showNotification", {
          detail: {
            type: "error",
            text: "Twoja sesja wygasła. Zaloguj się ponownie.",
          },
        })
      );

      // 2) Usuń tokeny z localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      // 3) Po krótkim delayu przekieruj na /login
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }

    return Promise.reject(error);
  }
);

export default api;
export { api };
