const { ipcMain } = require('electron');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('[S3] Initializing S3 handler...');
console.log('[S3] Using endpoint:', process.env.S3_ENDPOINT);
console.log('[S3] Target bucket:', process.env.S3_BUCKET);

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET
  }
});

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

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

      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: destinationKey,
        Body: fileStream,
        ACL: 'public-read',
        ContentType: contentType
      });

      await s3.send(command);

      const publicUrl = `${process.env.S3_ENDPOINT.replace('https://', `https://${process.env.S3_BUCKET}.`)}/${destinationKey}`;
      console.log('[S3] Upload successful. Public URL:', publicUrl);

      return { success: true, url: publicUrl };
    } catch (err) {
      console.error('[S3] Upload failed:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('get-s3-prefix', async () => {
    return process.env.S3_IMAGE_PREFIX || 'images/';
  });
};
