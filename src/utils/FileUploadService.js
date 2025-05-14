// src/utils/FileUploadService.js
import { getAuth } from "firebase/auth";

export const uploadFile = async (file, folder, options = {}) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    // Limpiar metadatos para evitar undefineds
    if (options.metadata) {
      const metadataLimpia = {};
      Object.entries(options.metadata).forEach(([key, value]) => {
        if (value !== undefined) metadataLimpia[key] = value;
      });
      formData.append("metadata", JSON.stringify(metadataLimpia));
    }

    const token = await user.getIdToken();

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al subir el archivo");
    }

    return await response.json();
  } catch (error) {
    console.error("[uploadFile] Error:", error);
    throw error;
  }
};
