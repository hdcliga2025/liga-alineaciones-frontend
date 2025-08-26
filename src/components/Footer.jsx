// src/components/Footer.jsx
import { h } from "preact";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        marginTop: "auto",
        width: "100%",
        textAlign: "center",
        padding: "14px 8px 16px",
        fontSize: "12px",
        color: "#64748b",
        borderTop: "1px solid #e5e7eb",
        background: "#ffffff",
        fontFamily:
          "'Montserrat', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
      }}
    >
      © {year} Heredéirxs do Celta | Feito por Iago Fernández
    </footer>
  );
}
