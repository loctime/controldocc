import axios from 'axios';

let authData = null;

export async function initB2() {
  try {
    console.log('Using B2 Key:', process.env.B2_KEY_ID);
    console.log('Bucket ID:', process.env.B2_BUCKET_ID);
    console.log('Application Key:', process.env.B2_APPLICATION_KEY?.substring(0, 6) + '...');
    console.log('[B2 DEBUG] Env:', {
      key: process.env.B2_KEY_ID,
      bucketId: process.env.B2_BUCKET_ID
    });
    const response = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      auth: {
        username: process.env.B2_KEY_ID,
        password: process.env.B2_APPLICATION_KEY
      }
    });
    
    authData = response.data;
    console.log('Auth Data:', authData); 
    return authData;
  } catch (error) {
    console.error('Error initializing B2:', error.response?.data || error.message);
    throw error;
  }

}

export async function uploadFile(fileBuffer, fileName, mimeType, sha1 = 'do_not_verify') {
  try {
    if (!authData) await initB2();
    
    // Validar sha1 o usar valor por defecto
    if (!sha1 || typeof sha1 !== 'string') {
      sha1 = 'do_not_verify';
      console.warn('No se proporcionó SHA1 válido, usando "do_not_verify"');
    }
    
    // Obtener URL de subida
    const uploadResponse = await axios.post(
      `${authData.apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: authData.allowed.bucketId },
      { headers: { Authorization: authData.authorizationToken } }
    );
    
    const { uploadUrl, authorizationToken } = uploadResponse.data;
    
    // Subir el archivo
    const response = await axios.post(uploadUrl, fileBuffer, {
      headers: {
        Authorization: authorizationToken,
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'Content-Type': mimeType,
        'X-Bz-Content-Sha1': sha1,
        'Content-Length': fileBuffer.length
      }
    });

    // URL de descarga corregida
    return `${authData.downloadUrl}/b2api/v1/b2_download_file_by_name?bucketName=${process.env.B2_BUCKET_NAME}&fileName=${encodeURIComponent(fileName)}`;
  } catch (error) {
    console.error('Error uploading file:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}