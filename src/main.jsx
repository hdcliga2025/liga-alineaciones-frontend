// src/main.jsx
import { h, render } from "preact";
import App from "./App.jsx";

/* Importa estilos globais existentes */
import "./styles/index.css";
/* 👉 Importa Montserrat para toda a app */
import "./styles/fonts.css";

render(<App />, document.getElementById("app"));
