import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function MyPhotos() {
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0.0);
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = () => {
    axios.get("http://localhost:8000/photos/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => setPhotos(res.data))
    .catch((err) => console.error(err));
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) {
      alert("Wybierz plik!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("file", file);

    axios.post("http://localhost:8000/photos/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${token}`
      }
    })
    .then(() => {
      alert("Zdjęcie dodane!");
      setFile(null);
      setTitle("");
      setDescription("");
      setCategory("");
      setPrice(0.0);
      fetchPhotos();
    })
    .catch((err) => {
      console.error(err);
      alert("Błąd dodawania zdjęcia.");
    });
  };

  const handleEdit = (photoId) => {
    axios.put(`http://localhost:8000/photos/${photoId}`, {
      title: editedTitle,
      description: editedDescription,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(() => {
      alert("Zdjęcie zaktualizowane!");
      setEditingPhotoId(null);
      fetchPhotos();
    })
    .catch((err) => {
      console.error(err);
      alert("Błąd podczas edycji zdjęcia.");
    });
  };

  const handleDelete = (photoId) => {
    if (window.confirm("Na pewno chcesz usunąć to zdjęcie?")) {
      axios.delete(`http://localhost:8000/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        alert("Zdjęcie usunięte!");
        fetchPhotos();
      })
      .catch((err) => {
        console.error(err);
        alert("Błąd podczas usuwania zdjęcia.");
      });
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Twoje zdjęcia</h2>

      <form onSubmit={handleUpload} className="space-y-4 mb-10 max-w-md">
        <div>
          <input type="text" placeholder="Tytuł" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <input type="text" placeholder="Opis" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <input type="text" placeholder="Kategoria" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <input type="number" step="0.01" placeholder="Cena" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])} className="w-full" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Dodaj zdjęcie</button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map((photo) => (
          <div key={photo.id} className="bg-gray-200 shadow rounded overflow-hidden relative p-2">
            <Link to={`/photo/${photo.id}`}>
         <img
            src={`http://localhost:8000/photos/${photo.id}/file`}
            alt={photo.title}
             className="w-full h-48 object-cover mb-2"
         />
</Link>

            {editingPhotoId === photo.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  placeholder="Nowy tytuł"
                />
                <input
                  type="text"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  placeholder="Nowy opis"
                />
                <button
                  onClick={() => handleEdit(photo.id)}
                  className="w-full bg-green-500 text-white rounded px-2 py-1 text-sm hover:bg-green-700 transition"
                >
                  Zapisz
                </button>
                <button
                  onClick={() => setEditingPhotoId(null)}
                  className="w-full bg-gray-400 text-white rounded px-2 py-1 text-sm hover:bg-gray-600 transition"
                >
                  Anuluj
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-bold">{photo.title}</h3>
                <p className="text-sm text-gray-600 truncate">{photo.description}</p>
                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => {
                      setEditingPhotoId(photo.id);
                      setEditedTitle(photo.title);
                      setEditedDescription(photo.description);
                    }}
                    className="bg-yellow-500 text-white rounded px-2 py-1 text-xs hover:bg-yellow-700 transition"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-700 transition"
                  >
                    Usuń
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyPhotos;
