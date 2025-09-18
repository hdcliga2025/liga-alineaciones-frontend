// src/components/AppErrorBoundary.jsx
import { h, Component } from "preact";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  componentDidCatch(error) {
    // Evita pantalla en blanco global
    // (en producción, aquí se podría loguear a un endpoint)
    this.setState({ error });
    console.error("[AppErrorBoundary]", error);
  }
  render(props, state) {
    if (state.error) {
      return (
        <main style={{
          maxWidth: 860, margin: "40px auto", padding: 16,
          fontFamily: "Montserrat,system-ui,sans-serif", color: "#0f172a"
        }}>
          <h2 style={{ margin: "0 0 8px" }}>Produciuse un erro na aplicación</h2>
          <p style={{ margin: "0 0 12px", color: "#475569" }}>
            Actualiza a páxina. Se persiste, avísanos. A navegación quedou protexida para non caer en branco.
          </p>
          <pre style={{
            whiteSpace: "pre-wrap", background: "#fff7ed",
            border: "1px solid #ffedd5", padding: 12, borderRadius: 12, color: "#9a3412"
          }}>
            {String((state.error && state.error.stack) || state.error)}
          </pre>
        </main>
      );
    }
    return props.children;
  }
}
