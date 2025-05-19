const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

function getLast4OfMac() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (!config.internal && config.mac && config.mac !== '00:00:00:00:00:00') {
        const mac = config.mac.replace(/:/g, '').slice(-4).toUpperCase();
        console.log('[IMAGE] MAC found:', config.mac, '→ Last 4:', mac);
        return mac;
      }
    }
  }
  console.warn('[IMAGE] No valid MAC address found');
  return 'XXXX';
}

module.exports = function registerImageHandlers() {
  console.log('[IMAGE] Registering image IPC handlers');

  ipcMain.handle('get-mac-token-prefix', () => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const macSuffix = getLast4OfMac();
    const token = `${dateStr}-${macSuffix}`;
    console.log('[IMAGE] Generated token prefix:', token);
    return token;
  });

ipcMain.handle('select-and-process-image', async (event, eventToken) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }]
    });

    if (canceled || filePaths.length === 0) return null;

    const inputPath = filePaths[0];
    const imageTypes = ['thumb', 'small', 'full'];
    const outputBaseDir = path.join(__dirname, 'images');
    const outputPaths = {};

    await fs.promises.mkdir(outputBaseDir, { recursive: true });

    for (const type of imageTypes) {
        const filename = `${eventToken}-${type}.png`;
        const outputPath = path.join(outputBaseDir, filename);
        outputPaths[type] = outputPath;

        // Use Sharp or similar to resize/copy accordingly
        if (type === 'thumb') {
            await sharp(inputPath).resize(100, 100).toFile(outputPath);
        } else if (type === 'small') {
            await sharp(inputPath).resize(300, 200).toFile(outputPath);
        } else {
            await sharp(inputPath).toFile(outputPath); // full size
        }
    }

    return outputPaths; // { thumb: '', small: '', full: '' }
});

}

