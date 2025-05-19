import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import PhotoCard from "../components/PhotoCard";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function MyPhotos() {
  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [photoData, setPhotoData] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [progress, setProgress] = useState({});
  const token = localStorage.getItem("access_token");
  const inputRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/photos/categories`)
      .then((res) => setAvailableCategories(res.data))
      .catch(console.error);
  }, []);

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

  const handleSelect = (e) => {
    const selected = [...e.target.files];
    setFiles(selected);
    setProgress({});
    setPhotoData(
      selected.map((file) => ({
        title: file.name,
        description: "",
        price: 0,
        category_ids: [],
      }))
    );
  };

  const updatePhotoField = (idx, field, value) => {
    setPhotoData((prev) => {
      const copy = [...prev];
      copy[idx][field] = value;
      return copy;
    });
  };

  const toggleCategory = (idx, catId) => {
    setPhotoData((prev) => {
      const copy = [...prev];
      const list = copy[idx].category_ids;
      copy[idx].category_ids = list.includes(catId)
        ? list.filter((id) => id !== catId)
        : [...list, catId];
      return copy;
    });
  };

  const uploadMany = async (e) => {
    e.preventDefault();
    if (!files.length || !token) return;

    try {
      for (let idx = 0; idx < files.length; idx++) {
        const form = new FormData();
        form.append("titles", photoData[idx].title);
        form.append("descriptions", photoData[idx].description);
        form.append("price", photoData[idx].price || 0);
        form.append("files", files[idx]);

        photoData[idx].category_ids.forEach((catId) =>
          form.append("category_ids", catId)
        );

        await axios.post(`${API_URL}/photos/upload`, form, {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / e.total);
            setProgress((prev) => ({ ...prev, [idx]: percent }));
          },
        });
      }

      setFiles([]);
      setPhotoData([]);
      setProgress({});
      if (inputRef.current) inputRef.current.value = "";
      fetchPhotos();
      alert("Wysłano!");
    } catch (err) {
      console.error("uploadMany –", err.response?.status, err.response?.data);
      alert("Błąd uploadu.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Moje zdjęcia</h1>

      <form onSubmit={uploadMany} className="border p-4 rounded-xl space-y-6 shadow">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleSelect}
          className="w-full border p-2 rounded-lg"
        />

        {files.map((file, idx) => (
          <div key={file.name} className="border p-4 rounded bg-white shadow space-y-2">
            <h2 className="font-semibold">{file.name}</h2>

            <input
              type="text"
              value={photoData[idx]?.title}
              onChange={(e) => updatePhotoField(idx, "title", e.target.value)}
              placeholder="Tytuł"
              className="w-full border p-2 rounded"
            />

            <textarea
              value={photoData[idx]?.description}
              onChange={(e) => updatePhotoField(idx, "description", e.target.value)}
              placeholder="Opis"
              className="w-full border p-2 rounded"
            />

            <input
              type="number"
              value={photoData[idx]?.price}
              onChange={(e) =>
                updatePhotoField(idx, "price", parseFloat(e.target.value))
              }
              placeholder="Cena"
              className="w-32 border p-2 rounded"
              min="0"
              step="0.01"
            />

            <div className="text-sm font-medium">Kategorie:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-32 overflow-auto text-sm">
              {availableCategories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={photoData[idx]?.category_ids.includes(cat.id)}
                    onChange={() => toggleCategory(idx, cat.id)}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>
        ))}

        {files.length > 0 && (
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
            Wyślij ({files.length})
          </button>
        )}
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((p) => (
          <PhotoCard key={p.id} photo={p} onUpdated={fetchPhotos} />
        ))}
      </div>
    </div>
  );
}
