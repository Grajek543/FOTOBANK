// src/components/PhotoCard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

/**
 * @param {{ photo: object, onUpdated: () => void }} props
 */
export default function PhotoCard({ photo, onUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(photo.title);
  const [descInput, setDescInput] = useState(photo.description);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    axios
      .get(`${API_URL}/photos/categories`)
      .then((res) => setAvailableCategories(res.data))
      .catch(console.error);

    if (photo.category_ids) {
      setSelectedCategories(photo.category_ids);
    }
  }, [photo.id]);

  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const normalize = (path = "") =>
    /^https?:\/\//i.test(path)
      ? path.replace(/\\/g, "/")
      : `${API_URL}${path.startsWith("/") ? "" : "/"}${path.replace(/\\/g, "/")}`;

  const isVideo = /\.(mp4|mov|mkv)$/i.test(photo.file_url);
  const thumb = normalize(photo.thumb_url || photo.file_url);
  const fileSrc = normalize(photo.file_url);

  const saveEdit = async () => {
    try {
      await axios.put(
  `${API_URL}/photos/${photo.id}`,
  {
    photo_data: {
      title: titleInput,
      description: descInput
    },
    category_ids: selectedCategories
  },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

      setIsEditing(false);
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert("Błąd podczas zapisu zmian.");
    }
  };

  const deletePhoto = async () => {
    if (!window.confirm("Na pewno chcesz usunąć ten plik?")) return;
    try {
      await axios.delete(`${API_URL}/photos/${photo.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert("Błąd podczas usuwania.");
    }
  };

  return (
  <div
    className={`relative group bg-gray-100 rounded-xl shadow overflow-hidden ${
      isEditing ? "col-span-2 md:col-span-1 min-h-[400px]" : ""
    }`}
  >
    {isVideo ? (
      <video
        controls
        className="w-full h-48 object-cover"
        poster={thumb}
        src={fileSrc}
      />
    ) : (
      <img src={thumb} alt={photo.title} className="w-full h-48 object-cover" />
    )}

    {isEditing ? (
      <div className="absolute inset-0 bg-white/95 flex flex-col p-6 gap-4 z-10 overflow-y-auto">
        <input
          className="border rounded px-3 py-2 text-base"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="Tytuł"
        />
        <textarea
          className="border rounded px-3 py-2 h-28 resize-vertical text-base"
          value={descInput}
          onChange={(e) => setDescInput(e.target.value)}
          placeholder="Opis"
        />

        <div className="text-sm font-semibold">Kategorie:</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
          {availableCategories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.id)}
                onChange={() => toggleCategory(cat.id)}
              />
              {cat.name}
            </label>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={saveEdit}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
          >
            Zapisz
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded"
          >
            Anuluj
          </button>
        </div>
      </div>
    ) : (
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => setIsEditing(true)}
          className="bg-yellow-500 text-xs text-white px-2 py-1 rounded"
        >
          Edytuj
        </button>
        <button
          onClick={deletePhoto}
          className="bg-red-600 text-xs text-white px-2 py-1 rounded"
        >
          Usuń
        </button>
      </div>
    )}

    {!isEditing && (
      <div className="p-2">
        <h3 className="font-semibold truncate">{photo.title}</h3>
        <p className="text-sm text-gray-600 truncate">{photo.description}</p>
      </div>
    )}
  </div>
);

}
