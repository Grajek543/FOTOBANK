import { useState, useRef } from "react";
import axios from "../api/axios";          // axios instance z tokenem i baseURL
import uploadFileInChunks from "../utils/chunkUpload"; // funkcja do wysyłki na kawałki

/**
 * Komponent jednego ekranu – masowy upload zdjęć/wideo z paskami postępu.
 */
export default function UploadPhoto() {
  const [files, setFiles] = useState([]);
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [progress, setProgress] = useState({});  // { filename: pct }
  const inputRef = useRef(null);

  /* ---------------------------- helpers ---------------------------- */
  const handleSelect = (e) => {
    setFiles([...e.target.files]);
    setProgress({});
  };

  const handleUpload = async () => {
    if (!files.length) return;

    try {
      for (const file of files) {
        // local progress updater
        const onChunkProgress = (pct) =>
          setProgress((prev) => ({ ...prev, [file.name]: pct }));

        // wysyłka w kawałkach (opcjonalnie) – ZAMIEN na prosty axios.post jeśli nie potrzebujesz chunków
        await uploadFileInChunks(file, {
          title: file.name,
          description: "",
          category,
          price,
          media_type: file.type.startsWith("image") ? "image" : "video",
        }, null, onChunkProgress);
      }

      alert("Wysłano wszystkie pliki!");
      setFiles([]);
      setProgress({});
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Błąd podczas przesyłania plików.");
    }
  };

  /* ----------------------------- render ----------------------------- */
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Dodaj zdjęcia / wideo</h1>

      <div className="space-y-4 border p-4 rounded-xl shadow">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleSelect}
          className="w-full border p-2 rounded-lg"
        />

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Kategoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 border p-2 rounded-lg"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Cena"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-32 border p-2 rounded-lg"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!files.length}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {files.length ? `Wyślij (${files.length})` : "Wybierz pliki"}
        </button>

        {/* lista postępu */}
        {files.map((f) => (
          <div key={f.name} className="space-y-1">
            <span className="text-sm">{f.name}</span>
            <div className="w-full h-2 bg-gray-200 rounded">
              <div
                className="h-2 bg-blue-600 rounded"
                style={{ width: `${progress[f.name] || 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
