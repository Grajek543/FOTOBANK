import { Photo } from "./types";

export async function listPhotos(): Promise<Photo[]> {
  const res = await fetch("http://127.0.0.1:8000/photos/");
  if (!res.ok) throw new Error("Nie można pobrać galerii");
  return res.json();
}
