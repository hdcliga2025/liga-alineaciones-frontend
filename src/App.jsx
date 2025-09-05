import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Router, route } from "preact-router";

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

/* Próximo partido */
import ProximoPartido from "./pages/ProximoPartido.jsx";

/* NUEVAS páginas de calendario */
import VindeirosPartidos from "./pages/VindeirosPartidos.jsx";
import PartidosFinalizados from "./pages/PartidosFinalizados.jsx";

/* Utilidad para redirigir */
function Redirect({ to = "/" }) {
  useEffect(() => { route(to, true); }, [to]);
  return null;
}

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
  // ping de verificación en consola para este build
  useEffect(() => {
    // si ves este log en producción, sabes que este App.jsx está desplegado
    console.log("[ROUTES LOADED] /proximo-partido, /vindeiros-partidos, /partidos-finalizados");
  }, []);

  const [currentPath, setCurrentPath] = useState(
    typeof window !== "undefined"
      ? window.location.pathname + (window.location.search || "")
      : "/"
  );

  const hidePrefixes = ["/login", "/register", "/logout"];
  const shouldHideNav =
    currentPath === "/" ||
    hidePrefixes.some((p) => (currentPath || "").startsWith(p));

  return (
    <>
      <AuthWatcher />
      {!shouldHideNav && <NavBar currentPath={currentPath} />}

      <Router onChange={(e) => setCurrentPath(e.url)}>
        {/* Públicas */}
        <LandingPage path="/" />
        <Login path="/login" />
        <Register path="/register" />
        {/* alias viejo por si acaso */}
        <Redirect path="/force-logout" to="/logout" />
        {/* Logout forzado */}
        <Redirect path="/salir" to="/logout" />
        <Redirect path="/cerrar" to="/logout" />
        <Redirect path="/logout" to="/logout" />
        <Redirect path="/out" to="/logout" />
        {/* Si tuvieras un componente ForceLogout, déjalo así: */}
        {/* <ForceLogout path="/logout" /> */}

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

        {/* Rutas nuevas + alias cortos por seguridad */}
        <VindeirosPartidos path="/vindeiros-partidos" />
        <VindeirosPartidos path="/vindeiros" />

        <PartidosFinalizados path="/partidos-finalizados" />
        <PartidosFinalizados path="/finalizados" />

        {/* Redirecciones defensivas por si algo quedó enlazado antiguo */}
        <Redirect path="/proximos" to="/vindeiros-partidos" />
        <Redirect path="/proximos-partidos" to="/vindeiros-partidos" />
        <Redirect path="/historico" to="/partidos-finalizados" />

        {/* 404 */}
        <NotFound default />
      </Router>
    </>
  );
}
