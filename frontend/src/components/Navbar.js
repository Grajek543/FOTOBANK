// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaUserCircle, FaShoppingCart } from "react-icons/fa";
import axios from "axios";

export default function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // przykładowe pobranie użytkownika / koszyka
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("access_token");
      axios
        .get("http://127.0.0.1:8000/cart", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setCartCount(res.data.length))
        .catch(() => setCartCount(0));
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">
          FotoBank
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
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative focus:outline-none"
              >
                <FaUserCircle size={24} />
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg">
                    <Link
                      to="/account"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Moje konto
                    </Link>
                    <Link
                      to="/myphotos"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Moje zdjęcia
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Wyloguj się
                    </button>
                  </div>
                )}
              </button>

              <Link to="/cart" className="relative">
                <FaShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1 border rounded hover:bg-gray-100"
              >
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
