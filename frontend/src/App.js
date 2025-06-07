// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GlobalNotification from "./components/GlobalNotification";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import Cart from "./pages/Cart";
import AdminPanel from "./pages/AdminPanel";
import MyPhotos from "./pages/MyPhotos";
import PhotoDetails from "./pages/PhotoDetails";
import Gallery from "./components/Gallery";
import Activate from "./pages/Activate";
import RequestReset from "./pages/RequestReset";
import ResetPassword from "./pages/ResetPassword";
import PaypalSuccess from "./pages/PaypalSuccess";
import PurchasedPhotos from "./pages/PurchasedPhotos";
import UserPhotosAdmin from "./pages/UserPhotosAdmin";

import api from "./api/axios";

function AppContent() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("role");
    setIsAuthenticated(!!token);
    setUserRole(role);

    if (token) {
      api
        .get("/cart/count", {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => setCartCount(res.data.count))
        .catch(() => setCartCount(0));
    }
  }, [location]);

  useEffect(() => {
    const handleCartUpdate = (e) => setCartCount(e.detail);
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GlobalNotification />

      <Navbar
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
        cartCount={cartCount}
        setCartCount={setCartCount}
      />

      <main className="flex-grow px-6 py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/register" element={<Register />} />
          <Route path="/myphotos" element={<MyPhotos />} />
          <Route path="/account" element={<Account />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/activate" element={<Activate />} />
          <Route path="/forgot" element={<RequestReset />} />
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/paypal-success" element={<PaypalSuccess />} />
          <Route path="/purchased" element={<PurchasedPhotos />} />
          <Route path="/admin" element={userRole === "admin" ? <AdminPanel /> : <Navigate to="/" />} />
          <Route path="/admin/users/:userId/photos" element={userRole === "admin" ? <UserPhotosAdmin /> : <Navigate to="/" />} />
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
