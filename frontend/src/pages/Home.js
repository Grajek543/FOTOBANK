import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Home() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/photos")
      .then((res) => {
        setPhotos(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {photos.map((photo) => (
        <div key={photo.id} className="bg-gray-200 shadow rounded overflow-hidden">
          <Link to={`/photo/${photo.id}`}>
           <img
              src={`http://localhost:8000/photos/${photo.id}/file`}
             alt={photo.title}
             className="w-full h-48 object-cover mb-2"
           />
</Link>
          <div className="p-2">
            <h3 className="font-bold">{photo.title}</h3>
            <p className="text-sm text-gray-600 truncate">{photo.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Home;
