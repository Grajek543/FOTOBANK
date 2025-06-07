// src/pages/PaypalSuccess.js
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function PaypalSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get("token");

    if (!orderId) {
      navigate("/");
      return;
    }

    api.post(`${API_URL}/payments/capture/${orderId}`, null, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      // Wyzeruj licznik koszyka po udanej płatności
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: 0 }));
      navigate("/");
    })
    .catch((err) => {
      console.error("Błąd potwierdzenia płatności:", err);
      navigate("/");
    });
  }, [location, navigate, token]);

  return <p className="text-center p-8">Trwa potwierdzenie płatności PayPal...</p>;
}

export default PaypalSuccess;
