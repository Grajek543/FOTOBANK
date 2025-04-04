// src/pages/Account.js
import React, { useState, useEffect } from "react";
import axios from "axios";

function Account() {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(null);  // lub usuwamy, jeśli backend i tak czyta z tokena

  useEffect(() => {
    // Odczytujemy user_id (opcjonalnie) z localStorage
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const handleUpdate = (e) => {
    e.preventDefault();

    // Pobieramy token
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Brak tokenu, zaloguj się ponownie!");
      return;
    }

    axios.put("http://localhost:8000/users/update", {
      username: username,
    }, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    .then((res) => {
      alert("Dane zaktualizowane!");
      console.log(res.data);
    })
    .catch((err) => {
      console.error(err);
      alert("Błąd aktualizacji");
    });
  };

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl font-bold mb-4">Twoje Konto</h2>
      {userId ? (
        <div>
          <p><strong>User ID:</strong> {userId}</p>
          <form onSubmit={handleUpdate} className="mt-4">
            <label className="block mb-2">Zmień nazwę użytkownika:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border p-2 mb-4 w-full"
              placeholder="Wpisz nową nazwę"
              required
            />
            <button type="submit" className="bg-blue-600 text-white p-2 rounded">
              Zaktualizuj
            </button>
          </form>
        </div>
      ) : (
        <p>Brak user_id – zaloguj się.</p>
      )}
    </div>
  );
}

export default Account;
