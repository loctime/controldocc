import { useState } from "react";
import { db } from "../../../firebaseconfig";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { cleanFirestoreData } from "../../../utils/cleanFirestoreData";

export const useVehiculosForm = () => {
  const [formData, setFormData] = useState({
    marca: "",
    modelo: "",
    patente: "",
    año: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { marca, modelo, patente, año } = formData;

    if (!marca.trim() || !modelo.trim() || !patente.trim()) {
      setError("Por favor completa los campos obligatorios");
      return;
    }

    const userCompanyData = JSON.parse(localStorage.getItem('userCompany') || '{}');
    const companyId = userCompanyData?.companyId;

    if (!companyId) {
      setError("No tienes empresa asociada. No se puede agregar vehículo.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const patenteQuery = query(
        collection(db, "vehiculos"),
        where("patente", "==", patente.trim()),
        where("companyId", "==", companyId)
      );
      const existingPatenteSnap = await getDocs(patenteQuery);

      if (!existingPatenteSnap.empty) {
        setError("Ya existe un vehículo registrado con esa patente.");
        return;
      }

      const rawVehiculo = {
        marca: marca.trim(),
        modelo: modelo.trim(),
        patente: patente.trim(),
        año: año.trim() || null,
        companyId,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, "vehiculos"), cleanFirestoreData(rawVehiculo));
      
      setFormData({
        marca: "",
        modelo: "",
        patente: "",
        año: ""
      });
      setSuccess(true);
    } catch (err) {
      console.error("Error al agregar vehículo:", err);
      setError("Error al guardar los datos. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return {
    ...formData,
    loading,
    error,
    success,
    handleChange,
    handleSubmit,
    handleCloseSnackbar
  };
};
