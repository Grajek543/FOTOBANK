import React, { useState } from "react";
import api from "../api/axios";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function RequestReset() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const handleRequest = (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    api
      .post(`${API_URL}/users/request-password-reset`, { email })
      .then(() => {
        setMessageType("success");
        setMessage("Kod resetujący wysłany na e-mail.");
        setTimeout(() => {
          window.location.href = "/reset";
        });
      })
      .catch(() => {
        setMessageType("error");
        setMessage("Nie udało się wysłać kodu.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <form onSubmit={handleRequest} className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Przywracanie hasła</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Podaj swój e-mail"
        required
        className="w-full border p-2 mb-4"
      />
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded-md text-white ${
          loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Wysyłanie..." : "Wyślij kod"}
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

      <p className="text-sm mt-4 text-center">
        Masz już kod?{" "}
        <a href="/reset" className="text-blue-600 hover:underline">
          Przejdź do resetowania hasła
        </a>
      </p>
    </form>
  );
}

export default RequestReset;
