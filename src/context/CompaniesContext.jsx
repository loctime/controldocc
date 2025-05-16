import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "../firebaseconfig";
import { collection, getDocs } from "firebase/firestore";

const CompaniesContext = createContext();

export const CompaniesProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "companies"));
      const sortedCompanies = [...snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.companyName || "Sin nombre",
          ...data
        };
      })].sort((a, b) => a.name.localeCompare(b.name));
      
      setCompanies(sortedCompanies);
    } catch (err) {
      setError('Error al cargar empresas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  return (
    <CompaniesContext.Provider value={{
      companies,
      selectedCompany,
      selectCompany: setSelectedCompany,
      clearSelection: () => setSelectedCompany(null),
      refresh: fetchCompanies,
      loading,
      error
    }}>
      {children}
    </CompaniesContext.Provider>
  );
};

export const useCompanies = () => {
  const context = useContext(CompaniesContext);
  if (!context) throw new Error("useCompanies must be used within CompaniesProvider");
  return context;
};

export const useCompanyList = useCompanies; // Alias para compatibilidad
