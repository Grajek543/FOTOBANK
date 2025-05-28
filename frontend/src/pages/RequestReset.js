import React, { useState } from "react";
import api from "../api/axios";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function RequestReset() {
  const [email, setEmail] = useState("");

  const handleRequest = (e) => {
    e.preventDefault();
    api.post(`${API_URL}/users/request-password-reset`, { email })
      .then(() => alert("Kod resetujący wysłany na e-mail."))
      .catch(() => alert("Nie udało się wysłać kodu."));
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
    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
      Wyślij kod
    </button>

    <p className="text-sm mt-4 text-center">
      Masz już kod?{" "}
      <a href="/reset" className="text-blue-600 hover:underline">Przejdź do resetowania hasła</a>
    </p>
  </form>
    );

}



export default RequestReset;
