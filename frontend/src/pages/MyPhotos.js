// src/pages/MyPhotos.js
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PhotoCard from "../components/PhotoCard";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function MyPhotos() {
  const [photos, setPhotos]   = useState([]);
  const [files, setFiles]     = useState([]);
  const [category, setCategory] = useState("");
  const [price, setPrice]       = useState(0);
  const [banned, setBanned]     = useState(false);

  const token = localStorage.getItem("access_token");

  /* ───────────── sprawdzenie blokady ───────────── */
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

  /* ───────────── pobieranie listy ──────────────── */
  const fetchPhotos = useCallback(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/photos/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPhotos(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  /* ───────────── upload wielu plików ───────────── */
  const uploadMany = async (e) => {
    e.preventDefault();
    if (!files.length || banned) return;

    try {
      for (const file of files) {
        const form = new FormData();
        form.append("title", file.name);
        form.append("description", "");
        form.append("category", category);
        form.append("price", price);
        form.append("file", file);

        await axios.post(`${API_URL}/photos/upload`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }
      setFiles([]);
      fetchPhotos();
    } catch (err) {
      console.error(err);
      alert("Błąd podczas uploadu.");
    }
  };

  /* ───────────── render ───────────── */
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Moje zdjęcia</h1>

      {/* formularz uploadu */}
      {!banned ? (
        <form
          onSubmit={uploadMany}
          className="border p-4 rounded-xl space-y-4 shadow"
        >
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => setFiles([...e.target.files])}
            className="w-full border p-2 rounded-lg"
          />
          <div className="flex gap-4">
            <input
              placeholder="Kategoria"
              className="flex-1 border p-2 rounded-lg"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Cena"
              className="w-32 border p-2 rounded-lg"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <button
            disabled={!files.length}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            Wyślij&nbsp;{files.length ? `(${files.length})` : null}
          </button>
        </form>
      ) : (
        <p className="text-red-600 font-semibold">
          Zostałeś zablokowany – nie możesz dodawać nowych zdjęć.
        </p>
      )}

      {/* lista miniatur */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((p) => (
          <PhotoCard key={p.id} photo={p} onUpdated={fetchPhotos} />
        ))}
      </div>
    </div>
  );
}
