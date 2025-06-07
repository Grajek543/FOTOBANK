import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function StatBox({ label, value, suffix = "" }) {
  return (
    <div className="p-4 border rounded text-center bg-white">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value ?? "-"}{suffix}</p>
    </div>
  );
}

export default function Account() {
  const [userData, setUserData] = useState(null);
  const [photoStats, setPhotoStats] = useState({});
  const [purchaseStats, setPurchaseStats] = useState({});
  const [salesStats, setSalesStats] = useState({});
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("stats"); // "stats" | "purchases" | "sales"
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    const headers = { headers: { Authorization: `Bearer ${token}` } };

    api.get(`${API_URL}/users/me`, headers)
      .then((res) => setUserData(res.data))
      .catch(() => navigate("/login"));

    api.get(`${API_URL}/users/stats/my-photos`, headers)
      .then((res) => setPhotoStats(res.data))
      .catch((err) => console.error(err));

    api.get(`${API_URL}/users/stats/my-purchases`, headers)
      .then((res) => setPurchaseStats(res.data))
      .catch((err) => console.error(err));

    api.get(`${API_URL}/users/stats/sales`, headers)
      .then((res) => setSalesStats(res.data))
      .catch((err) => console.error(err));

    api.get(`${API_URL}/users/history/purchases`, headers)
      .then((res) => setPurchaseHistory(res.data))
      .catch((err) => console.error(err));

    api.get(`${API_URL}/users/history/sales`, headers)
      .then((res) => setSalesHistory(res.data))
      .catch((err) => console.error(err));
  }, [navigate]);

  if (!userData) return null;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h2 className="text-3xl font-bold mb-6 text-center">Twoje Konto</h2>
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow mb-6">
        <p className="mb-2"><strong>Email:</strong> {userData.email}</p>
        <p className="mb-2"><strong>Rola:</strong> {userData.role || "brak"}</p>
        <p><strong>Nazwa użytkownika:</strong> {userData.username || "brak"}</p>
      </div>

      {/* Tab Buttons */}
      <div className="max-w-2xl mx-auto flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 rounded ${activeTab === "stats" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
        >
          Statystyki
        </button>
        <button
          onClick={() => setActiveTab("purchases")}
          className={`px-4 py-2 rounded ${activeTab === "purchases" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
        >
          Historia zakupów
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          className={`px-4 py-2 rounded ${activeTab === "sales" ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
        >
          Historia sprzedaży
        </button>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {activeTab === "stats" && (
          <>
            <h3 className="text-2xl font-semibold mb-4">Twoje statystyki zdjęć</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatBox label="Liczba zdjęć" value={photoStats.photos_total} />
              <StatBox label="Średnia cena" value={photoStats.photos_avg_price} suffix=" zł" />
              <StatBox label="Bez kategorii" value={photoStats.photos_without_category} />
              <StatBox label="Z zakupami" value={photoStats.photos_with_purchases} />
            </div>

            <h3 className="text-2xl font-semibold mb-4">Twoje statystyki zakupów</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatBox label="Liczba zakupów" value={purchaseStats.purchases_total} />
              <StatBox label="Łączny koszt" value={purchaseStats.revenue_total} suffix=" zł" />
              <StatBox label="Średnia wartość" value={purchaseStats.avg_purchase_value} suffix=" zł" />
              <StatBox label="Unikalne zdjęcia" value={purchaseStats.distinct_photos_bought} />
            </div>

            <h3 className="text-2xl font-semibold mb-4">Twoje statystyki sprzedaży</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox label="Zdjęć dodanych" value={salesStats.photos_uploaded} />
              <StatBox label="Zdjęć sprzedanych" value={salesStats.photos_sold} />
              <StatBox label="Łączny zarobek" value={salesStats.revenue_earned} suffix=" zł" />
              <StatBox label="Średnia cena sprzedaży" value={salesStats.avg_price_sold} suffix=" zł" />
            </div>
          </>
        )}

        {activeTab === "purchases" && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Data</th>
                  <th className="px-4 py-2 border">Nazwa zdjęcia</th>
                  <th className="px-4 py-2 border">Cena</th>
                </tr>
              </thead>
              <tbody>
                {purchaseHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 border">{new Date(item.purchase_date).toLocaleString()}</td>
                    <td className="px-4 py-2 border">{item.photo_title || item.photo_id}</td>
                    <td className="px-4 py-2 border">{item.total_cost} zł</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Data zakupu</th>
                  <th className="px-4 py-2 border">Nazwa zdjęcia</th>
                  <th className="px-4 py-2 border">Cena sprzedaży</th>
                </tr>
              </thead>
              <tbody>
                {salesHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 border">{new Date(item.purchase_date).toLocaleString()}</td>
                    <td className="px-4 py-2 border">{item.photo_title || item.photo_id}</td>
                    <td className="px-4 py-2 border">{item.price} zł</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
