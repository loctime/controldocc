// src/component/usuario/hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import { db } from '../../../../firebaseconfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function useDashboardData(companyIdFromLocalStorage, personalRefresh = 0, vehiculosRefresh = 0) {
  const [company, setCompany] = useState(null);
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log('[useDashboardData] Refrescando datos de personal y vehículos', { companyIdFromLocalStorage, personalRefresh, vehiculosRefresh });
    if (!companyIdFromLocalStorage) {
      setError("No se encontró la empresa asignada.");
      setLoading(false);
      return;
    }

    fetchAllData(companyIdFromLocalStorage);
  }, [companyIdFromLocalStorage, personalRefresh, vehiculosRefresh]);

  const fetchAllData = async (companyId) => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCompany(companyId),
        fetchRequiredDocuments(companyId),
        fetchUploadedDocuments(companyId),
        fetchPersonal(companyId),
        fetchVehiculos(companyId)
      ]);
    } catch (err) {
      console.error("Error al cargar los datos:", err);
      setError("Error al cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompany = async (companyId) => {
    const companyRef = doc(db, "companies", companyId);
    const snap = await getDoc(companyRef);
    if (snap.exists()) setCompany(snap.data());
  };

  const fetchRequiredDocuments = async (companyId) => {
    const q = query(collection(db, "requiredDocuments"), where("companyId", "==", companyId));
    const docs = await getDocs(q);
    setRequiredDocuments(docs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchUploadedDocuments = async (companyId) => {
    const q = query(collection(db, "uploadedDocuments"), where("companyId", "==", companyId));
    const docs = await getDocs(q);
    setUploadedDocuments(docs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchPersonal = async (companyId) => {
    const q = query(collection(db, "personal"), where("companyId", "==", companyId));
    const docs = await getDocs(q);
    setPersonal(docs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchVehiculos = async (companyId) => {
    const q = query(collection(db, "vehiculos"), where("companyId", "==", companyId));
    const docs = await getDocs(q);
    setVehiculos(docs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const refreshUploadedDocuments = async () => {
    if (!companyIdFromLocalStorage) return;
    await fetchUploadedDocuments(companyIdFromLocalStorage);
  };

  return {
    company,
    requiredDocuments,
    uploadedDocuments,
    personal,
    vehiculos,
    loading,
    error,
    refreshUploadedDocuments
  };
}
