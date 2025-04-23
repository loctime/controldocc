import { createContext, useContext, useState } from 'react';

const SelectedCompanyContext = createContext();

export function SelectedCompanyProvider({ children }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  return (
    <SelectedCompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId }}>
      {children}
    </SelectedCompanyContext.Provider>
  );
}

export function useSelectedCompany() {
  const context = useContext(SelectedCompanyContext);
  if (context === undefined) {
    throw new Error('useSelectedCompany must be used within a SelectedCompanyProvider');
  }
  return context;
}
