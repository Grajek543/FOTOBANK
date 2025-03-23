import React from "react";
import { FaSearch, FaUserCircle } from "react-icons/fa";

function Navbar() {
  return (
    <nav className="bg-gray-200 shadow-md px-6 py-4 flex items-center justify-between">
      {/* Logo i Search */}
      <div className="flex items-center gap-6 flex-1">
        <div className="text-2xl font-bold text-blue-600">FotoBank</div>
        <div className="relative w-full max-w-full">
          <input
            type="text"
            placeholder="Szukaj zdjęć..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* Ikony / Konto */}
      <div className="flex items-center gap-4 ml-6">
        {/* Możesz dodać przyciski np. logowania tutaj */}
        <FaUserCircle className="text-3xl text-gray-600 cursor-pointer" />
      </div>
    </nav>
  );
}

export default Navbar;
