import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    setLoading(true);

    api
      .post(`${API_URL}/users/register`, {
        email,
        password,
        username,
      })
      .then((res) => {
        alert("Konto założone! Sprawdź e-mail i aktywuj konto.");
        localStorage.setItem("pending_email", email);
        navigate("/activate");
      })
      .catch((err) => {
        if (err.response) {
          alert("Błąd rejestracji: " + err.response.data.detail);
        } else {
          alert("Nieznany błąd rejestracji");
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Rejestracja</h2>
        <form onSubmit={handleRegister} className="space-y-4">
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
          <div>
            <label className="block text-gray-700">Nazwa użytkownika</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? "Rejestrowanie..." : "Zarejestruj się"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
