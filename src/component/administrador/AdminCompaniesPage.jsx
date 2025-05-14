import React, { useState } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useCompanyList } from "../../context/CompaniesContext";
import { deleteDoc, doc, getDocs, query, where, collection } from "firebase/firestore";
import { db } from "../../firebaseconfig";
import EmpresaTable from "./Library/EmpresaTable";

const AdminCompaniesPage = () => {
  const { companies, refresh, loading } = useCompanyList();
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState([]);

  const handleEdit = (empresa) => {
    console.log('Editar empresa:', empresa);
    // Aquí podés abrir un modal o navegar a otra página
  };

  const handleDelete = async (empresa) => {
    if (!empresa?.id) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "companies", empresa.id));
      const usersQuery = await getDocs(
        query(collection(db, "users"), where("companyId", "==", empresa.id))
      );
      const deletePromises = [];
      usersQuery.forEach((userDoc) => {
        deletePromises.push(deleteDoc(doc(db, "users", userDoc.id)));
      });
      if (deletePromises.length > 0) await Promise.all(deletePromises);
      if (refresh) await refresh();
    } catch (error) {
      alert("Error eliminando empresa: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(companies.map(c => c.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`¿Eliminar ${selected.length} empresas seleccionadas?`)) {
      try {
        for (const id of selected) {
          const company = companies.find(c => c.id === id);
          if (company) await handleDelete(company);
        }
        setSelected([]);
      } catch (error) {
        console.error('Error eliminando empresas:', error);
      }
    }
  };

  return (
    <Box>
      <Box mb={2} display="flex" alignItems="center" gap={2}>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          disabled={selected.length === 0 || deleting}
          onClick={handleDeleteSelected}
        >
          Eliminar seleccionadas ({selected.length})
        </Button>
        {deleting && <CircularProgress size={24} />}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : (
        <EmpresaTable 
          companies={companies}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selected={selected}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
        />
      )}
    </Box>
  );
};

export default AdminCompaniesPage;
