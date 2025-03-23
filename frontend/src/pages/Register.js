import React, { useState } from "react";
import axios from "axios";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    axios.post("http://localhost:8000/users/register", {
      email,      // np. userEmail="test@example.com"
      password, // np. userPassword="secret123"
    })
    .then((res) => {
      alert("Konto założone!");
      console.log(res.data);
    })
    .catch((err) => {
      alert("Błąd rejestracji");
      console.error(err);
    });
  };

  return (
    <div>
      <h2>Rejestracja</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label>Email:</label><br />
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label>Hasło:</label><br />
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <button type="submit">Zarejestruj</button>
      </form>
    </div>
  );
}

export default Register;
