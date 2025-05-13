// src/pages/AdminPanel.js
import React, { useEffect, useState } from "react";
import axios from "axios";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("access_token");

  /* ----------- axios z tokenem ----------- */
  const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: { Authorization: `Bearer ${token}` },
  });

  /* ----------- pobierz listę ----------- */
  useEffect(() => {
    if (!token) return;
    api
      .get("/users/all")
      .then((res) => setUsers(res.data))
      .catch(() => alert("Błąd ładowania użytkowników (czy jesteś adminem?)"));
  }, [token]);

  /* ----------- zmiana roli ----------- */
  const setRole = (id, role) => {
    api
      .put(`/users/set-role/${id}`, { new_role: role })
      .then((res) => setUsers(users.map((u) => (u.id === id ? res.data : u))))
      .catch(() => alert("Nie udało się zmienić roli."));
  };

  /* ----------- blokada ----------- */
  const toggleBan = (id, banned) => {
    api
      .put(`/users/ban/${id}`, { banned: !banned })
      .then((res) => setUsers(users.map((u) => (u.id === id ? res.data : u))))
      .catch(() => alert("Nie udało się zmienić blokady."));
  };

  /* ----------- UI ----------- */
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Panel administratora</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Username</th>
            <th className="p-2 border">Rola</th>
            <th className="p-2 border">Blokada</th>
            <th className="p-2 border">Ustaw rolę</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="text-center">
              <td className="p-2 border">{u.id}</td>
              <td className="p-2 border">{u.email}</td>
              <td className="p-2 border">{u.username || "brak"}</td>
              <td className="p-2 border">{u.role}</td>

              {/* blokada */}
              <td className="p-2 border">
                <input
                  type="checkbox"
                  checked={u.banned}
                  onChange={() => toggleBan(u.id, u.banned)}
                />
              </td>

              {/* dwa szybkie przyciski roli */}
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => setRole(u.id, "admin")}
                  className={`px-3 py-1 rounded ${
                    u.role === "admin"
                      ? "bg-green-600 text-white"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                >
                  admin
                </button>
                <button
                  onClick={() => setRole(u.id, "user")}
                  className={`px-3 py-1 rounded ${
                    u.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                >
                  user
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel;
