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

  ipcMain.handle('select-and-process-image', async (_event, eventToken) => {
    console.log('[IMAGE] Selecting image for event token:', eventToken);

    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }]
    });

    if (canceled || filePaths.length === 0) {
      console.warn('[IMAGE] Image selection canceled or no file chosen');
      return null;
    }

    const originalPath = filePaths[0];
    const ext = path.extname(originalPath).toLowerCase() || '.jpg';
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const uniqueName = `${dateStr}-${eventToken}-${uuidv4()}`;
    const outputDir = path.join(__dirname, '..', 'images');

    const fullPath = path.join(outputDir, 'full', `${uniqueName}${ext}`);
    const smallPath = path.join(outputDir, 'small', `${uniqueName}${ext}`);
    const thumbPath = path.join(outputDir, 'thumb', `${uniqueName}${ext}`);

    console.log('[IMAGE] Original path:', originalPath);
    console.log('[IMAGE] Full path:', fullPath);
    console.log('[IMAGE] Small path:', smallPath);
    console.log('[IMAGE] Thumb path:', thumbPath);

    fs.mkdirSync(path.join(outputDir, 'full'), { recursive: true });
    fs.mkdirSync(path.join(outputDir, 'small'), { recursive: true });
    fs.mkdirSync(path.join(outputDir, 'thumb'), { recursive: true });

    try {
      await sharp(originalPath).resize({ width: 1600 }).toFile(fullPath);
      console.log('[IMAGE] Saved full size image');

      await sharp(originalPath).resize({ width: 800 }).toFile(smallPath);
      console.log('[IMAGE] Saved small image');

      await sharp(originalPath).resize(200, 200).toFile(thumbPath);
      console.log('[IMAGE] Saved thumbnail image');
    } catch (err) {
      console.error('[IMAGE] Error during image processing:', err);
      throw err;
    }

    return {
      full: fullPath,
      small: smallPath,
      thumb: thumbPath,
      filename: `${uniqueName}${ext}`
    };
  });
};
