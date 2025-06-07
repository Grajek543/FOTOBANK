// src/pages/UserPhotosAdmin.js
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PhotoCard from "../components/PhotoCard";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function UserPhotosAdmin() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const token = localStorage.getItem("access_token");

  const fetchPhotos = useCallback(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    api
      .get(`${API_URL}/photos/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPhotos(res.data))
      .catch((err) => {
        console.error(err);
        navigate("/admin");
      });
  }, [userId, token, navigate]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        Zdjęcia użytkownika {userId}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative">
            <PhotoCard photo={photo} onUpdated={fetchPhotos} />
          </div>
        ))}
        {photos.length === 0 && (
          <p className="text-center col-span-full">Brak zdjęć do wyświetlenia.</p>
        )}
      </div>
    </div>
  );
}
