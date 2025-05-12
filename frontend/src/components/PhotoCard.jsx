// src/components/PhotoCard.jsx
import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

/**
 * @param {{ photo: object, onUpdated: () => void }} props
 */
export default function PhotoCard({ photo, onUpdated }) {
  const [isEditing, setIsEditing]       = useState(false);
  const [titleInput, setTitleInput]     = useState(photo.title);
  const [descInput, setDescInput]       = useState(photo.description);
  const token = localStorage.getItem("access_token");

  const normalize = (path = "") =>
    /^https?:\/\//i.test(path)
      ? path.replace(/\\/g, "/")
      : `${API_URL}${path.startsWith("/") ? "" : "/"}${path.replace(/\\/g, "/")}`;

  const isVideo = /\.(mp4|mov|mkv)$/i.test(photo.file_url);
  const thumb   = normalize(photo.thumb_url || photo.file_url);
  const fileSrc = normalize(photo.file_url);

  // ---- akcje ------------------------------------------------------------
  const saveEdit = async () => {
    try {
      await axios.put(
        `${API_URL}/photos/${photo.id}`,
        { title: titleInput, description: descInput },
        { headers: { Authorization: `Bearer ${token}` } }
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

  // ---- widok ------------------------------------------------------------
  return (
    <div className="relative group bg-gray-100 rounded-xl shadow overflow-hidden">
      {/* miniatura / wideo */}
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

      {/* tryb edycji ------------------------------------------------------ */}
      {isEditing ? (
        <div className="absolute inset-0 bg-white/95 flex flex-col p-4 gap-2">
          <input
            className="border rounded px-2 py-1"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Tytuł"
          />
          <textarea
            className="border rounded px-2 py-1 flex-1 resize-none"
            value={descInput}
            onChange={(e) => setDescInput(e.target.value)}
            placeholder="Opis"
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1 rounded"
            >
              Zapisz
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-1 rounded"
            >
              Anuluj
            </button>
          </div>
        </div>
      ) : (
        /* przyciski – pojawiają się dopiero przy najechaniu ----------------*/
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

      {/* opis pod miniaturą ------------------------------------------------*/}
      {!isEditing && (
        <div className="p-2">
          <h3 className="font-semibold truncate">{photo.title}</h3>
          <p className="text-sm text-gray-600 truncate">{photo.description}</p>
        </div>
      )}
    </div>
  );
}
