// src/components/VideoPlayer.tsx
import { useState } from "react";

interface Props {
  src: string;      // /photos/{id}/file
  poster?: string;  // miniatura
}

export default function VideoPlayer({ src, poster }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <img
        src={poster}
        className="w-full cursor-pointer rounded-lg shadow"
        onClick={() => setOpen(true)}
        alt="miniatura wideo"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      {/* kliknięcie tła zamyka */}
      <div className="absolute inset-0" onClick={() => setOpen(false)} />
      <video
        src={src}
        poster={poster}
        className="relative max-h-[80vh] max-w-[90vw] rounded-xl shadow-xl"
        controls
        autoPlay
      />
    </div>
  );
}
