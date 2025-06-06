import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function Activate() {
  const [email, setEmail] = useState(
    localStorage.getItem("pending_email") || ""
  );
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // STANY na komunikaty zamiast alertów
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const handleActivate = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    api
      .post(`${API_URL}/users/activate`, { email, code })
      .then(() => {
        setMessageType("success");
        setMessage("Konto aktywowane! Możesz się teraz zalogować.");
        localStorage.removeItem("pending_email");
        navigate("/login");
      })
      .catch((err) => {
        console.error("Błąd aktywacji:", err);
        setMessageType("error");
        setMessage(err.response?.data?.detail || "Błąd podczas aktywacji konta.");
      })
      .finally(() => setLoading(false));
  };

  const resendCode = () => {
    if (!email) {
      setMessageType("error");
      setMessage("Podaj e-mail, aby wysłać kod.");
      return;
    }
    setLoading(true);
    setMessage("");

    api
      .post(`${API_URL}/users/register`, {
        email,
        password: "DUMMY",
        username: "DUMMY",
      })
      .then(() => {
        setMessageType("success");
        setMessage("Nowy kod został wysłany na e-mail.");
      })
      .catch((err) => {
        if (
          err.response?.status === 400 &&
          err.response.data?.detail?.includes("istnieje")
        ) {
          api
            .post(`${API_URL}/users/resend-code`, { email })
            .then(() => {
              setMessageType("success");
              setMessage("Kod aktywacyjny został wysłany ponownie.");
            })
            .catch(() => {
              setMessageType("error");
              setMessage("Nie udało się wysłać kodu.");
            });
        } else {
          setMessageType("error");
          setMessage("Błąd przy ponownym wysłaniu kodu.");
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center">Aktywacja konta</h2>
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
            disabled={loading}
            className={`w-full py-2 rounded text-white ${
              loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Aktywowanie..." : "Aktywuj konto"}
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

        <button
          onClick={resendCode}
          className="w-full text-sm text-blue-600 hover:underline mt-2"
        >
          Wyślij kod jeszcze raz
        </button>
      </div>
    </div>
  );
}

export default Activate;
