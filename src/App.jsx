import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./router/AppRouter";
import "./App.css";
import { CompanyListProvider } from "./contextos/company-list-context";

function App() {
  return (
    <CompanyListProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </CompanyListProvider>
  );
}

export default App;