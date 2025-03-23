import React from "react";

const categories = ["Krajobrazy", "Portrety", "Miasta", "Jedzenie", "Technologia", "Zwierzęta"];

function CategoriesBar() {
  return (
    <div className="bg-gray-200 px-6 py-3 flex gap-4 overflow-x-auto shadow-inner">
      {categories.map((cat, index) => (
        <button
          key={index}
          className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-blue-100 transition"
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

export default CategoriesBar;
