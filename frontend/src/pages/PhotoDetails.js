import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function PhotoDetails() {
  const { photoId } = useParams();
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:8000/photos/${photoId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
      }
    })
    .then((res) => setPhoto(res.data))
    .catch((err) => console.error(err));
  }, [photoId]);

  if (!photo) {
    return <div className="p-6">Ładowanie zdjęcia...</div>;
  }

  return (
    <div className="p-6 flex flex-col items-center">
      <img
        src={`http://localhost:8000/photos/${photoId}/file`}
        alt={photo.title}
        className="max-w-5xl w-full h-auto object-contain mb-6 shadow-lg"
      />
      <div className="max-w-3xl w-full space-y-4">
        <h2 className="text-3xl font-bold">{photo.title}</h2>
        <p className="text-lg text-gray-700">{photo.description}</p>
        <p className="text-md text-gray-500">Kategoria: {photo.category}</p>
        <p className="text-md text-gray-500">Cena: {photo.price} zł</p>
        <p className="text-md text-gray-500">Autor: {photo.owner_username}</p>
      </div>
    </div>
  );
}

export default PhotoDetails;
