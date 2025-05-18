//src/pages/UploadPhoto.js
import { useEffect, useRef, useState } from "react";
import axios from "../api/axios";

export default function UploadPhoto() {
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [price, setPrice] = useState(0);
  const [progress, setProgress] = useState({});
  const inputRef = useRef(null);

  // pobranie dostępnych kategorii z API
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
    setFiles([...e.target.files]);
    setProgress({});
  };

  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleUpload = async () => {
    if (!files.length || !selectedCategories.length) return;

    try {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      form.append("price", price);

      selectedCategories.forEach((catId) => form.append("category_ids", catId));
      files.forEach((file) => form.append("titles", file.name));
      files.forEach(() => form.append("descriptions", "")); // Puste opisy

      await axios.post("/photos/upload", form, {
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress({ all: percent });
        },
      });

      alert("Wysłano!");
      setFiles([]);
      setSelectedCategories([]);
      setProgress({});
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Błąd przesyłania.");
    }
  };

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

        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
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

        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Cena"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-32 border p-2 rounded-lg"
        />

        <button
          onClick={handleUpload}
          disabled={!files.length || !selectedCategories.length}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Wyślij ({files.length})
        </button>

        {/* pasek postępu globalny */}
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
    </div>
  );
}
