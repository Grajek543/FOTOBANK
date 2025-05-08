import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const q = queryParams.get("q") || "";
    console.log("Zapytanie z URL:", q);

    setLoading(true);
    fetch(`${API_URL}/photos/?q=${encodeURIComponent(q)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Błąd zapytania: " + r.status);
        return r.json();
      })
      .then((data) => {
        setPhotos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, [location.search]); // ← reaguje na ?q=

  if (loading) return <p>Ładowanie galerii…</p>;
  if (!photos.length) return <p>Brak wyników wyszukiwania.</p>;

  const normalize = (path) =>
    path ? `${API_URL}${path.startsWith("/") ? "" : "/"}${path.replace(/\\/g, "/")}` : "";

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
              <video controls className="w-full h-48 object-cover">
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
              {isVideo && <p className="text-xs text-blue-500">[Wideo]</p>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
