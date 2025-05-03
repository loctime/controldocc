const handleApproveOrReject = async (docId, tipo) => {
    const isAprobando = tipo === 'aprobar';
    const expirationDate = newExpirationDates[docId];
    const comment = adminComments[docId];
  
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
      const adminEmail = user?.email || auth.currentUser?.email || 'Administrador';
      const updateFields = {
        status: isAprobando ? 'Aprobado' : 'Rechazado',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminEmail,
        ...(isAprobando ? { expirationDate } : { adminComment: comment }),
      };
  
      await updateDoc(doc(db, 'uploadedDocuments', docId), updateFields);
  
      // 🔄 Actualizar el estado local
      setDocuments(prevDocs =>
        prevDocs.map(d =>
          d.id === docId
            ? {
                ...d,
                ...updateFields,
                reviewedAt: new Date() // Para mostrar en UI aunque Firestore ponga el timestamp real
              }
            : d
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
