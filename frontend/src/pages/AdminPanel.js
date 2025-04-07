
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Brak tokenu. Zaloguj się jako admin.");
      return;
    }

    axios
      .get("http://127.0.0.1:8000/users/all", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => {
        console.error(err);
        alert("Błąd pobierania listy użytkowników. Czy jesteś adminem?");
      });
  }, []);

  const updateRole = (userId) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (!newRole) {
      alert("Wpisz nową rolę zanim ją ustawisz.");
      return;
    }

    axios
      .put(`http://127.0.0.1:8000/users/set-role/${userId}`,
        { new_role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        alert("Zmieniono rolę użytkownika!");

        setUsers(users.map((u) => (u.id === userId ? res.data : u)));
      })
      .catch((err) => {
        console.error(err);
        alert("Błąd zmiany roli");
      });
  };

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl font-bold mb-4">Panel administratora</h2>

      <table className="w-full bg-white shadow-lg border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border-b">ID</th>
            <th className="px-4 py-2 border-b">Email</th>
            <th className="px-4 py-2 border-b">Username</th>
            <th className="px-4 py-2 border-b">Rola</th>
            <th className="px-4 py-2 border-b">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="text-center">
              <td className="px-4 py-2 border-b">{u.id}</td>
              <td className="px-4 py-2 border-b">{u.email}</td>
              <td className="px-4 py-2 border-b">{u.username || "brak"}</td>
              <td className="px-4 py-2 border-b">{u.role}</td>
              <td className="px-4 py-2 border-b">
                <input
                  type="text"
                  placeholder="Nowa rola"
                  className="border border-gray-300 rounded px-2 py-1"
                  onChange={(e) => setNewRole(e.target.value)}
                />
                <button
                  className="ml-2 px-3 py-1 bg-blue-500 text-white rounded"
                  onClick={() => updateRole(u.id)}
                >
                  Zmień rolę
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
