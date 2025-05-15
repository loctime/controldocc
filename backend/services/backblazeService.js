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

    // Validar y generar SHA1
    const sha1 = options.sha1 && typeof options.sha1 === 'string' && /^[a-f0-9]{40}$/.test(options.sha1)
      ? options.sha1
      : crypto.createHash('sha1').update(fileBuffer).digest('hex');

    const uploadUrlResp = await axios.post(
      `${authData.apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: authData.allowed.bucketId },
      { headers: { Authorization: authData.authorizationToken } }
    );

    const headers = {
      Authorization: uploadUrlResp.data.authorizationToken,
      'X-Bz-File-Name': finalPath,
      'Content-Type': mimeType,
      'X-Bz-Content-Sha1': sha1,
      'X-Bz-Info-original_filename': options.originalFilename || randomName
    };

    if (options.customMetadata) {
      headers['X-Bz-Info-metadata'] = JSON.stringify(options.customMetadata);
    }

    const response = await axios({
      method: 'post',
      url: uploadUrlResp.data.uploadUrl,
      headers,
      data: fileBuffer
    });

    const bucketName = process.env.B2_BUCKET_NAME || 'controldocc';
    const downloadUrl = `https://${authData.downloadUrl.split('/')[2]}/file/${bucketName}/${finalPath}`;

    return {
      url: downloadUrl,
      fileId: response.data.fileId,
      fileName: randomName,
    };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[Backblaze] Error:', errorDetails);
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
