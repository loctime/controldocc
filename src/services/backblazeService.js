// backblazeService.js (modificado correctamente)

import axios from 'axios';

const DEBUG_MODE = process.env.NODE_ENV === 'development';

let authData = null;

export async function initB2() {
  try {
    DEBUG_MODE && console.log('Using B2 Key:', process.env.B2_KEY_ID);
    const response = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      auth: {
        username: process.env.B2_KEY_ID,
        password: process.env.B2_APPLICATION_KEY
      }
    });
    authData = response.data;
    return authData;
  } catch (error) {
    DEBUG_MODE && console.error('Error initializing B2:', error.response?.data || error.message);
    throw error;
  }
}

export async function uploadFile(fileBuffer, fileName, mimeType, sha1 = 'do_not_verify') {
  try {
    if (!authData) await initB2();
    
    if (!sha1 || typeof sha1 !== 'string') {
      sha1 = 'do_not_verify';
    }
    
    // Obtener URL de subida
    const uploadResponse = await axios.post(
      `${authData.apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: authData.allowed.bucketId },
      { headers: { Authorization: authData.authorizationToken } }
    );
    
    const { uploadUrl, authorizationToken } = uploadResponse.data;
    
    // Subir el archivo con Content-Disposition: attachment
    const response = await axios.post(uploadUrl, fileBuffer, {
      headers: {
        Authorization: authorizationToken,
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'Content-Type': mimeType,
        'X-Bz-Content-Sha1': sha1,
        'Content-Length': fileBuffer.length,
        // 🔥 Agregamos esto
        'X-Bz-Info-Content-Disposition': `attachment; filename="${fileName}"`
      }
    });

    // URL pública corregida
    const bucketName = process.env.B2_BUCKET_NAME || 'controldocc';
    const encodedFileName = encodeURIComponent(fileName).replace(/%2F/g, '/');

    return {
      url: `https://${authData.downloadUrl.split('/')[2]}/file/${bucketName}/${encodedFileName}`,  // 📄 URL pública
      fileId: response.data.fileId,  // 🆔 ID único de Backblaze
    };
  } catch (error) {
    DEBUG_MODE && console.error('Error uploading file:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}
