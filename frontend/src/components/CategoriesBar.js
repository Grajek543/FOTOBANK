import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function CategoriesBar() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/photos/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(console.error);
  }, []);

  const handleClick = (id) => {
    navigate(`/?category_id=${id}`);
  };

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-white rounded shadow mb-6">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat.id)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
