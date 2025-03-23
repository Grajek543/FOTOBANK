import React from "react";
import Navbar from "./components/Navbar";
import CategoriesBar from "./components/CategoriesBar";
import Gallery from "./components/Gallery";
import Footer from "./components/Footer";
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import UploadPhoto from './pages/UploadPhoto';


function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Strona główna</Link> |{" "}
        <Link to="/register">Rejestracja</Link> |{" "}
        <Link to="/login">Logowanie</Link> |{" "}
        <Link to="/upload">Prześlij zdjęcie</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/upload" element={<UploadPhoto />} />
      </Routes>
    </BrowserRouter>
    
    
  );
}

export default App;
