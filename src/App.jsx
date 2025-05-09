import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./router/AppRouter";
import "./App.css";
import { CompaniesProvider } from "./context/CompaniesContext";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Ping al servidor cada 5 minutos para mantenerlo activo
    const pingServer = async () => {
      try {
        const res = await fetch('https://controldocc.onrender.com/api/ping', {
          mode: 'no-cors'
        });
        console.log('Ping enviado (modo no-cors)');
      } catch {
        console.warn('Error esperado en modo no-cors');
      }
    };

    pingServer(); // Primer ping al cargar
    const interval = setInterval(pingServer, 5 * 60 * 1000); // Cada 5 minutos

    return () => clearInterval(interval); // Limpiar al desmontar
  }, []);

  return (
    <CompaniesProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </CompaniesProvider>
  );
}

export default App;