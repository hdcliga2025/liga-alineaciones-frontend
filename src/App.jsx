// src/App.jsx
import { h } from "preact";
import { Router } from "preact-router";

// 👇 nuevo: vigila sesión y redirige (login/register → /partidos si ya hay sesión)
import AuthWatcher from "./components/AuthWatcher.jsx";

// (opcional) tu barra superior con botón "Saír"
import NavBar from "./components/NavBar.jsx";

// Páginas / componentes de tu app
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import Partidos from "./pages/Partidos.jsx";
import HazTu11 from "./pages/HazTu11.jsx";
import Clasificacion from "./pages/Clasificacion.jsx";

// 404 simple
const NotFound = () => (
  <main style={{ padding: "1rem" }}>
    <h2>Páxina non atopada</h2>
    <p>Volver ao <a href="/login">login</a></p>
  </main>
);

export default function App() {
  return (
    <>
      {/* Se monta sempre: xestiona redirección automática por sesión */}
      <AuthWatcher />

      {/* Opcional: mostra a túa navbar en todas as pantallas */}
      <NavBar />

      <Router>
        {/* Rutas públicas */}
        <LandingPage path="/" />
        <Login path="/login" />
        <Register path="/register" />

        {/* Rutas privadas (o AuthWatcher devolverache a /login se non hai sesión) */}
        <Partidos path="/partidos" />
        <HazTu11 path="/haz-tu-11" />
        <Clasificacion path="/clasificacion" />

        {/* 404 */}
        <NotFound default />
      </Router>
    </>
  );
}
