import React, { useEffect, useState } from "react";
import axios from "axios";

function Home() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/photos") // endpoint GET /photos
      .then((res) => {
        setPhotos(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {[...Array(20)].map((_, index) => (
      <div key={index} className="bg-blue-200 shadow rounded h-48 flex items-center justify-center text-gray-600 border border-dashed">
        Zdjęcie {index + 1}
      </div>
    ))}
  </div>
  );
}

export default Home;
