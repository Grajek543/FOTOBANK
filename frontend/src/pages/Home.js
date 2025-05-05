// src/pages/Home.js
import React from "react";
import Gallery from "../components/Gallery";

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl mb-4">Galeria</h1>
      <Gallery />
    </div>
  );
}