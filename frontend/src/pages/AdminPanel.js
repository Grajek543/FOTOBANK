// src/components/Gallery.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/photos/`)
      .then((r) => r.json())
      .then((data) => {
        setPhotos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Ładowanie galerii…</p>;
  if (!photos.length) return <p>Brak dostępnych zdjęć/filmów</p>;

  function normalize(path) {
    if (!path) return "";
    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path.replace(/\\/g, "/")}`;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((p) => {
        const isVideo = /\.(mp4|mov|mkv)$/i.test(p.file_url);
        return (
          <Link
            to={`/photo/${p.id}`}
            key={p.id}
            className="block bg-white rounded shadow overflow-hidden hover:shadow-md transition"
          >
            {isVideo ? (
              <video
                controls
                className="w-full h-48 object-cover"
                poster={p.thumb_url ? normalize(p.thumb_url) : undefined}
              >
                <source src={normalize(p.file_url)} type="video/mp4" />
                Twoja przeglądarka nie wspiera wideo.
              </video>
            ) : (
              <img
                className="w-full h-48 object-cover"
                src={normalize(p.thumb_url || p.file_url)}
                alt={p.title}
              />
            )}
            <div className="p-2">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-gray-600">{p.category}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
