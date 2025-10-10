// src/App.jsx
import { h, Component } from "preact";
import { useState } from "preact/hooks";
import { Router } from "preact-router";
import { Suspense, lazy } from "preact/compat";

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

// ⚠️ Aislar a carga da páxina nova para que nunca rompa o resto da app
const ResultadosHistoricos = lazy(() => import("./pages/ResultadosHistoricos.jsx"));

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

/* ==== ErrorBoundary: evita pantallazos brancos ==== */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errMsg: "" };
  }
  componentDidCatch(error) {
    // Log basic, non-PII
    console.error("UI ErrorBoundary:", error);
    this.setState({ hasError: true, errMsg: (error && (error.message || "")) || "" });
  }
  render(props, state) {
    if (state.hasError) {
      return (
        <main style={{ padding: "16px", maxWidth: 880, margin: "0 auto" }}>
          <h2 style={{ margin: "0 0 6px" }}>Produciuse un erro de interface</h2>
          <p style={{ margin: 0 }}>
            Téntao de novo dende o menú. Se persiste, pecha e abre a app.
          </p>
        </main>
      );
    }
    return props.children;
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
      <Prefetcher currentPath={currentPath} />
      <VersionChecker />

      {!shouldHideNav && <NavBar currentPath={currentPath} />}

      <ErrorBoundary>
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
            <ResultadosHistoricos path="/resultados-historicos" />

            {/* Aliñación */}
            <ConvocatoriaProximo path="/convocatoria-oficial" />
            <AlineacionOficial path="/alineacion-oficial" />
            <ResultadosUltimaAlineacion path="/resultados-ultima-alineacion" />

            {/* 404 */}
            <NotFound default />
          </Router>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
