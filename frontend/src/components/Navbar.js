//src/components/Navbar.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaSearch, FaUserCircle, FaShoppingCart } from "react-icons/fa";
import api from "../api/axios";
import logo from "../images/fotobank_200x50_bt.png";
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export default function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  


  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("access_token");

      api
        .get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch(() => setUser(null));
    }
  }, [isAuthenticated]);

  // Zamykanie dropdowna przy zmianie ścieżki
  useEffect(() => {
    setDropdownOpen(false);
  }, [location]);

  // Zamykanie dropdowna przy kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Fotobank Logo" className="h-10 w-auto" />
        </Link>

        <form onSubmit={handleSearch} className="flex flex-1 mx-4">
          <input
            type="text"
            className="flex-grow border rounded-l px-3 py-1 focus:outline-none"
            placeholder="Szukaj..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-r"
          >
            <FaSearch />
          </button>
        </form>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="focus:outline-none"
                >
                  <FaUserCircle size={24} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                    <Link to="/account" className="block px-4 py-2 hover:bg-gray-100">
                      Moje konto
                    </Link>
                    <Link to="/myphotos" className="block px-4 py-2 hover:bg-gray-100">
                      Moje zdjęcia
                    </Link>
                    <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100">
                      Ustawienia
                    </Link>
                    {isAuthenticated && (
                    <Link to="/purchased" className="block px-4 py-2 hover:bg-gray-100">
                      Zakupione
                      </Link>
                      )}
                    {user?.role === "admin" && (
                      <Link to="/admin" className="block px-4 py-2 hover:bg-gray-100">
                        Panel admina
                      </Link>
                    
                    )}
                    <div
                      onClick={handleLogout}
                      role="button"
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      Wyloguj się
                    </div>
                  </div>
                )}
              </div>

              <Link to="/cart" className="relative">
                <FaShoppingCart size={20} />
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1 border rounded hover:bg-gray-100">
                Zaloguj
              </Link>
              <Link
                to="/register"
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Rejestracja
              </Link>

            </>
          )}
        </div>
      </div>
    </nav>
  );
}
