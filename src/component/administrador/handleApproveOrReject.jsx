import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { db, auth } from "../../firebaseconfig";

/**
 * Aprueba o rechaza un documento subido, actualiza Firestore y copia a biblioteca si se aprueba.
 */
const handleApproveOrReject = async (
  docId,
  tipo,
  documents,
  setDocuments,
  user,
  newExpirationDates,
  adminComments,
  setToastMessage,
  setToastOpen,
  setExpandedRow,
  setDialogAccion,
  forcedCompanyId
) => {
  const isAprobando = tipo === 'aprobar';
  const comment = adminComments[docId];
  const expirationDate = newExpirationDates[docId];
  const adminEmail = user?.email || auth.currentUser?.email || 'Administrador';

  if (isAprobando && !expirationDate) {
    setToastMessage('Debe ingresar una fecha de vencimiento para aprobar.');
    setToastOpen(true);
    return;
  }

  if (!isAprobando && !comment) {
    setToastMessage('Debe ingresar un comentario para rechazar.');
    setToastOpen(true);
    return;
  }

  try {
    const updateFields = {
      status: isAprobando ? 'Aprobado' : 'Rechazado',
      reviewedAt: serverTimestamp(),
      reviewedBy: adminEmail,
      ...(isAprobando
        ? { expirationDate: Timestamp.fromDate(new Date(expirationDate)) }
        : { adminComment: comment }),
    };

    await updateDoc(doc(db, 'uploadedDocuments', docId), updateFields);

    if (isAprobando) {
      const originalSnap = await getDoc(doc(db, 'uploadedDocuments', docId));
      if (originalSnap.exists()) {
        const data = originalSnap.data();
        const companyId = data.companyId || forcedCompanyId;

        if (!companyId) {
          console.warn("❌ No se puede copiar a library: companyId faltante");
          return;
        }

        // Obtener tipo de documento desde documento requerido si no está definido
        let documentType = data.documentType;
        if (!documentType && data.requiredDocumentId) {
          const requiredSnap = await getDoc(doc(db, 'requiredDocuments', data.requiredDocumentId));
          if (requiredSnap.exists()) {
            documentType = requiredSnap.data().documentType || 'company';
          }
        }

        const entityType = data.entityType || documentType || 'company';
        const entityName =
          data.entityName ||
          (entityType === 'vehicle'
            ? 'Vehículo desconocido'
            : entityType === 'employee'
            ? 'Empleado desconocido'
            : 'Empresa');

        const now = Timestamp.now();
        const newDoc = {
          ...data,
          expirationDate: Timestamp.fromDate(new Date(expirationDate)),
          reviewedAt: now,
          reviewedBy: adminEmail,
          copiedAt: now,
          originalId: docId,
          versionId: crypto.randomUUID(),
          status: 'Aprobado',
          documentType: documentType || 'company',
          documentName: data.documentName || data.fileName || 'Documento sin nombre',
          fileName: data.fileName || data.documentName || 'sin_nombre.pdf',
          uploadedBy: data.uploadedBy || 'Desconocido',
          uploadedAt: data.uploadedAt || now,
          entityType,
          entityId: data.entityId || '',
          entityName
        };

        await addDoc(collection(db, `companies/${companyId}/library`), newDoc);
        console.log("✅ Documento copiado a biblioteca de empresa:", companyId);
      } else {
        console.warn("⚠️ Documento original no encontrado para copiar.");
      }
    }

    setDocuments(prevDocs =>
      prevDocs.map(doc =>
        doc.id === docId
          ? { ...doc, ...updateFields, reviewedAt: new Date() }
          : doc
      )
    );

    setExpandedRow(null);
    setDialogAccion(null);
    setToastMessage(`Documento ${isAprobando ? 'aprobado' : 'rechazado'} correctamente`);
    setToastOpen(true);
  } catch (error) {
    console.error(`Error al ${isAprobando ? 'aprobar' : 'rechazar'} documento:`, error);
    setToastMessage(`Error al ${isAprobando ? 'aprobar' : 'rechazar'} documento`);
    setToastOpen(true);
  }
};

export default handleApproveOrReject;
