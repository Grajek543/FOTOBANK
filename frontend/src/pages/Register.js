import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:8000/users/register", {
        email,
        password,
        username,
      })
      .then((res) => {
        console.log("Odpowiedź z backendu:", res.data);
        alert("Konto założone!");

        // jeśli backend nie zwraca tokena, można to wyłączyć
        if (res.data.access_token) {
          localStorage.setItem("access_token", res.data.access_token);
        }
        if (res.data.user_id) {
          localStorage.setItem("user_id", res.data.user_id);
        }

        navigate("/account");
      })
      .catch((err) => {
        if (err.response) {
          console.error("Błąd rejestracji:", err.response.data);
          alert("Błąd rejestracji: " + err.response.data.detail);
        } else {
          console.error("Nieznany błąd:", err);
          alert("Nieznany błąd rejestracji");
        }
      });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Rejestracja</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-gray-700">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-gray-700">Nazwa użytkownika</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md"
          >
            Zarejestruj się
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
