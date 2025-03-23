import React from "react";
import Navbar from "./components/Navbar";
import CategoriesBar from "./components/CategoriesBar";
import Gallery from "./components/Gallery";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CategoriesBar />
      <Gallery />
      <Footer />
    </div>
  );
}

export default App;
