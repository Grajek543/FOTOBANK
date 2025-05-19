import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const sort_by = queryParams.get("sort_by") || "";
  const category_id = queryParams.get("category_id");
  const q = queryParams.get("q") || "";

  useEffect(() => {
    setLoading(true);

    const url = category_id
      ? `${API_URL}/photos/?category_id=${category_id}&sort_by=${sort_by}`
      : `${API_URL}/photos/?q=${encodeURIComponent(q)}&sort_by=${sort_by}`;

    fetch(url)
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
  }, [location.search]);

  const handleSortChange = (e) => {
    queryParams.set("sort_by", e.target.value);
    navigate(`/?${queryParams.toString()}`);
  };

  const normalize = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path.replace(/\\/g, "/");
    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path.replace(/\\/g, "/")}`;
  };

  if (loading) return <p>Ładowanie galerii…</p>;
  if (!photos.length) return <p>Brak wyników wyszukiwania.</p>;

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <label className="mr-2 text-gray-700">Sortuj według:</label>
        <select
          value={sort_by}
          onChange={handleSortChange}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="">Domyślnie</option>
          <option value="date_new">Najnowsze</option>
          <option value="popular">Najpopularniejsze</option>
          <option value="price_asc">Cena rosnąco</option>
          <option value="price_desc">Cena malejąco</option>
        </select>
      </div>

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
                <p className="text-sm text-gray-600 truncate">{p.description}</p>
                <p className="text-sm text-gray-500">{p.category}</p>
                <p className="text-sm text-gray-700 font-semibold">Cena: {p.price} zł</p>
                {isVideo && <p className="text-xs text-blue-500">[Wideo]</p>}
              </div>

            </Link>
          );
        })}
      </div>
    </div>
  );
}
