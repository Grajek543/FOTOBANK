import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function PhotoDetails() {
  const { photoId } = useParams();
  const [photo, setPhoto] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
    axios
      .get(`${API_URL}/photos/${photoId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => setPhoto(res.data))
      .catch((err) => console.error(err));
  }, [photoId]);

  const handleAddToCart = () => {
  const token = localStorage.getItem("access_token");
  if (!token) return;

  axios
    .post(`${API_URL}/cart/add/${photoId}`, null, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      alert("Zdjęcie dodane do koszyka!");
    })
    .catch((err) => {
      const detail = err.response?.data?.detail;
      if (detail === "To zdjęcie jest już w koszyku.") {
        alert("To zdjęcie już znajduje się w koszyku.");
      } else if (detail === "Nie możesz dodać własnego zdjęcia do koszyka.") {
        alert("Nie możesz kupować własnych zdjęć.");
      } else {
        console.error("Błąd dodawania do koszyka:", err);
        alert("Wystąpił błąd podczas dodawania do koszyka.");
      }
    });
};


  const isVideo = /\.(mp4|mov|mkv)$/i.test(photo?.file_url || "");

  const normalize = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path.replace(/\\/g, "/");
    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path.replace(/\\/g, "/")}`;
  };

  if (!photo) {
    return <div className="p-6">Ładowanie zdjęcia...</div>;
  }

  return (
    <div className="p-6 flex flex-col items-center">
      {isVideo ? (
        <video
          controls
          className="max-w-5xl w-full h-auto object-contain mb-6 shadow-lg"
          poster={photo.thumb_url ? normalize(photo.thumb_url) : undefined}
        >
          <source src={normalize(photo.file_url)} type="video/mp4" />
          Twoja przeglądarka nie wspiera wideo.
        </video>
      ) : (
        <img
          src={normalize(photo.file_url)}
          alt={photo.title}
          className="max-w-5xl w-full h-auto object-contain mb-6 shadow-lg"
        />
      )}
      <div className="max-w-3xl w-full space-y-4">
        <h2 className="text-3xl font-bold">{photo.title}</h2>
        <p className="text-lg text-gray-700">{photo.description}</p>
        {photo.categories?.length > 0 && (
         <p className="text-md text-gray-500">
         Kategorie: {photo.categories.join(", ")}
        </p>
        )}
        {photo.owner_username && (
        <p className="text-md text-gray-500">
         Autor: {photo.owner_username}
         </p>
        )}

        <p className="text-md text-gray-500">Cena: {photo.price} zł</p>
        

        {isLoggedIn && (
          <button
            onClick={handleAddToCart}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Dodaj do koszyka
          </button>
        )}
      </div>
    </div>
  );
}

export default PhotoDetails;
