// src/App.jsx
import { h } from "preact";
import { useState } from "preact/hooks";
import { Router } from "preact-router";

import AuthWatcher from "./components/AuthWatcher.jsx";
import NavBar from "./components/NavBar.jsx";

/* Públicas */
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";

/* Privadas */
import Dashboard from "./pages/Dashboard.jsx";
import Notificacions from "./pages/Notificacions.jsx";
import Perfil from "./pages/Perfil.jsx";
import Partidos from "./pages/Partidos.jsx";
import HazTu11 from "./pages/HazTu11.jsx";
import Clasificacion from "./pages/Clasificacion.jsx";
import Admin from "./pages/Admin.jsx";

/* Subcard Calendario → Próximo partido */
import ProximoPartido from "./pages/ProximoPartido.jsx";

/* Novas páxinas de calendario */
import VindeirosPartidos from "./pages/VindeirosPartidos.jsx";
import PartidosFinalizados from "./pages/PartidosFinalizados.jsx";

/* Logout forzado (import necesario) */
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
    typeof window !== "undefined"
      ? window.location.pathname + (window.location.search || "")
      : "/"
  );

  // Ocultar NavBar en portada y en cualquier variante de /login, /register, /logout
  const hidePrefixes = ["/login", "/register", "/logout"];
  const shouldHideNav =
    currentPath === "/" ||
    hidePrefixes.some((p) => (currentPath || "").startsWith(p));

  // Clave para remount do Router por ruta actual (inclúe query)
  const routerKey = currentPath;

  return (
    <>
      <AuthWatcher />

      {!shouldHideNav && <NavBar currentPath={currentPath} />}

      <Router
        key={routerKey}
        onChange={(e) => {
          if (e.url !== currentPath) setCurrentPath(e.url);
        }}
      >
        {/* Públicas */}
        <LandingPage path="/" />
        <Login path="/login" />
        <Register path="/register" />
        <ForceLogout path="/logout" />

        {/* Privadas */}
        <Dashboard path="/dashboard" />
        <Notificacions path="/notificacions" />
        <Perfil path="/perfil" />
        <Partidos path="/partidos" />
        <HazTu11 path="/haz-tu-11" />
        <Clasificacion path="/clasificacion" />
        <Admin path="/admin" />

        {/* Calendario */}
        <ProximoPartido path="/proximo-partido" />
        <VindeirosPartidos path="/vindeiros-partidos" />
        <PartidosFinalizados path="/partidos-finalizados" />

        {/* 404 */}
        <NotFound default />
      </Router>
    </>
  );
}

