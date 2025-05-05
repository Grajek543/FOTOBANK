// frontend/src/api/upload.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/photos",
  withCredentials: true,
});

/** Zwraca rekord PhotoOut */
export async function uploadMedia({ file, title, description = "", category = "", price = 0 }) {
  const form = new FormData();
  form.append("file", file);
  form.append("title", title);
  form.append("description", description);
  form.append("category", category);
  form.append("price", price);

  const res = await API.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/** Źródło do <video src={...}> */
export function videoSrc(id) {
  return `${API.defaults.baseURL}/stream/${id}`;
}

/** Ścieżka do miniatury */
export function thumbSrc(photo) {
  return photo.thumb_path
    ? `${API.defaults.baseURL}/media/thumbs/${photo.thumb_path.split("/").pop()}`
    : null;
}
