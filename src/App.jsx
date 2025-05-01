import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./router/AppRouter";
import "./App.css";
import { CompanyListProvider } from "./contextos/company-list-context";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Ping al servidor cada 5 minutos para mantenerlo activo
    const pingServer = () => {
      fetch("https://controldocc.onrender.com/api/ping")
        .then(() => console.log("Servidor Render activado"))
        .catch(() => console.warn("No se pudo activar Render"));
    };

    pingServer(); // Primer ping al cargar
    const interval = setInterval(pingServer, 5 * 60 * 1000); // Cada 5 minutos

    return () => clearInterval(interval); // Limpiar al desmontar
  }, []);

  return (
    <CompanyListProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </CompanyListProvider>
  );
}

export default App;