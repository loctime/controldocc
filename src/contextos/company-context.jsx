// src/contexts/company-context.jsx
import React, { createContext, useContext, useState } from "react";

// ❌ No exportamos el contexto para evitar mal uso accidental
const CompanyContext = createContext();

// ✅ Usamos solo este hook para consumir el contexto
export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}

// ✅ Proveedor que encapsula los valores compartidos
export function CompanyProvider({ children }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");

  const selectCompany = (id, name) => {
    setSelectedCompanyId(id);
    setSelectedCompanyName(name || "");
  };

  const clearSelectedCompany = () => {
    setSelectedCompanyId(null);
    setSelectedCompanyName("");
  };

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId,
        selectedCompanyName,
        setSelectedCompanyId,
        selectCompany,
        clearSelectedCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}
