import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    axios.post(`${API_URL}/users/reset-password`, {
      email,
      code,
      new_password: newPassword
    })
      .then(() => {
        alert("Hasło zostało zmienione! Możesz się teraz zalogować.");
        navigate("/login");
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.detail || "Błąd przy zmianie hasła.");
      });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4 text-center">Resetowanie hasła</h2>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full p-2 border rounded mb-2"
      />
      <input
        type="text"
        placeholder="Kod z e-maila"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
        className="w-full p-2 border rounded mb-2"
      />
      <input
        type="password"
        placeholder="Nowe hasło"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        className="w-full p-2 border rounded mb-4"
      />
      <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
        Zmień hasło
      </button>
    </form>
  );
}

export default ResetPassword;
