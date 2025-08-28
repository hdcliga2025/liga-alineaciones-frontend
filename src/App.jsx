// src/App.jsx
import { h } from "preact";
import { useState } from "preact/hooks";
import { Router } from "preact-router";

import AuthWatcher from "./components/AuthWatcher.jsx";
import NavBar from "./components/NavBar.jsx";

/* PÁXINAS PÚBLICAS */
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";

/* PÁXINAS PRIVADAS */
import Dashboard from "./pages/Dashboard.jsx";
import Notificacions from "./pages/Notificacions.jsx";
import Perfil from "./pages/Perfil.jsx";
import Partidos from "./pages/Partidos.jsx";
import HazTu11 from "./pages/HazTu11.jsx";
import Clasificacion from "./pages/Clasificacion.jsx";
import Admin from "./pages/Admin.jsx";

/* UTILIDADE */
import ForceLogout from "./pages/ForceLogout.jsx";

/* 404 */
const NotFound = () => (
  <main style={{ padding: "1rem" }}>
    <h2>Páxina non atopada</h2>
    <p>
      Volver ao <a href="/login">login</a>
    </p>
  </main>
);

export default function App() {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"
  );

  // Normaliza (sen query nin hash)
  const pathOnly = currentPath.split("?")[0].split("#")[0];

  // Rutas onde NON amosar NavBar
  const HIDE_NAV_ON = new Set(["/", "/login", "/register", "/logout"]);

  return (
    <>
      <AuthWatcher />

      {!HIDE_NAV_ON.has(pathOnly) && <NavBar />}

      <Router onChange={(e) => setCurrentPath(e.url)}>
        {/* Públicas */}
        <LandingPage path="/" />
        <Login path="/login" />
        <Register path="/register" />

        {/* Utilidade */}
        <ForceLogout path="/logout" />

        {/* Privadas */}
        <Dashboard path="/dashboard" />
        <Notificacions path="/notificacions" />
        <Perfil path="/perfil" />
        <Partidos path="/partidos" />
        <HazTu11 path="/haz-tu-11" />
        <Clasificacion path="/clasificacion" />
        <Admin path="/admin" />

        {/* 404 */}
        <NotFound default />
      </Router>
    </>
  );
}
