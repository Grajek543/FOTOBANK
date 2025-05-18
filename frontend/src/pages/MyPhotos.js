// src/pages/MyPhotos.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PhotoCard from "../components/PhotoCard";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function MyPhotos() {
  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [price, setPrice] = useState(0);
  const [banned, setBanned] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    axios
      .get(`${API_URL}/photos/categories`)
      .then((res) => setAvailableCategories(res.data))
      .catch(console.error);
  }, []);

  const handleCategoryChange = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id)
        ? prev.filter((cid) => cid !== id)
        : [...prev, id]
    );
  };

  useEffect(() => {
    const flag = localStorage.getItem("banned");
    if (flag !== null) {
      setBanned(flag === "true");
    } else if (token) {
      axios
        .get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setBanned(res.data.banned))
        .catch(() => {});
    }
  }, [token]);

  const fetchPhotos = useCallback(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/photos/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPhotos(res.data))
      .catch(console.error);
  }, [token]);

  useEffect(fetchPhotos, [fetchPhotos]);

  const uploadMany = async (e) => {
  e.preventDefault();
  if (!files.length || !token) return;

  try {
    const form = new FormData();

    files.forEach((f) => {
      form.append("files", f);
      form.append("titles", f.name);
      form.append("descriptions", "");
    });

    form.append("price", price || 0);
    selectedCategoryIds.forEach((id) => form.append("category_ids", Number(id)));

    console.log("Wysyłane category_ids:", selectedCategoryIds);
    for (let pair of form.entries()) {
      console.log(pair[0], pair[1]);
    }

    await axios.post(`${API_URL}/photos/upload`, form, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setFiles([]);
    setSelectedCategoryIds([]);
    fetchPhotos();
  } catch (err) {
    console.error("uploadMany –", err.response?.status, err.response?.data);
    alert("Błąd uploadu.");
  }
};


  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Moje zdjęcia</h1>

      <form onSubmit={uploadMany} className="border p-4 rounded-xl space-y-4 shadow">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => setFiles([...e.target.files])}
          className="w-full border p-2 rounded-lg"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium mb-1">Kategorie:</label>
          <div className="grid grid-cols-2 gap-2">
            {availableCategories.map((cat) => (
              <label key={cat.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(cat.id)}
                  onChange={() => handleCategoryChange(cat.id)}
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <input
          type="number"
          step="0.01"
          placeholder="Cena"
          className="w-32 border p-2 rounded-lg"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <button
          disabled={!files.length}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Wyślij{files.length ? ` (${files.length})` : ""}
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((p) => (
          <PhotoCard key={p.id} photo={p} onUpdated={fetchPhotos} />
        ))}
      </div>
    </div>
  );
}
