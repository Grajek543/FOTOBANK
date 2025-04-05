import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaUserCircle, FaShoppingCart } from "react-icons/fa";
import axios from "axios";

function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const token = localStorage.getItem("access_token");
    if (isAuthenticated && token) {
      axios
        .get("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUsername(res.data.username))
        .catch(() => setUsername(null));
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    navigate("/");
    setDropdownOpen(false);
  };

  return (
    <nav className="bg-gray-200 shadow-md px-6 py-4 flex items-center justify-between">
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

      <div className="relative flex items-center gap-4 ml-5" ref={dropdownRef}>
        <FaShoppingCart
          className="text-2xl text-gray-600 cursor-pointer"
          onClick={() => navigate("/cart")}
        />

        <div
          className="relative cursor-pointer"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
          
            const token = localStorage.getItem("access_token");
            if (isAuthenticated && token) {
              axios
                .get("http://localhost:8000/users/me", {
                  headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => setUsername(res.data.username))
                .catch(() => setUsername(null));
            }
          }}
        >
          <FaUserCircle className="text-3xl text-gray-600" />
          {isAuthenticated && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
              <svg
                className="w-2 h-2 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 5.707 10.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
        </div>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-10">
            <div className="w-4 h-4 bg-white absolute top-0 right-4 -mt-2 transform rotate-45 shadow-md"></div>

            {isAuthenticated && username && (
              <div className="px-4 py-2 text-gray-500 text-sm border-b border-gray-200">
                Zalogowano jako{" "}
                <span className="font-medium text-gray-800">{username}</span>
              </div>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  Konto
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  Ustawienia
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
