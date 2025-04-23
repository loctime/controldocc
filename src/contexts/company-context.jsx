// src/contexts/company-context.jsx
import React, { createContext, useContext, useState } from "react";

const CompanyContext = createContext();

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}

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
      value={{ selectedCompanyId, selectedCompanyName, selectCompany, clearSelectedCompany }}
    >
      {children}
    </CompanyContext.Provider>
  );
}
