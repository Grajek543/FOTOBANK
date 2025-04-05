// src/pages/Account.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Account() {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios.get("http://localhost:8000/users/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((res) => {
      setUserData(res.data);
    })
    .catch((err) => {
      console.error("Błąd pobierania danych użytkownika", err);
      navigate("/login");
    });
  }, [navigate]);

  if (!userData) return null;

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl font-bold mb-4">Twoje Konto</h2>
      <p><strong>Email:</strong> {userData.email}</p>
      <p><strong>Rola:</strong> {userData.role || "brak"}</p>
      <p><strong>Nazwa użytkownika:</strong> {userData.username || "brak"}</p>
    </div>
  );
}

export default Account;
