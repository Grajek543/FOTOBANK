// src/pages/UploadPhoto.js
import React, { useState } from "react";
import { uploadFileInChunks } from "../utils/chunkUpload";

function UploadPhoto() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0.0);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Brak tokenu! Zaloguj się, aby przesłać plik.");
      return;
    }

    if (!file) {
      alert("Wybierz plik!");
      return;
    }

    try {
      await uploadFileInChunks(
        file,
        {
          title,
          description,
          category,
          price,
          media_type: file.type.startsWith("image") ? "image" : "video",
        },
        token
      );
      alert("Plik przesłany!");
      setUploadProgress(0);
      setFile(null);
      setTitle("");
      setDescription("");
      setCategory("");
      setPrice(0.0);
    } catch (err) {
      console.error(err);
      alert("Błąd podczas wysyłania pliku.");
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h2 className="text-2xl font-bold mb-6">Prześlij plik (zdjęcie lub wideo)</h2>
      <form onSubmit={handleUpload} className="space-y-4 max-w-md mx-auto">
        <div>
          <label className="block text-gray-700 mb-1">Tytuł:</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Opis:</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border rounded w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Kategoria:</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Cena:</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Plik (JPG/PNG/MP4):</label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="border rounded w-full px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Wyślij
        </button>
      </form>

      {uploadProgress > 0 && (
        <div className="mt-6 max-w-md mx-auto">
          <div>Wysyłanie: {uploadProgress}%</div>
          <div className="w-full bg-gray-200 rounded h-2">
            <div
              className="bg-blue-600 h-2 rounded"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPhoto;
