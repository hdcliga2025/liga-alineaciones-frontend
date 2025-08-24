import { h } from "preact";
import "../styles/Logo.css";
import logo from "../assets/logoHDC.jpg";

export default function Logo() {
  return (
    <div className="logo-wrap" aria-label="Logo Herdeirxs do Celta">
      <img src={logo} alt="Herdeirxs do Celta" className="logo-img" />
    </div>
  );
}
