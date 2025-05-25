import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function Activate() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState(localStorage.getItem("pending_email") || "");
  const navigate = useNavigate();

  const handleActivate = (e) => {
    e.preventDefault();
    axios
      .post(`${API_URL}/users/activate`, { email, code })
      .then(() => {
        alert("Konto zostało aktywowane! Możesz się teraz zalogować.");
        localStorage.removeItem("pending_email");
        navigate("/login");
      })
      .catch((err) => {
        console.error("Błąd aktywacji:", err);
        alert(err.response?.data?.detail || "Błąd podczas aktywacji konta.");
      });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Aktywacja konta</h2>
        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Kod aktywacyjny</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            Aktywuj konto
          </button>
        </form>
      </div>
    </div>
  );
}

export default Activate;
