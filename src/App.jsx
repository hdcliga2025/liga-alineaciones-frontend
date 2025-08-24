// src/App.jsx
import { h } from "preact";
import { Router } from "preact-router";
import AuthWatcher from "./components/AuthWatcher.jsx";
import NavBar from "./components/NavBar.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import Partidos from "./pages/Partidos.jsx";
import HazTu11 from "./pages/HazTu11.jsx";
import Clasificacion from "./pages/Clasificacion.jsx";

const NotFound = () => (
  <main style={{ padding: "1rem" }}>
    <h2>Páxina non atopada</h2>
    <p>
      Volver ao <a href="/login">login</a>
    </p>
  </main>
);

export default function App() {
  return (
    <>
      <AuthWatcher />
      <NavBar />
      <Router>
        {/* Públicas */}
        <LandingPage path="/" />
        <Login path="/login" />
        <Register path="/register" />

        {/* Privadas */}
        <Partidos path="/partidos" />
        <HazTu11 path="/haz-tu-11" />
        <Clasificacion path="/clasificacion" />

        <NotFound default />
      </Router>
    </>
  );
}

