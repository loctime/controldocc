import axios from 'axios';
import crypto from 'crypto';

const DEBUG_MODE = process.env.NODE_ENV === 'development';
let authData = null;

export async function initB2() {
  if (!authData) {
    const basicAuth = Buffer.from(`${process.env.B2_KEY_ID}:${process.env.B2_APPLICATION_KEY}`).toString('base64');
    const response = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: { Authorization: `Basic ${basicAuth}` }
    });
    authData = response.data;
  }
  return authData;
}

export async function uploadFile(fileBuffer, mimeType, options = {}) {
  try {
    if (!authData) await initB2();

    const extension = guessExtension(mimeType);
    const randomName = generateSafeFileName(extension);
    const finalPath = `${options.folder || 'documentExamples'}/${randomName}`.replace(/\s/g, '_');

    // Generar SHA1 del buffer
    const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');

    const uploadUrlResp = await axios.post(
      `${authData.apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: authData.allowed.bucketId },
      { headers: { Authorization: authData.authorizationToken } }
    );

    const response = await axios({
      method: 'post',
      url: uploadUrlResp.data.uploadUrl,
      headers: {
        Authorization: uploadUrlResp.data.authorizationToken,
        'X-Bz-File-Name': finalPath,
        'Content-Type': mimeType,
        'X-Bz-Content-Sha1': sha1
      },
      data: fileBuffer
    });

    return {
      url: `https://${authData.downloadUrl.split('/')[2]}/file/${process.env.B2_BUCKET_NAME}/${finalPath}`,
      fileId: response.data.fileId,
      fileName: randomName
    };
  } catch (error) {
    console.error('[Backblaze] Error:', error.response?.data || error.message);
    throw new Error(`Backblaze error: ${error.response?.data?.message || error.message}`);
  }
}

function generateSafeFileName(extension) {
  const random = crypto.randomBytes(8).toString('hex');
  return `${Date.now()}_${random}${extension}`.replace(/\s/g, '_');
}

function guessExtension(mimeType) {
  switch (mimeType) {
    case 'image/jpeg': return '.jpg';
    case 'image/png': return '.png';
    case 'image/gif': return '.gif';
    case 'application/pdf': return '.pdf';
    default: return '';
  }
}
