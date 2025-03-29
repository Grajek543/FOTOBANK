// src/pages/Register.js
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    axios.post("http://localhost:8000/users/register", { email, password })
      .then((res) => {
        alert("Konto założone!");
        // Zapisujemy dane użytkownika (otrzymane z backendu) w localStorage
        localStorage.setItem("user", JSON.stringify(res.data));
        // Po rejestracji przekierowujemy do strony uzupełnienia dodatkowych danych
        navigate("/account");
      })
      .catch((err) => {
        console.error(err);
        alert("Błąd rejestracji");
      });
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
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md">Zarejestruj się</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
