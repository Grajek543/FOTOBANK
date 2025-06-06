// src/pages/Cart.js
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function Cart() {
  const [photoIds, setPhotoIds] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [total, setTotal] = useState(0);
  const token = localStorage.getItem("access_token");
  const [loadingPayPal, setLoadingPayPal] = useState(false);


  useEffect(() => {
    if (!token) return;

    api
      .get(`${API_URL}/cart/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPhotoIds(res.data))
      .catch((err) => console.error("Błąd ładowania koszyka:", err));

    api
      .get(`${API_URL}/cart/sum`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTotal(res.data.total))
      .catch((err) => console.error("Błąd ładowania sumy koszyka:", err));
  }, []);

  useEffect(() => {
    const fetchPhotos = async () => {
      const promises = photoIds.map((id) =>
        api.get(`${API_URL}/photos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      try {
        const responses = await Promise.all(promises);
        const loadedPhotos = responses.map((res) => res.data);
        setPhotos(loadedPhotos);
      } catch (err) {
        console.error("Błąd ładowania zdjęć:", err);
      }
    };

    if (photoIds.length > 0) {
      fetchPhotos();
    } else {
      setPhotos([]);
      setTotal(0);
    }
  }, [photoIds]);

  const handleRemove = (photoId) => {
    api
      .delete(`${API_URL}/cart/remove/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setPhotoIds((prev) => prev.filter((id) => id !== photoId));
        api
          .get(`${API_URL}/cart/sum`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => setTotal(res.data.total))
          .catch((err) => console.error("Błąd ładowania sumy koszyka:", err));
      })
      .catch((err) => console.error("Błąd usuwania z koszyka:", err));
  };

  const handleCheckout = () => {
    api
      .post(`${API_URL}/cart/checkout`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        alert(res.data.message);
        setPhotoIds([]);
        setPhotos([]);
        setTotal(0);
      })
      .catch((err) => {
        console.error("Błąd realizacji zamówienia:", err);
        alert("Nie udało się zrealizować zamówienia.");
      });
  };

const handlePayPal = async () => {
  setLoadingPayPal(true);
  try {
    const res = await api.post(
      `${API_URL}/payments/create`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const approvalUrl = res.data.links.find((link) => link.rel === "approve")?.href;
    if (approvalUrl) {
      window.location.href = approvalUrl;
    } else {
      alert("Nie udało się uzyskać linku PayPal.");
      setLoadingPayPal(false);
    }
  } catch (err) {
    console.error("Błąd PayPal:", err);
    alert("Nie udało się uruchomić płatności.");
    setLoadingPayPal(false);
  }
};


  const normalize = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path.replace(/\\/g, "/");
    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path.replace(/\\/g, "/")}`;
  };

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Twój koszyk</h2>
      {photos.length === 0 ? (
        <p className="text-center text-gray-600">Koszyk jest pusty.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo) => {
              const isVideo = /\.(mp4|mov|mkv)$/i.test(photo.file_url);
              return (
                <div
                  key={photo.id}
                  className="bg-white shadow rounded overflow-hidden"
                >
                  <Link to={`/photo/${photo.id}`}>
                    {isVideo ? (
                      <video controls className="w-full h-48 object-cover">
                        <source src={normalize(photo.file_url)} type="video/mp4" />
                        Twoja przeglądarka nie wspiera wideo.
                      </video>
                    ) : (
                      <img
                        src={normalize(photo.thumb_url || photo.file_url)}
                        alt={photo.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                  </Link>
                  <div className="p-2">
                    <h3 className="font-bold">{photo.title}</h3>
                    <p className="text-sm text-gray-600 truncate">{photo.description}</p>
                    <p className="text-sm text-gray-700">{photo.price} zł</p>
                    <button
                      onClick={() => handleRemove(photo.id)}
                      className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                    >
                      Usuń z koszyka
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center space-y-4">
            <p className="text-xl font-semibold">Łączna kwota: {total.toFixed(2)} zł</p>
            <button
              onClick={handlePayPal}
              className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600 transition w-full flex items-center justify-center"
              disabled={loadingPayPal}
            >
              {loadingPayPal ? "Ładowanie PayPal..." : "Zapłać przez PayPal"}
            </button>

          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
