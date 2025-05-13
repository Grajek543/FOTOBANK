import React, { useState, useEffect } from "react"; 
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import CategoriesBar from "./components/CategoriesBar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UploadPhoto from "./pages/UploadPhoto";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import Cart from "./pages/Cart";
import AdminPanel from "./pages/AdminPanel"; 
import MyPhotos from "./pages/MyPhotos";
import PhotoDetails from "./pages/PhotoDetails";
import Gallery from './components/Gallery';

function AppContent() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token); 
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
      />
      {location.pathname === "/" && <CategoriesBar />}
      <main className="flex-grow px-6 py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload" element={<UploadPhoto />} />
          <Route path="/myphotos" element={<MyPhotos />} />
          <Route path="/account" element={<Account />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin" element={<AdminPanel />} /> 
          <Route path="/photo/:photoId" element={<PhotoDetails />} />
          <Route path="*" element={<div>404 w React Router / brak dopasowanej ścieżki</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

