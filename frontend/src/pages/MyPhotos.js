import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axios";
import PhotoCard from "../components/PhotoCard";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const CHUNK_SIZE = 1024 * 1024;

export default function MyPhotos() {
  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [photoData, setPhotoData] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [progress, setProgress] = useState({});
  const token = localStorage.getItem("access_token");
  const inputRef = useRef(null);
  const [me, setMe] = useState(null);
  const [photoCount, setPhotoCount] = useState(0);

  // STANY na komunikat zamiast alertów
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    if (!token) return;
    api
      .get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMe(res.data))
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    api
      .get(`${API_URL}/photos/categories`)
      .then((res) => setAvailableCategories(res.data))
      .catch(console.error);
  }, []);

  const refreshPhotoCount = useCallback(() => {
    if (!token) return;
    api
      .get(`${API_URL}/photos/me/count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPhotoCount(res.data.total_photos))
      .catch(console.error);
  }, [token]);

  const fetchPhotos = useCallback(() => {
    if (!token) return;
    api
      .get(`${API_URL}/photos/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPhotos(res.data))
      .catch(console.error);
  }, [token]);

  const updatePhotosAndCount = useCallback(() => {
    fetchPhotos();
    refreshPhotoCount();
  }, [fetchPhotos, refreshPhotoCount]);

  useEffect(() => {
    fetchPhotos();
    refreshPhotoCount();
  }, [fetchPhotos, refreshPhotoCount]);

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
        const file = files[idx];
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        const startRes = await api.post(
          `${API_URL}/photos/start-upload`,
          new URLSearchParams({ total_chunks: totalChunks }),
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const uploadId = startRes.data.upload_id;

        for (let i = 0; i < totalChunks; i++) {
          const blob = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          const chunkForm = new FormData();
          chunkForm.append("upload_id", uploadId);
          chunkForm.append("chunk_index", i);
          chunkForm.append("chunk", blob);

          await api.post(`${API_URL}/photos/upload-chunk`, chunkForm, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setProgress((prev) => ({
            ...prev,
            [idx]: Math.round(((i + 1) / totalChunks) * 100),
          }));
        }

        const finishForm = new FormData();
        finishForm.append("upload_id", uploadId);
        finishForm.append("title", photoData[idx].title);
        finishForm.append("description", photoData[idx].description);
        finishForm.append("category", "");
        finishForm.append("price", photoData[idx].price);
        finishForm.append("original_filename", file.name);
        photoData[idx].category_ids.forEach((catId) =>
          finishForm.append("category_ids", catId)
        );

        await api.post(`${API_URL}/photos/finish-upload`, finishForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setFiles([]);
      setPhotoData([]);
      setProgress({});
      if (inputRef.current) inputRef.current.value = "";
      updatePhotosAndCount();

      setMessageType("success");
      setMessage("Wysłano!");
    } catch (err) {
      console.error("uploadMany –", err.response?.status, err.response?.data);
      setMessageType("error");
      setMessage("Błąd uploadu.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Moje zdjęcia</h1>

      {me?.banned ? (
        <div className="text-red-600 font-semibold text-lg border p-4 rounded-lg bg-red-100">
          Twoje konto ma zablokowaną możliwość dodawania nowych zdjęć.
        </div>
      ) : (
        <form
          onSubmit={uploadMany}
          className="border p-4 rounded-xl space-y-6 shadow"
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleSelect}
            className="w-full border p-2 rounded-lg"
          />

          {files.map((file, idx) => (
            <div
              key={file.name}
              className="border p-4 rounded bg-white shadow space-y-2"
            >
              <h2 className="font-semibold">{file.name}</h2>

              <input
                type="text"
                value={photoData[idx]?.title}
                onChange={(e) =>
                  updatePhotoField(idx, "title", e.target.value)
                }
                placeholder="Tytuł"
                className="w-full border p-2 rounded"
              />

              <textarea
                value={photoData[idx]?.description}
                onChange={(e) =>
                  updatePhotoField(idx, "description", e.target.value)
                }
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

              {progress[idx] && (
                <div className="text-sm mt-2">
                  Upload: {progress[idx]}%
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div
                      className="bg-blue-600 h-2 rounded"
                      style={{ width: `${progress[idx]}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {files.length > 0 && (
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
              Wyślij ({files.length})
            </button>
          )}

          {/* WYŚWIETLANIE KOMUNIKATU INLINE */}
          {message && (
            <p
              className={
                messageType === "error"
                  ? "mt-2 text-red-600 text-sm"
                  : "mt-2 text-green-600 text-sm"
              }
            >
              {message}
            </p>
          )}
        </form>
      )}

      <p className="text-lg font-medium">Liczba moich zdjęć: {photoCount}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((p) => (
          <PhotoCard key={p.id} photo={p} onUpdated={updatePhotosAndCount} />
        ))}
      </div>
    </div>
  );
}
