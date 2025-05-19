const { ipcMain } = require('electron');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load .env if available

console.log('[S3] Initializing S3 handler...');
console.log('[S3] Using endpoint:', process.env.SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com');
console.log('[S3] Target bucket:', process.env.SPACES_BUCKET || 'sonar-media');

const spacesEndpoint = process.env.SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';
const bucketName = process.env.SPACES_BUCKET || 'sonar-media';

const s3 = new S3Client({
  region: 'nyc3',
  endpoint: spacesEndpoint,
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET
  }
});

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

module.exports = function registerS3Handlers() {
  console.log('[S3] Registering IPC handler: upload-to-s3');

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
        Bucket: bucketName,
        Key: destinationKey,
        Body: fileStream,
        ACL: 'public-read',
        ContentType: contentType
      });

      console.log('[S3] Sending upload request to Spaces...');
      await s3.send(command);

      const publicUrl = `${spacesEndpoint.replace('https://', `https://${bucketName}.`)}/${destinationKey}`;
      console.log('[S3] Upload successful. Public URL:', publicUrl);

      return { success: true, url: publicUrl };
    } catch (err) {
      console.error('[S3] Upload failed:', err);
      return { success: false, error: err.message };
    }
  });
};
