import React, { useEffect, useState } from "react";
import axios from "axios";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [newRoles, setNewRoles] = useState({});
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) return;
    axios
      .get("http://127.0.0.1:8000/users/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data))
      .catch((err) => {
        console.error(err);
        alert("Błąd ładowania użytkowników lub brak uprawnień admina.");
      });
  }, [token]);

  const handleRoleChange = (id) => {
    if (!newRoles[id]) return;

    axios
      .put(`http://127.0.0.1:8000/users/set-role/${id}`, {
        new_role: newRoles[id],
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        alert("Rola zaktualizowana!");
        setUsers(users.map(u => u.id === id ? res.data : u));
      })
      .catch((err) => {
        console.error(err);
        alert("Nie udało się zmienić roli.");
      });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Panel administratora</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Username</th>
            <th className="p-2 border">Rola</th>
            <th className="p-2 border">Nowa rola</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="p-2 border">{user.id}</td>
              <td className="p-2 border">{user.email}</td>
              <td className="p-2 border">{user.username || "brak"}</td>
              <td className="p-2 border">{user.role}</td>
              <td className="p-2 border">
                <input
                  className="border px-2 py-1"
                  placeholder="np. admin"
                  onChange={(e) =>
                    setNewRoles({ ...newRoles, [user.id]: e.target.value })
                  }
                />
                <button
                  className="ml-2 px-3 py-1 bg-blue-500 text-white rounded"
                  onClick={() => handleRoleChange(user.id)}
                >
                  Zmień
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
