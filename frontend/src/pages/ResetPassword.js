import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  // STANY na komunikat zamiast alertów
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "info" | "error" | "success"

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");

    api
      .post(`${API_URL}/users/reset-password`, {
        email,
        code,
        new_password: newPassword,
      })
      .then(() => {
        setMessageType("success");
        setMessage("Hasło zostało zmienione! Możesz się teraz zalogować.");
        navigate("/login");
      })
      .catch((err) => {
        console.error(err);
        setMessageType("error");
        setMessage(err.response?.data?.detail || "Błąd przy zmianie hasła.");
      });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 bg-white shadow-md rounded"
    >
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
      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 rounded"
      >
        Zmień hasło
      </button>

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
    </form>
  );
}

export default ResetPassword;
