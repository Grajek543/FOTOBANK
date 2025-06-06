import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // STANY na komunikat zamiast alertów
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "info" | "error" | "success"

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    api
      .post(`${API_URL}/users/login`, { email, password })
      .then((res) => {
        setMessageType("success");
        setMessage("Zalogowano pomyślnie!");

        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("user_id", res.data.user_id);
        localStorage.setItem("role", res.data.role);
        navigate("/");
      })
      .catch((err) => {
        console.error(err);
        const detail = err.response?.data?.detail;

        if (err.response?.status === 403) {
          setMessageType("error");
          setMessage(detail || "Dostęp zabroniony.");
          if (detail?.includes("nie zostało aktywowane")) {
            if (
              window.confirm("Chcesz przejść do strony aktywacji konta?")
            ) {
              navigate("/activate");
            }
          }
        } else if (err.response?.status === 401) {
          // Zawsze wyświetlamy tylko: "Nieprawidłowy login lub hasło."
          setMessageType("error");
          setMessage("Nieprawidłowy login lub hasło.");
        } else {
          setMessageType("error");
          setMessage("Błąd logowania");
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Logowanie</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-gray-700">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md text-white ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        {/* WYŚWIETLANIE KOMUNIKATU INLINE */}
        {message && (
          <p
            className={
              messageType === "error"
                ? "mt-2 text-red-600 text-sm"
                : "mt-2 text-green-600 text-sm"
            }
          >
            {message}
          </p>
        )}

        <p className="text-sm text-center mt-4">
          <a href="/forgot" className="text-blue-600 hover:underline">
            Nie pamiętasz hasła?
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
