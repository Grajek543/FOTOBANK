import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaUserCircle } from "react-icons/fa";

function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Zamykamy dropdown po kliknięciu poza jego obszar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-gray-200 shadow-md px-6 py-4 flex items-center justify-between">
      {/* Lewa część: logo z linkiem do strony głównej i wyszukiwarka */}
      <div className="flex items-center gap-6 flex-1">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          FOTOBANK
        </Link>
        <div className="relative w-full max-w-full">
          <input
            type="text"
            placeholder="Szukaj zdjęć..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* Prawa część: ikona użytkownika z dropdownem */}
      <div className="relative" ref={dropdownRef}>
        <FaUserCircle
          className="text-3xl text-gray-600 cursor-pointer ml-5"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        />
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-10">
            {/* Strzałka wskazująca dropdown */}
            <div className="w-4 h-4 bg-white absolute top-0 right-4 -mt-2 transform rotate-45 shadow-md"></div>
            <Link
              to="/login"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
              onClick={() => setDropdownOpen(false)}
            >
              Zaloguj się
            </Link>
            <Link
              to="/register"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
              onClick={() => setDropdownOpen(false)}
            >
              Zarejestruj
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
