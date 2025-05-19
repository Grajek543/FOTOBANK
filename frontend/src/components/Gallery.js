import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const sort_by = queryParams.get("sort_by") || "";
  const category_ids = queryParams.getAll("category_ids").map(Number);
  const q = queryParams.get("q") || "";
  const [priceMin, setPriceMin] = useState(queryParams.get("price_min") || "");
  const [priceMax, setPriceMax] = useState(queryParams.get("price_max") || "");

  useEffect(() => {
    fetch(`${API_URL}/photos/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Błąd ładowania kategorii:", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = `${API_URL}/photos/?${queryParams.toString()}`;
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

  const handlePriceFilter = (e) => {
    e.preventDefault();
    if (priceMin) queryParams.set("price_min", priceMin);
    else queryParams.delete("price_min");
    if (priceMax) queryParams.set("price_max", priceMax);
    else queryParams.delete("price_max");
    navigate(`/?${queryParams.toString()}`);
  };

  const handleCategoryClick = (id) => {
    const updated = [...category_ids];
    const index = updated.indexOf(id);
    if (index > -1) {
      updated.splice(index, 1);
    } else {
      updated.push(id);
    }
    queryParams.delete("category_ids");
    updated.forEach((id) => queryParams.append("category_ids", id));
    navigate(`/?${queryParams.toString()}`);
  };

  const normalize = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path.replace(/\\/g, "/");
    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path.replace(/\\/g, "/")}`;
  };

  if (loading) return <p>Ładowanie galerii…</p>;


  return (
    <div className="p-4">
      {/* KATEGORIE */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`px-3 py-1 rounded border ${
              category_ids.includes(cat.id)
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* FILTRY */}
      <form
        onSubmit={handlePriceFilter}
        className="flex flex-wrap items-center gap-4 mb-4"
      >
        <div className="flex items-center gap-2">
          <label className="text-gray-700">Sortuj:</label>
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

        <div className="flex items-center gap-2">
          <label className="text-gray-700">Cena:</label>
          <input
            type="number"
            placeholder="Od"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 w-24"
          />
          <input
            type="number"
            placeholder="Do"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 w-24"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            Filtruj
          </button>
        </div>
      </form>

      {/* GALERIA */}
      {photos.length === 0 ? (
  <p>Brak wyników wyszukiwania.</p>
) : (
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
)}

    </div>
  );
}