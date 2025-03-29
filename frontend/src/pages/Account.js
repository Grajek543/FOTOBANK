import React, { useState, useEffect } from "react";
import axios from "axios";

function Account() {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleUpdate = (e) => {
    e.preventDefault();
    // Używamy user.user_id, bo taki klucz mamy w localStorage
    axios.put(`http://localhost:8000/users/update?user_id=${user.user_id}`, {
      username: username,
    })
      .then((res) => {
        alert("Dane zaktualizowane!");
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      })
      .catch((err) => {
        console.error(err);
        alert("Błąd aktualizacji");
      });
  };

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl font-bold mb-4">Twoje Konto</h2>
      {user ? (
        <div>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Rola:</strong> {user.role}</p>
          <p>
            <strong>Nazwa użytkownika:</strong>{" "}
            {user.username ? user.username : "Nie ustawiono"}
          </p>
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
        <p>Brak danych użytkownika.</p>
      )}
    </div>
  );
}

export default Account;
