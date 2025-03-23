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
    <div>
      <h1>Galeria zdjęć</h1>
      <div style={{display: 'flex', flexWrap: 'wrap'}}>
        {photos.map((photo) => (
          <div key={photo.id} style={{margin: '10px'}}>
            <img src={`http://localhost:8000/${photo.file_path}`} alt={photo.title} width="200" />
            <p>{photo.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
