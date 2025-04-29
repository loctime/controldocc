export function cleanFileName(originalName) {
  if (!originalName) return `file_${Date.now()}`;

  const extension = originalName.includes('.') ? 
    `.${originalName.split('.').pop().toLowerCase()}` : 
    '';

  const baseName = originalName.replace(/\.[^/.]+$/, "");

  const cleanBase = baseName
    .normalize('NFD')                       // eliminar tildes
    .replace(/[\u0300-\u036f]/g, '')         // eliminar diacríticos
    .replace(/\s+/g, '_')                    // reemplazar espacios
    .replace(/[^\w\-.]/g, '')                 // dejar solo letras, números, guiones, puntos
    .substring(0, 100);

  return `${cleanBase}${extension}`;
}
