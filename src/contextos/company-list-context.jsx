import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebaseconfig";
import { collection, getDocs } from "firebase/firestore";

const CompanyListContext = createContext();

export const CompanyListProvider = ({ children }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, "companies"));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setCompanies(list);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError('Error al cargar la lista de empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <CompanyListContext.Provider 
      value={{ 
        companies, 
        fetchCompanies, 
        loading,
        error
      }}
    >
      {children}
    </CompanyListContext.Provider>
  );
};

export const useCompanyList = () => {
  return useContext(CompanyListContext);
};