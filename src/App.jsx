// src/App.jsx
import { h } from "preact";
import { useState } from "preact/hooks";
import { Router } from "preact-router";
import { Suspense } from "preact/compat";

import AuthWatcher from "./components/AuthWatcher.jsx";
import NavBar from "./components/NavBar.jsx";

// Fallback ultra-lixeiro e utilidades de perf
import PageLoader from "./components/PageLoader.jsx";
import Prefetcher from "./components/Prefetcher.jsx";
import VersionChecker from "./components/VersionChecker.jsx";

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

/* Subcards / novas páxinas */
import ProximoPartido from "./pages/ProximoPartido.jsx";
import VindeirosPartidos from "./pages/VindeirosPartidos.jsx";
import PartidosFinalizados from "./pages/PartidosFinalizados.jsx";

/* Páginas aliñación */
import ConvocatoriaProximo from "./pages/ConvocatoriaProximo.jsx";
import AlineacionOficial from "./pages/AlineacionOficial.jsx";
import ResultadosUltimaAlineacion from "./pages/ResultadosUltimaAlineacion.jsx";

/* Logout forzado */
import ForceLogout from "./pages/ForceLogout.jsx";

/* 404 */
const NotFound = () => (
  <main style={{ padding: "1rem" }}>
    <h2>Páxina non atopada</h2>
    <p>Volver ao <a href="/login">login</a></p>
  </main>
);

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
      <Prefetcher currentPath={currentPath} />
      <VersionChecker />

      {!shouldHideNav && <NavBar currentPath={currentPath} />}

      <Suspense fallback={<PageLoader />}>
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

          {/* Subcards */}
          <ProximoPartido path="/proximo-partido" />
          <VindeirosPartidos path="/vindeiros-partidos" />
          <PartidosFinalizados path="/partidos-finalizados" />

          {/* Aliñación */}
          <ConvocatoriaProximo path="/convocatoria-oficial" />
          <AlineacionOficial path="/alineacion-oficial" />
          <ResultadosUltimaAlineacion path="/resultados-ultima-alineacion" />

          {/* 404 */}
          <NotFound default />
        </Router>
      </Suspense>
    </>
  );
}
