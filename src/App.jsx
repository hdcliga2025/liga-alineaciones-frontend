// src/App.jsx
import { h } from "preact";
import { useState } from "preact/hooks";
import { Router } from "preact-router";

import AuthWatcher from "./components/AuthWatcher.jsx";
import NavBar from "./components/NavBar.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Partidos from "./pages/Partidos.jsx";
import HazTu11 from "./pages/HazTu11.jsx";
import Clasificacion from "./pages/Clasificacion.jsx";

/* Subpáxinas existentes */
import ProximoPartido from "./pages/ProximoPartido.jsx";
import VindeirosPartidos from "./pages/VindeirosPartidos.jsx";
import PartidosFinalizados from "./pages/PartidosFinalizados.jsx";
import ConvocatoriaProximo from "./pages/ConvocatoriaProximo.jsx";
import AlineacionOficial from "./pages/AlineacionOficial.jsx";
import Instruccions from "./pages/Instruccions.jsx";

/* Novas entradas para a topbar */
import Perfil from "./pages/Perfil.jsx";
import Notificacions from "./pages/Notificacions.jsx";

/* (opcional) alias antigo /axustes -> perfil para non romper enlaces */
const AxustesAlias = () => { 
  if (typeof window !== "undefined") {
    import("preact-router").then(({ route }) => route("/perfil", true));
  }
  return null;
};

const NotFound = () => (
  <main style={{ padding: "1rem" }}>
    <h2>Páxina non atopada</h2>
    <p>Volver ao <a href="/login">login</a></p>
  </main>
);

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  return (
    <>
      <AuthWatcher />
      <NavBar currentPath={currentPath} />
      <Router onChange={(e) => setCurrentPath(e.url)}>
        {/* Públicas */}
        <LandingPage path="/" />
        <Login path="/login" />
        <Register path="/register" />

        {/* Privadas */}
        <Dashboard path="/dashboard" />
        <Partidos path="/partidos" />
        <HazTu11 path="/haz-tu-11" />
        <Clasificacion path="/clasificacion" />

        {/* Sub-UX de cards */}
        <ProximoPartido path="/proximo-partido" />
        <VindeirosPartidos path="/vindeiros-partidos" />
        <PartidosFinalizados path="/partidos-finalizados" />
        <ConvocatoriaProximo path="/convocatoria-proximo" />
        <AlineacionOficial path="/alineacion-oficial" />
        <Instruccions path="/instruccions" />

        {/* Topbar shortcuts */}
        <Perfil path="/perfil" />
        <Notificacions path="/notificacions" />
        <AxustesAlias path="/axustes" />

        <NotFound default />
      </Router>
    </>
  );
}


