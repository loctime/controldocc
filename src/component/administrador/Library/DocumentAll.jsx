import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebaseconfig';

export function useDocumentAll({
  isAdmin,
  selectedCompanyId,
  selectedCategory,
  sortDocuments,
  sortBy,
  sortDirection,
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [folderStructure, setFolderStructure] = useState({});

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!isAdmin) return;

      setLoading(true);
      setError('');
      setDocuments([]);
      setFolderStructure({});
      console.log("🟦 Iniciando carga de documentos");
      console.log("Empresa seleccionada:", selectedCompanyId);
      console.log("Es admin:", isAdmin);

      try {
        const companiesSnapshot = await getDocs(collection(db, 'companies'));
        const companiesMap = {};
        companiesSnapshot.forEach(doc => {
          const data = doc.data();
          companiesMap[doc.id] = data.name || 'Empresa sin nombre';
        });

        if (!selectedCompanyId) {
          setError('Debe seleccionar una empresa para ver la biblioteca.');
          setLoading(false);
          return;
        }

        let allDocs = [];

        const loadLibraryDocs = async (companyId) => {
          console.log(`📂 Cargando biblioteca de empresa: ${companyId}`);
          const libRef = collection(db, `companies/${companyId}/library`);
          const snapshot = await getDocs(libRef);
          console.log(`📄 Cantidad de documentos encontrados: ${snapshot.size}`);

          snapshot.forEach(docSnap => {
            allDocs.push({ docSnap, companyId });
          });
        };

        if (selectedCompanyId === 'todas') {
          for (const companyDoc of companiesSnapshot.docs) {
            await loadLibraryDocs(companyDoc.id);
          }
        } else {
          await loadLibraryDocs(selectedCompanyId);
        }

        const loadedDocuments = allDocs.map(({ docSnap, companyId }) => {
          const data = docSnap.data();

          const fechaAprobado = data.reviewedAt?.toDate?.() ||
            (data.reviewedAt?.seconds ? new Date(data.reviewedAt.seconds * 1000) : new Date());

          let fechaVencimiento = null;
          if (typeof data.expirationDate === 'string') {
            fechaVencimiento = new Date(data.expirationDate);
          } else if (data.expirationDate?.seconds) {
            fechaVencimiento = new Date(data.expirationDate.seconds * 1000);
          }

          const daysRemaining = fechaVencimiento
            ? Math.ceil((fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24))
            : null;

            const documentType = data.documentType || 'company';

            let category;
            if (data.entityType === 'employee') {
              category = 'personal';
            } else if (data.entityType === 'vehicle') {
              category = 'vehicle';
            } else {
              category = 'company';
            }


          return {
            id: docSnap.id,
            nombreOriginal: data.fileName || data.documentName || 'Documento sin nombre',
            companyId,
            companyName: companiesMap[companyId] || 'Sin empresa',
            usuarioEmail: data.userEmail || data.uploadedBy || 'Usuario desconocido',
            originalStatus: data.status || 'Pendiente de revisión',
            tipo: data.fileType || data.contentType || 'application/pdf',
            fechaSubida: fechaAprobado,
            fechaAprobado,
            fechaVencimiento,
            addedToLibraryAt: fechaAprobado,
            urlB2: data.fileURL || data.downloadURL || '',
            size: data.fileSize || Math.floor(Math.random() * 5000000) + 500000,
            category,
            starred: daysRemaining !== null && daysRemaining <= 30,
            tags: data.tags || [],
            daysRemaining,
            entityType: data.entityType || 'company',
            entityId: data.entityId || null,
            entityName: data.entityName || 'Empresa',
          };
        });

        console.log("🕵️‍♂️ Categoría seleccionada:", selectedCategory);
        console.log("📄 Categorías de documentos:", loadedDocuments.map(doc => doc.category));

        const filtered = selectedCategory
          ? loadedDocuments.filter(doc => String(doc.category) === String(selectedCategory))
          : loadedDocuments;

        const sorted = sortDocuments(filtered, sortBy, sortDirection);
        setDocuments(sorted);

        // 🗂 Agrupar por entidadType -> entityName
        const grouped = {};
        sorted.forEach(doc => {
          const type = doc.entityType || 'company';
          const name = doc.entityName || 'Empresa';
          if (!grouped[type]) grouped[type] = { name: type, subfolders: {} };
          if (!grouped[type].subfolders[name]) grouped[type].subfolders[name] = { name, files: [] };

          grouped[type].subfolders[name].files.push(doc);
        });

        // Convertir a estructura de carpetas
        const structured = {};
        for (const typeKey in grouped) {
          const typeFolder = grouped[typeKey];
          structured[typeKey] = {
            name: typeKey,
            subfolders: Object.values(typeFolder.subfolders),
          };
        }

        setFolderStructure({
          biblioteca: {
            name: 'Biblioteca',
            files: sorted,
            subfolders: [],
          }
        });
      } catch (err) {
        console.error('Error loading documents:', err);
        setError('Ocurrió un error al cargar documentos');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [isAdmin, selectedCompanyId, selectedCategory, sortBy, sortDirection]);

  return { documents, setDocuments, folderStructure, loading, error };
}
