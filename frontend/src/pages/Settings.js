import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function Settings() {
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  // STANY na komunikat zamiast alertów
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "info" | "error" | "success"

  // STANY na inline-confirm usunięcia konta i ewentualny błąd
  const [confirmingDeleteAccount, setConfirmingDeleteAccount] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    api
      .get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCurrentUsername(res.data.username || "");
        setUsername(res.data.username || "");
        // Zapisz userId lokalnie do użycia w confirmDeleteAccount
        localStorage.setItem("user_id", res.data.id);
      })
      .catch((err) => {
        console.error("Błąd ładowania danych użytkownika:", err);
      });
  }, []);

  const handleUpdate = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setMessage("");
    api
      .put(
        `${API_URL}/users/update`,
        { username },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => {
        setMessageType("success");
        setMessage("Nazwa użytkownika została zaktualizowana!");
        setCurrentUsername(res.data.username);
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.data?.detail) {
          setMessageType("error");
          setMessage(err.response.data.detail);
        } else {
          setMessageType("error");
          setMessage("Błąd aktualizacji nazwy użytkownika");
        }
      });
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setMessage("");
    api
      .put(
        `${API_URL}/users/change-password`,
        {
          old_password: oldPassword,
          new_password: newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        setMessageType("success");
        setMessage("Hasło zostało zmienione!");
        setOldPassword("");
        setNewPassword("");
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.data?.detail) {
          setMessageType("error");
          setMessage(err.response.data.detail);
        } else {
          setMessageType("error");
          setMessage("Wystąpił błąd.");
        }
      });
  };

  // Kliknięcie "Usuń konto" – otwiera inline-confirm
  const onClickDeleteAccount = () => {
    setErrorMessage("");
    setConfirmingDeleteAccount(true);
  };

  // Użytkownik potwierdza usunięcie konta
  const confirmDeleteAccount = async () => {
    const token = localStorage.getItem("access_token");
    const userId = localStorage.getItem("user_id");
    if (!token || !userId) {
      setErrorMessage("Brak danych użytkownika. Zaloguj się ponownie.");
      setConfirmingDeleteAccount(false);
      return;
    }

    try {
      await api.delete(`${API_URL}/users/delete/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessageType("success");
      setMessage("Konto zostało usunięte.");
      localStorage.clear();
      // ** zamiast navigate("/"), przenosimy na stronę logowania: **
      navigate("/login");
    } catch {
      setErrorMessage("Błąd podczas usuwania konta.");
    } finally {
      setConfirmingDeleteAccount(false);
    }
  };

  // Użytkownik anuluje usunięcie konta
  const cancelDeleteAccount = () => {
    setErrorMessage("");
    setConfirmingDeleteAccount(false);
  };

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Ustawienia konta</h2>

      <form onSubmit={handleUpdate} className="mb-6 max-w-md space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Zmień nazwę użytkownika</h3>
          <label className="block mb-1 text-gray-700">Nazwa użytkownika:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Zapisz zmiany
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="mb-6 max-w-md space-y-4">
        <h3 className="text-lg font-semibold">Zmień hasło</h3>
        <div>
          <label className="block mb-1 text-gray-700">Stare hasło:</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-gray-700">Nowe hasło:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Zmień hasło
        </button>
      </form>

      {/* WYŚWIETLANIE KOMUNIKATU INLINE */}
      {message && (
        <p
          className={
            messageType === "error"
              ? "mb-4 text-red-600 text-sm"
              : "mb-4 text-green-600 text-sm"
          }
        >
          {message}
        </p>
      )}

      <div className="max-w-md">
        <h3 className="text-red-600 font-bold mb-2">Usuń konto</h3>
        <button
          onClick={onClickDeleteAccount}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Usuń konto
        </button>
      </div>

      {/* INLINE CONFIRM: Usunięcie konta */}
      {confirmingDeleteAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-xs w-full text-center">
            <p className="mb-4">
              Czy na pewno chcesz usunąć konto? Tej operacji nie można cofnąć.
            </p>

            {errorMessage && (
              <p className="mb-2 text-red-600 text-sm">{errorMessage}</p>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Tak, usuń
              </button>
              <button
                onClick={cancelDeleteAccount}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
      {/* KONIEC INLINE CONFIRM */}
    </div>
  );
}

export default Settings;
