import axios from "axios";

export async function uploadFileInChunks(file, meta, token) {
  const CHUNK = 1024 * 1024;
  const totalChunks = Math.ceil(file.size / CHUNK);
  const { data } = await axios.post("http://localhost:8000/media/init", {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const uploadId = data.upload_id;
  const order = [];
  for (let i = 1; i <= totalChunks; i += 2) order.push(i);
  for (let i = 2; i <= totalChunks; i += 2) order.push(i);

  for (const idx of order) {
    const start = (idx - 1) * CHUNK;
    const end = Math.min(start + CHUNK, file.size);
    const blob = file.slice(start, end);
    const form = new FormData();
    form.append("upload_id", uploadId);
    form.append("chunk_index", idx);
    form.append("total_chunks", totalChunks);
    form.append("file", new File([blob], file.name));
    if (idx === 1) {
      Object.entries(meta).forEach(([k, v]) => form.append(k, v));
    }
    await axios.post("http://localhost:8000/media/upload-chunk", form, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}
