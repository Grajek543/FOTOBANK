// src/pages/Login.js

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    axios.post(`${API_URL}/users/login`, { email, password })
      .then((res) => {
        alert("Zalogowano!");

        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("user_id", res.data.user_id);
        localStorage.setItem("role", res.data.role); 

        navigate("/");
      })
      .catch((err) => {
        console.error(err);

        const detail = err.response?.data?.detail;

        if (err.response?.status === 403) {
          alert(detail);

        if (detail?.includes("nie zostało aktywowane")) {
          if (window.confirm("Chcesz przejść do strony aktywacji konta?")) {
            navigate("/activate");
          }
        }
      } else if (err.response?.status === 401) {
        alert("Nieprawidłowy login lub hasło.");
      } else {
        alert("Błąd logowania");
      }
    });





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
            className="w-full bg-blue-600 text-white py-2 rounded-md"
          >
            Zaloguj się
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
