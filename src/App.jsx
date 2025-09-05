import { h } from "preact";
import { useState } from "preact/hooks";
import { Router } from "preact-router";

import AuthWatcher from "./components/AuthWatcher.jsx";
import NavBar from "./components/NavBar.jsx";

/* Públicas */
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";

/* Privadas clásicas */
import Dashboard from "./pages/Dashboard.jsx";
import Notificacions from "./pages/Notificacions.jsx";
import Perfil from "./pages/Perfil.jsx";
import Partidos from "./pages/Partidos.jsx";
import HazTu11 from "./pages/HazTu11.jsx";
import Clasificacion from "./pages/Clasificacion.jsx";
import Admin from "./pages/Admin.jsx";

/* Próximo partido */
import ProximoPartido from "./pages/ProximoPartido.jsx";

/* NUEVAS subpáginas */
import VindeirosPartidos from "./pages/VindeirosPartidos.jsx";
import PartidosFinalizados from "./pages/PartidosFinalizados.jsx";

/* Logout forzado */
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

/* Pequeño ErrorBoundary para evitar pantalla en branco por runtime errors */
class ErrorBoundary {
  constructor(props) { this.props = props; this.state = { hasError: false, err: null }; }
  static getDerivedStateFromError(err) { return { hasError: true, err }; }
  componentDidCatch(err) { console.error("[ErrorBoundary]", err); }
  render() {
    if (this.state?.hasError) {
      return (
        <main style={{ maxWidth: 860, margin: "0 auto", padding: "16px" }}>
          <h2>Houbo un pequeno erro</h2>
          <p style={{ color: "#64748b" }}>Tenta refrescar a páxina. O contido debería seguir dispoñible.</p>
        </main>
      );
    }
    return this.props.children;
  }
}

export default function App() {
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

      <ErrorBoundary>
        <Router onChange={(e) => setCurrentPath(e.url)}>
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

          {/* Próximo partido */}
          <ProximoPartido path="/proximo-partido" />

          {/* NUEVAS rutas directas */}
          <VindeirosPartidos path="/vindeiros-partidos" />
          <PartidosFinalizados path="/partidos-finalizados" />

          {/* 404 */}
          <NotFound default />
        </Router>
      </ErrorBoundary>
    </>
  );
}
