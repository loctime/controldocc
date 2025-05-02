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

export async function uploadFile(fileBuffer, mimeType, sha1 = 'do_not_verify') {
  try {
    if (!authData) await initB2();

    const extension = guessExtension(mimeType);
    const randomName = generateSafeFileName(extension);
    const finalPath = `documentExamples/${randomName}`.replace(/\s/g, '_');

    const uploadUrlResp = await axios.post(
      `${authData.apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: authData.allowed.bucketId },
      { headers: { Authorization: authData.authorizationToken } }
    );

    const { uploadUrl, authorizationToken } = uploadUrlResp.data;

    if (DEBUG_MODE) {
      console.log('DEBUG upload:', {
        uploadUrl,
        'X-Bz-File-Name': finalPath,
        mimeType
      });
    }

    const response = await axios({
      method: 'post',
      url: uploadUrl,
      headers: {
        Authorization: authorizationToken,
        'X-Bz-File-Name': finalPath,
        'Content-Type': mimeType,
        'X-Bz-Content-Sha1': sha1,
      },
      data: fileBuffer,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      transformRequest: [(data) => data],
    });

    const bucketName = process.env.B2_BUCKET_NAME || 'controldocc';
    const downloadUrl = `https://${authData.downloadUrl.split('/')[2]}/file/${bucketName}/${finalPath}`;

    return {
      url: downloadUrl,
      fileId: response.data.fileId,
      fileName: randomName,
    };
  } catch (error) {
    DEBUG_MODE && console.error('Error uploading file:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      stack: error.stack
    });

    if (error.response?.data) {
      throw new Error(`Backblaze error: ${error.response.data.code} - ${error.response.data.message}`);
    }
    throw error;
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
