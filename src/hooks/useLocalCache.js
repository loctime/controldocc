import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseconfig';

export default function useLocalCache(collectionName, docId, initialData) {
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem(`cache_${collectionName}_${docId}`);
      return cached ? JSON.parse(cached) : initialData;
    } catch (error) {
      console.error('Error reading cache:', error);
      return initialData;
    }
  });

  useEffect(() => {
    if (!docId) return;

    const docRef = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const newData = doc.data();
        try {
          localStorage.setItem(
            `cache_${collectionName}_${docId}`,
            JSON.stringify(newData)
          );
          setData(newData);
        } catch (error) {
          console.error('Error updating cache:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [collectionName, docId]);

  return [data, () => {
    localStorage.removeItem(`cache_${collectionName}_${docId}`);
    setData(initialData);
  }];
}
