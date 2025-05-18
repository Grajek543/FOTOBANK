// src/pages/UploadPhoto.js
import { useEffect, useRef, useState } from "react";
import axios from "../api/axios";

export default function UploadPhoto() {
  const [files, setFiles] = useState([]);
  const [photoData, setPhotoData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [progress, setProgress] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    axios
      .get("/photos/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => {
        console.error("Błąd ładowania kategorii", err);
        setCategories([]);
      });
  }, []);

  const handleSelect = (e) => {
    const selectedFiles = [...e.target.files];
    setFiles(selectedFiles);
    setProgress({});
    setPhotoData(
      selectedFiles.map((file) => ({
        title: file.name,
        description: "",
        price: 0,
        category_ids: [],
      }))
    );
  };

  const handleUpload = async () => {
    if (!files.length) return;
    try {
      const form = new FormData();
      files.forEach((file, idx) => {
        form.append("files", file);
        form.append("titles", photoData[idx].title);
        form.append("descriptions", photoData[idx].description);
      });
      form.append("price", 0); // global price już nieużywany
      photoData.forEach((data) =>
        data.category_ids.forEach((cat) => form.append("category_ids", cat))
      );

      await axios.post("/photos/upload", form, {
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress({ all: percent });
        },
      });

      alert("Wysłano!");
      setFiles([]);
      setPhotoData([]);
      setProgress({});
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Błąd przesyłania.");
    }
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Dodaj zdjęcia / wideo</h1>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleSelect}
        className="w-full border p-2 rounded-lg"
      />

      <div className="space-y-6">
        {files.map((file, idx) => (
          <div
            key={file.name}
            className="border p-4 rounded-xl bg-white shadow space-y-2"
          >
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
              onChange={(e) => updatePhotoField(idx, "price", parseFloat(e.target.value))}
              placeholder="Cena"
              className="w-32 border p-2 rounded"
              min="0"
              step="0.01"
            />

            <div className="text-sm font-medium">Kategorie:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-32 overflow-auto text-sm">
              {categories.map((cat) => (
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
      </div>

      {files.length > 0 && (
        <button
          onClick={handleUpload}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
        >
          Wyślij ({files.length})
        </button>
      )}

      {progress.all && (
        <div className="space-y-1">
          <span className="text-sm">Wysyłanie plików...</span>
          <div className="w-full h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-blue-600 rounded"
              style={{ width: `${progress.all}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
