// src/components/ErrorBoundary.jsx
import { h, Component } from "preact";

export default class ErrorBoundary extends Component {
  constructor(props){
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error){
    this.setState({ error });
    console.error("[ErrorBoundary]", error);
  }

  render(props, state){
    if (state.error) {
      return (
        <main style={{ maxWidth: 860, margin: "40px auto", padding: 16, fontFamily: "Montserrat, system-ui, sans-serif", color: "#0f172a" }}>
          <h2 style={{ margin: "0 0 8px" }}>Produciuse un erro na páxina</h2>
          <p style={{ margin: "0 0 12px", color:"#475569" }}>
            Téntao de novo. Se persiste, avísanos. Detalles na consola.
          </p>
          <pre style={{ whiteSpace:"pre-wrap", background:"#fff7ed", border:"1px solid #ffedd5", padding:12, borderRadius:12, color:"#9a3412", overflow:"auto" }}>
            {String((state.error && state.error.stack) || state.error)}
          </pre>
        </main>
      );
    }
    return props.children;
  }
}
