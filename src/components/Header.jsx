// src/components/Header.jsx
import { h } from "preact";
import { Link } from "preact-router/match";

export default function Header() {
  return (
    <header
      style={{
        padding: "10px",
        background: "#004080",
        color: "white",
        display: "flex",
        gap: "20px",
      }}
    >
      <nav>
        <Link activeClassName="active" href="/">
          Inicio
        </Link>{" "}
        |{" "}
        <Link activeClassName="active" href="/partidos">
          Partidos
        </Link>{" "}
        |{" "}
        <Link activeClassName="active" href="/haztu11">
          Fai o teu 11
        </Link>{" "}
        |{" "}
        <Link activeClassName="active" href="/clasificacion">
          Clasificación
        </Link>
      </nav>
    </header>
  );
}
