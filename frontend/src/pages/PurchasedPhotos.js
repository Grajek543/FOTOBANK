import React, { useEffect, useState } from "react";
import api from "../api/axios";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function PurchasedPhotos() {
  const [photos, setPhotos] = useState([]);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) return;

    api
      .get(`${API_URL}/photos/purchased`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPhotos(res.data))
      .catch((err) => {
        console.error("Błąd ładowania zakupionych zdjęć:", err);
      });
  }, [token]);

  const normalize = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path.replace(/\\/g, "/");
    return `${API_URL}${
      path.startsWith("/") ? "" : "/"
    }${path.replace(/\\/g, "/")}`;
  };

  const downloadPhoto = async (photoId, fileName) => {
    try {
      const response = await fetch(`${API_URL}/photos/download/${photoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Nie udało się pobrać pliku");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "plik";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Błąd pobierania pliku:", err);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Zakupione zdjęcia
      </h2>
      {photos.length === 0 ? (
        <p className="text-center text-gray-600">Brak zakupionych zdjęć.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => {
            const isVideo = /\.(mp4|mov|mkv)$/i.test(photo.file_url);
            return (
              <div
                key={photo.id}
                className="bg-white shadow rounded overflow-hidden"
              >
                {isVideo ? (
                  <video controls className="w-full h-48 object-cover">
                    <source
                      src={normalize(photo.file_url)}
                      type="video/mp4"
                    />
                    Twoja przeglądarka nie wspiera wideo.
                  </video>
                ) : (
                  <img
                    src={normalize(photo.thumb_url || photo.file_url)}
                    alt={photo.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-2">
                  <h3 className="font-bold">{photo.title}</h3>
                  <button
                    onClick={() => downloadPhoto(photo.id, photo.title)}
                    className="mt-2 w-full text-center bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                  >
                    Pobierz
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PurchasedPhotos;
