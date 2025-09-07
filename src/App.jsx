// src/App.jsx
import { h } from "preact";
import Router from "preact-router";

import NavBar from "./components/NavBar.jsx";
import AuthWatcher from "./components/AuthWatcher.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import ProximoPartido from "./pages/ProximoPartido.jsx";
import VindeirosPartidos from "./pages/VindeirosPartidos.jsx";
import PartidosFinalizados from "./pages/PartidosFinalizados.jsx";

function NotFound() {
  return (
    <main style={{maxWidth:1080,margin:"0 auto",padding:"16px 12px"}}>
      <h2 style={{font:"700 20px/1.2 Montserrat,system-ui",margin:"0 0 8px"}}>Páxina non atopada</h2>
      <p><a href="/dashboard">Volver ao Dashboard</a></p>
    </main>
  );
}

function WithNav(props) {
  const Cmp = props.component || (() => null);
  return (
    <>
      <NavBar currentPath={typeof window !== "undefined" ? location.pathname : ""} />
      <Cmp {...props} />
    </>
  );
}

export default function App() {
  return (
    <>
      <AuthWatcher />
      <Router>
        <WithNav path="/dashboard" component={Dashboard} />
        <WithNav path="/proximo-partido" component={ProximoPartido} />
        <WithNav path="/vindeiros-partidos" component={VindeirosPartidos} />
        <WithNav path="/partidos-finalizados" component={PartidosFinalizados} />
        <WithNav default component={NotFound} />
      </Router>
    </>
  );
}
