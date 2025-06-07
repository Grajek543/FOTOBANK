import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [showActivatePrompt, setShowActivatePrompt] = useState(false);

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
            setShowActivatePrompt(true);
          }
        } else if (err.response?.status === 401) {
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
    <div className="flex justify-center items-center min-h-screen bg-gray-50 relative">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md z-10">
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

        {message && (
          <p
            className={`mt-2 text-sm ${
              messageType === "error" ? "text-red-600" : "text-green-600"
            }`}
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

      {/* MODAL */}
      {showActivatePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-xs w-full text-center">
            <p className="mb-4">Twoje konto nie jest aktywowane.</p>
            <p className="mb-4">Przejść do aktywacji?</p>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate("/activate")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tak
              </button>
              <button
                onClick={() => setShowActivatePrompt(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
