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

import ProximoPartido from "./pages/ProximoPartido.jsx";
import VindeirosPartidos from "./pages/VindeirosPartidos.jsx";
import PartidosFinalizados from "./pages/PartidosFinalizados.jsx";
import ConvocatoriaProximo from "./pages/ConvocatoriaProximo.jsx";
import AlineacionOficial from "./pages/AlineacionOficial.jsx";
import Instruccions from "./pages/Instruccions.jsx";
import Axustes from "./pages/Axustes.jsx";
import Incidencia from "./pages/Incidencia.jsx";
import Propostas from "./pages/Propostas.jsx";

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
        <ProximoPartido path="/proximo-partido" />
        <VindeirosPartidos path="/vindeiros-partidos" />
        <PartidosFinalizados path="/partidos-finalizados" />
        <HazTu11 path="/haz-tu-11" />
        <Clasificacion path="/clasificacion" />
        <ConvocatoriaProximo path="/convocatoria-proximo" />
        <AlineacionOficial path="/alineacion-oficial" />
        <Instruccions path="/instruccions" />
        <Axustes path="/axustes" />
        <Incidencia path="/incidencia" />
        <Propostas path="/propostas" />
        <NotFound default />
      </Router>
    </>
  );
}


