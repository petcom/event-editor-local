const { ipcMain } = require('electron');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ✅ Load and correctly name environment variables
const s3Bucket = process.env.S3_BUCKET;
const s3Region = process.env.S3_REGION;
const s3Endpoint = process.env.S3_ENDPOINT;
const s3Key = process.env.S3_KEY;
const s3Secret = process.env.S3_SECRET;
const s3ImagePrefix = process.env.S3_IMAGE_PREFIX || 'images/';

// ✅ Construct full endpoint URL
const fullEndpoint = `https://${s3Bucket}.${s3Region}.${s3Endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
const doEndpoint = `https://${s3Region}.${s3Endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

// ✅ Console checks
console.log('[S3] Initializing S3 handler...');
console.log('[S3] Using endpoint:', fullEndpoint);
console.log('[S3] Using endpoint:', doEndpoint);
console.log('[S3] Target bucket:', s3Bucket);

// ✅ Initialize S3 client
const s3 = new S3Client({
  region: s3Region,
  endpoint: doEndpoint,
  credentials: {
    accessKeyId: s3Key,
    secretAccessKey: s3Secret,
  }
});

// ✅ Utility for content type
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

// ✅ Register IPC handler
module.exports = function registerS3Handlers() {
  ipcMain.handle('upload-to-s3', async (_event, localFilePath, destinationKey) => {
    console.log('[S3] Received upload-to-s3 request');
    console.log('[S3] Local file path:', localFilePath);
    console.log('[S3] Destination key:', destinationKey);

    try {
      if (!fs.existsSync(localFilePath)) {
        console.error('[S3] File does not exist:', localFilePath);
        return { success: false, error: 'File not found' };
      }

      const fileStream = fs.createReadStream(localFilePath);
      const contentType = getContentType(localFilePath);
      console.log('[S3] Content-Type:', contentType);

      const command = new PutObjectCommand({
        Bucket: s3Bucket, // ✅ FIXED: use correct variable
        Key: destinationKey,
        Body: fileStream,
        ACL: 'public-read',
        ContentType: contentType
      });

      await s3.send(command);

      const publicUrl = `${fullEndpoint}/${destinationKey}`;
      console.log('[S3] Final Public URL:', publicUrl);

      return { success: true, url: publicUrl };
    } catch (err) {
      console.error('[S3] Upload failed:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('get-s3-prefix', async () => {
    return s3ImagePrefix;
  });
};
