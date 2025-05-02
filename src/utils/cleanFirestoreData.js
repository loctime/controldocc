// utils/cleanFirestoreData.js

/**
 * Elimina todas las propiedades con valor undefined de un objeto
 * para evitar errores en Firestore (no permite campos undefined).
 *
 * @param {Object} obj - Objeto a limpiar
 * @returns {Object} - Objeto sin propiedades undefined
 */
export function cleanFirestoreData(obj) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined)
    );
  }
  