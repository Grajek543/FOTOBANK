import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function Cart() {
  const [photoIds, setPhotoIds] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [total, setTotal] = useState(0);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/cart/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPhotoIds(res.data))
      .catch((err) => console.error("Błąd ładowania koszyka:", err));
  }, []);

  useEffect(() => {
    const fetchPhotos = async () => {
      const promises = photoIds.map((id) =>
        axios.get(`${API_URL}/photos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      try {
        const responses = await Promise.all(promises);
        const loadedPhotos = responses.map((res) => res.data);
        setPhotos(loadedPhotos);

        const totalPrice = loadedPhotos.reduce((sum, p) => sum + p.price, 0);
        setTotal(totalPrice);
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
    axios
      .delete(`${API_URL}/cart/remove/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setPhotoIds((prev) => prev.filter((id) => id !== photoId));
      })
      .catch((err) => console.error("Błąd usuwania z koszyka:", err));
  };

  const handleCheckout = () => {
    axios
      .post(`${API_URL}/cart/checkout`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        alert(res.data.message);
        setPhotoIds([]);
      })
      .catch((err) => {
        console.error("Błąd realizacji zamówienia:", err);
        alert("Nie udało się zrealizować zamówienia.");
      });
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
                <div key={photo.id} className="bg-white shadow rounded overflow-hidden">
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

          <div className="mt-8 text-center">
            <p className="text-xl font-semibold mb-4">Łączna kwota: {total.toFixed(2)} zł</p>
            <button
              onClick={handleCheckout}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
            >
              Kup teraz
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
