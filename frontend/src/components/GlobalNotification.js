// src/components/GlobalNotification.js
import React, { useState, useEffect } from "react";

export default function GlobalNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const handler = (event) => {
      const { type, text } = event.detail || {};
      setMessage({ type, text });
      setIsVisible(true);
    };

    // Nasłuchujemy na zdarzenie 'showNotification'
    window.addEventListener("showNotification", handler);

    return () => {
      window.removeEventListener("showNotification", handler);
    };
  }, []);

  const closeModal = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // Klasy CSS dopasuj pod własny design; tu przykład podobny do AdminPanel
  const bgColor =
    message.type === "error"
      ? "bg-red-600"
      : message.type === "success"
      ? "bg-green-600"
      : "bg-gray-600";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg max-w-sm w-full text-center p-6">
        <p className={`mb-4 text-white ${bgColor} p-2 rounded`}>
          {message.text}
        </p>
        <button
          onClick={closeModal}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Zamknij
        </button>
      </div>
    </div>
  );
}
