export const parseFirestoreDate = (firestoreDate) => {
    if (!firestoreDate) return null;
    try {
      if (firestoreDate?.toDate) return firestoreDate.toDate();
      if (firestoreDate?.seconds) return new Date(firestoreDate.seconds * 1000);
      if (typeof firestoreDate === 'string') return new Date(firestoreDate);
      if (firestoreDate instanceof Date) return firestoreDate;
      return null;
    } catch (e) {
      console.error('Error parsing date:', firestoreDate);
      return null;
    }
  };