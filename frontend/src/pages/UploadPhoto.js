import React, { useState } from "react";
import axios from "axios";

function UploadPhoto() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(0.0);
  const [file, setFile] = useState(null);

  const handleUpload = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Brak tokenu! Zaloguj się, aby przesłać zdjęcie.");
      return;
    }

    if(!file) {
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
    .then((res) => {
      alert("Zdjęcie przesłane!");
      console.log(res.data);
    })
    .catch((err) => {
      alert("Błąd wysyłania zdjęcia");
      console.error(err);
    });
  };

  return (
    <div>
      <h2>Prześlij zdjęcie</h2>
      <form onSubmit={handleUpload}>
        <div>
          <label>Tytuł:</label><br />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label>Opis:</label><br />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label>Kategoria:</label><br />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div>
          <label>Cena:</label><br />
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div>
          <label>Plik (JPEG/PNG):</label><br />
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <button type="submit">Wyślij</button>
      </form>
    </div>
  );
}

export default UploadPhoto;
