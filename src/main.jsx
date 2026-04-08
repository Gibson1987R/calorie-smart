import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Error inesperado al cargar la app",
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#020617",
            color: "#f8fafc",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            fontFamily: "Segoe UI, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "720px",
              width: "100%",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "24px",
              padding: "24px",
              background: "rgba(15,23,42,0.9)",
            }}
          >
            <h1 style={{ marginTop: 0 }}>La app encontro un error al iniciar</h1>
            <p>Detalle: {this.state.message}</p>
            <p>Recarga la pagina despues del ajuste o comparte este mensaje.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
