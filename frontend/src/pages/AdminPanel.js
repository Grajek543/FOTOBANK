// src/pages/AdminPanel.js
import React, { useEffect, useState } from "react";
import api from "../api/axios";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("access_token");

  // --- STANY NA INLINE CONFIRMACJE I BŁĘDY ---
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState(null);
  const [pendingRoleChange, setPendingRoleChange] = useState(null); // { id, newRole }
  const [pendingBanChange, setPendingBanChange] = useState(null); // { id, newBanned }
  const [pendingFullBanChange, setPendingFullBanChange] = useState(null); // { id, newFullBanned }
  const [errorMessage, setErrorMessage] = useState("");
  const [userStats, setUserStats] = useState({});
  const [photoStats, setPhotoStats] = useState({});
  const [purchaseStats, setPurchaseStats] = useState({});
  const [miscStats, setMiscStats] = useState({});
  const [activeTab, setActiveTab] = useState("users");




  useEffect(() => {
    if (!token) return;

    api.get("/users/all", { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => setUsers(res.data));

    api.get("/users/stats/users",     { headers: { Authorization: `Bearer ${token}` } }).then(res => setUserStats(res.data));
    api.get("/users/stats/photos",    { headers: { Authorization: `Bearer ${token}` } }).then(res => setPhotoStats(res.data));
    api.get("/users/stats/purchases", { headers: { Authorization: `Bearer ${token}` } }).then(res => setPurchaseStats(res.data));
    api.get("/users/stats/misc",      { headers: { Authorization: `Bearer ${token}` } }).then(res => setMiscStats(res.data));
  }, [token]);

  function StatBox({ label, value }) {
  return (
    <div className="p-4 border rounded text-center">
      <p className="text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value ?? "-"}</p>
    </div>
  );
}



  // ********** FUNKCJA USUWANIA UŻYTKOWNIKA **********

  const onClickDeleteUser = (id) => {
    setErrorMessage("");
    setPendingDeleteUserId(id);
  };

  const confirmDeleteUser = async () => {
    const id = pendingDeleteUserId;
    try {
      await api.delete(`${API_URL}/users/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      setErrorMessage("Błąd podczas usuwania użytkownika.");
    } finally {
      setPendingDeleteUserId(null);
    }
  };

  const cancelDeleteUser = () => {
    setErrorMessage("");
    setPendingDeleteUserId(null);
  };

  // ********** FUNKCJA ZMIANY ROLI **********

  const onClickRoleChange = (id, newRole) => {
    setErrorMessage("");
    setPendingRoleChange({ id, newRole });
  };

  const confirmRoleChange = async () => {
    const { id, newRole } = pendingRoleChange;
    try {
      const res = await api.put(
        `${API_URL}/users/set-role/${id}`,
        { new_role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
    } catch (err) {
      console.error(err);
      setErrorMessage("Błąd podczas zmiany roli.");
    } finally {
      setPendingRoleChange(null);
    }
  };

  const cancelRoleChange = () => {
    setErrorMessage("");
    setPendingRoleChange(null);
  };

  // ********** FUNKCJA TOGGLE BAN **********

  const onClickBanToggle = (id, currentBanned) => {
    setErrorMessage("");
    setPendingBanChange({ id, newBanned: !currentBanned });
  };

  const confirmBanToggle = async () => {
    const { id, newBanned } = pendingBanChange;
    try {
      const res = await api.put(
        `${API_URL}/users/ban/${id}`,
        { banned: newBanned },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
    } catch (err) {
      console.error(err);
      setErrorMessage("Błąd podczas zmiany blokady.");
    } finally {
      setPendingBanChange(null);
    }
  };

  const cancelBanToggle = () => {
    setErrorMessage("");
    setPendingBanChange(null);
  };

  // ********** FUNKCJA TOGGLE FULL BAN **********

  const onClickFullBanToggle = (id, currentFullBanned) => {
    setErrorMessage("");
    setPendingFullBanChange({ id, newFullBanned: !currentFullBanned });
  };

  const confirmFullBanToggle = async () => {
    const { id, newFullBanned } = pendingFullBanChange;
    try {
      const res = await api.put(
        `${API_URL}/users/full-ban/${id}`,
        { full_banned: newFullBanned },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
    } catch (err) {
      console.error(err);
      setErrorMessage("Błąd podczas zmiany pełnej blokady.");
    } finally {
      setPendingFullBanChange(null);
    }
  };

  const cancelFullBanToggle = () => {
    setErrorMessage("");
    setPendingFullBanChange(null);
  };

  return (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-6">Panel administratora</h2>

    <h3 className="text-2xl font-bold mb-4">Statystyki</h3>
<div className="mb-4 flex flex-wrap gap-2">
  <button onClick={() => setActiveTab("users")} className={`px-4 py-2 rounded ${activeTab === "users" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}>Użytkownicy</button>
  <button onClick={() => setActiveTab("photos")} className={`px-4 py-2 rounded ${activeTab === "photos" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}>Zdjęcia</button>
  <button onClick={() => setActiveTab("purchases")} className={`px-4 py-2 rounded ${activeTab === "purchases" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}>Zakupy / Płatności</button>
  <button onClick={() => setActiveTab("misc")} className={`px-4 py-2 rounded ${activeTab === "misc" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}>Inne</button>
</div>

{activeTab === "users" && (
  <div className="mb-6 p-4 bg-white rounded shadow">
    <h3 className="text-xl font-bold mb-2">Statystyki użytkowników</h3>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatBox label="Łączna liczba kont" value={userStats.users_total} />
      <StatBox label="Aktywne konta" value={userStats.users_active} />
      <StatBox label="Zablokowani" value={userStats.users_banned} />
      <StatBox label="Zablokowane przesyłanie" value={userStats.users_upload_blocked} />
      <StatBox label="Administratorzy" value={userStats.admins_count} />
    </div>
  </div>
)}

{activeTab === "photos" && (
  <div className="mb-6 p-4 bg-white rounded shadow">
    <h3 className="text-xl font-bold mb-2">Statystyki zdjęć</h3>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatBox label="Liczba zdjęć" value={photoStats.photos_total} />
      <StatBox label="Średnia cena" value={`${photoStats.photos_avg_price} zł`} />
      <StatBox label="Bez kategorii" value={photoStats.photos_without_category} />
      <StatBox label="Z zakupami" value={photoStats.photos_with_purchases} />
    </div>
  </div>
)}

{activeTab === "purchases" && (
  <div className="mb-6 p-4 bg-white rounded shadow">
    <h3 className="text-xl font-bold mb-2">Zakupy i płatności</h3>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatBox label="Liczba zakupów" value={purchaseStats.purchases_total} />
      <StatBox label="Łączny przychód" value={`${purchaseStats.revenue_total} zł`} />
      <StatBox label="Kupujący" value={purchaseStats.buyers_count} />
      <StatBox label="Średni przychód / użytkownik" value={`${purchaseStats.avg_revenue_per_user} zł`} />
    </div>
  </div>
)}

{activeTab === "misc" && (
  <div className="mb-6 p-4 bg-white rounded shadow">
    <h3 className="text-xl font-bold mb-2">Inne ciekawe</h3>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatBox label="Kategorie" value={miscStats.categories_total} />
      <StatBox label="Najaktywniejszy użytkownik (ID)" value={miscStats.most_active_user_id} />
      <StatBox label="Najdroższy koszyk" value={`${miscStats.largest_cart_value} zł`} />
      <StatBox label="Średnia wartość koszyka" value={`${miscStats.avg_cart_value} zł`} />
    </div>
  </div>
)}

<h3 className="text-2xl font-bold mb-4">Użytkownicy</h3>
<table className="w-full border-collapse">
  <thead>
    <tr className="bg-gray-100 text-center">
      <th className="p-2 border">ID</th>
      <th className="p-2 border">Email</th>
      <th className="p-2 border">Username</th>
      <th className="p-2 border">Rola</th>
      <th className="p-2 border">Blokada przesyłania zdjęć</th>
      <th className="p-2 border">Pełna blokada konta</th>
      <th className="p-2 border">Ustaw rolę</th>
      <th className="p-2 border">Usuń konto</th>
    </tr>
  </thead>
  <tbody>
    {users.map((u) => (
      <tr key={u.id} className="text-center">
        <td className="p-2 border">{u.id}</td>
        <td className="p-2 border">{u.email}</td>
        <td className="p-2 border">{u.username || "brak"}</td>
        <td className="p-2 border">{u.role}</td>

        <td className="p-2 border">
          <input
            type="checkbox"
            checked={u.banned}
            onClick={() => onClickBanToggle(u.id, u.banned)}
            readOnly
          />
        </td>

        <td className="p-2 border">
          <input
            type="checkbox"
            checked={u.full_banned}
            onClick={() => onClickFullBanToggle(u.id, u.full_banned)}
            readOnly
          />
        </td>

        <td className="p-2 border space-x-2">
          <button
            onClick={() => onClickRoleChange(u.id, "admin")}
            className={`px-3 py-1 rounded ${
              u.role === "admin"
                ? "bg-green-600 text-white"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          >
            admin
          </button>
          <button
            onClick={() => onClickRoleChange(u.id, "user")}
            className={`px-3 py-1 rounded ${
              u.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          >
            user
          </button>
        </td>

        <td className="p-2 border">
          <button
            onClick={() => onClickDeleteUser(u.id)}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Usuń
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>




      {/* INLINE CONFIRM: USUNIĘCIE UŻYTKOWNIKA */}
      {pendingDeleteUserId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-xs w-full text-center">
            <p className="mb-4">
              Na pewno chcesz usunąć użytkownika o ID {pendingDeleteUserId}?
            </p>
            {errorMessage && (
              <p className="mb-2 text-red-600 text-sm">{errorMessage}</p>
            )}
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Tak, usuń
              </button>
              <button
                onClick={cancelDeleteUser}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE CONFIRM: ZMIANA ROLI */}
      {pendingRoleChange && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-xs w-full text-center">
            <p className="mb-4">
              Na pewno chcesz ustawić rolę "
              {pendingRoleChange.newRole}" dla użytkownika o ID{" "}
              {pendingRoleChange.id}?
            </p>
            {errorMessage && (
              <p className="mb-2 text-red-600 text-sm">{errorMessage}</p>
            )}
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmRoleChange}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Tak, zmień
              </button>
              <button
                onClick={cancelRoleChange}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE CONFIRM: TOGGLE BAN */}
      {pendingBanChange && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-xs w-full text-center">
            <p className="mb-4">
              {pendingBanChange.newBanned
                ? `Czy na pewno chcesz ZABLOKOWAĆ użytkownika o ID ${pendingBanChange.id}?`
                : `Czy na pewno chcesz ODBLOKOWAĆ użytkownika o ID ${pendingBanChange.id}?`}
            </p>
            {errorMessage && (
              <p className="mb-2 text-red-600 text-sm">{errorMessage}</p>
            )}
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmBanToggle}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Tak
              </button>
              <button
                onClick={cancelBanToggle}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE CONFIRM: TOGGLE PEŁNEJ BLOKADY */}
      {pendingFullBanChange && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-xs w-full text-center">
            <p className="mb-4">
              {pendingFullBanChange.newFullBanned
                ? `Czy na pewno chcesz CAŁKOWICIE ZABLOKOWAĆ użytkownika o ID ${pendingFullBanChange.id}?`
                : `Czy na pewno chcesz ODBLOKOWAĆ całkowicie użytkownika o ID ${pendingFullBanChange.id}?`}
            </p>
            {errorMessage && (
              <p className="mb-2 text-red-600 text-sm">{errorMessage}</p>
            )}
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmFullBanToggle}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Tak
              </button>
              <button
                onClick={cancelFullBanToggle}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ******** KONIEC INLINE CONFIRMS ******** */}
    </div>
  );
}
