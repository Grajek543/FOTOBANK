import React, { useState } from "react";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post("http://localhost:8000/users/login", {
      email,
      password,
    })
    .then((res) => {
      alert("Zalogowano!");
      console.log(response.data);
      console.log(res.data);
    })
    .catch((err) => {
      console.error(err);
      alert("Błąd logowania");
    });
  };

  return (
    <div>
      <h2>Logowanie</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label><br />
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label>Hasło:</label><br />
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <button type="submit">Zaloguj</button>
      </form>
    </div>
  );
}

export default Login;
