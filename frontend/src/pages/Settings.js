//src/pages/Settings.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function Settings() {
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    axios.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      setCurrentUsername(res.data.username || "");
      setUsername(res.data.username || "");
    })
    .catch((err) => {
      console.error("Błąd ładowania danych użytkownika:", err);
    });
  }, []);

  const handleUpdate = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) return;

    axios.put(`${API_URL}/users/update`, {
      username
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      alert("Nazwa użytkownika została zaktualizowana!");
      setCurrentUsername(res.data.username);
    })
    .catch((err) => {
      console.error(err);
      if (err.response?.data?.detail) {
        alert(err.response.data.detail);
      } else {
        alert("Błąd aktualizacji nazwy użytkownika");
      }
    });
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) return;

    axios.put(`${API_URL}/users/change-password`, {
      old_password: oldPassword,
      new_password: newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      alert("Hasło zostało zmienione!");
      setOldPassword("");
      setNewPassword("");
    })
    .catch((err) => {
      console.error(err);
      if (err.response?.data?.detail) {
        alert(err.response.data.detail);
      } else {
        alert("Wystąpił błąd.");
      }
    });
  };

  const handleDelete = () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const confirmed = window.confirm("Czy na pewno chcesz usunąć konto? Tej operacji nie można cofnąć.");
    if (!confirmed) return;

    axios.delete(`${API_URL}/users/delete`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      alert("Konto zostało usunięte.");
      localStorage.clear();
      navigate("/");
    })
    .catch((err) => {
      console.error(err);
      alert("Błąd podczas usuwania konta.");
    });
  };

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl font-bold mb-6">Ustawienia konta</h2>

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
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
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
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Zmień hasło
        </button>
      </form>

      <div className="max-w-md">
        <h3 className="text-red-600 font-bold mb-2">Usuń konto</h3>
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Usuń konto
        </button>
      </div>
    </div>
  );
}

export default Settings;
