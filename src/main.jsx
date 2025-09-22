// src/main.jsx
import { h, render } from "preact";
import App from "./App.jsx";

const mount = document.getElementById("app");
render(<App />, mount);
