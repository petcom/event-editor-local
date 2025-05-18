console.log('[MAIN] Electron has started');

const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

function createWindow() {
const win = new BrowserWindow({
  width: 1000,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false
  }
});

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('load-events', async () => {
  const filePath = path.join(__dirname, 'events.json');
  console.log('[MAIN] Loading events from:', filePath);

  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    console.log(`[MAIN] Loaded ${parsed.length} events`);
    return parsed;
  } catch (err) {
    console.error('[MAIN] Failed to read or parse events.json:', err);
    return [];
  }
});

ipcMain.handle('save-events', async (event, updatedEvents) => {
  const filePath = path.join(__dirname, 'events.json');
  console.log(`[MAIN] Saving ${updatedEvents.length} events to:`, filePath);

  try {
    fs.writeFileSync(filePath, JSON.stringify(updatedEvents, null, 2), 'utf-8');
    console.log('[MAIN] Events saved successfully');
    return { success: true };
  } catch (err) {
    console.error('[MAIN] Failed to save events:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('select-and-process-image', async (event, eventToken) => {
  console.log('[MAIN] Selecting image for event token:', eventToken);

  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }]
  });

  if (canceled || filePaths.length === 0) {
    console.log('[MAIN] Image selection canceled');
    return null;
  }

  const originalPath = filePaths[0];
  const ext = path.extname(originalPath).toLowerCase() || '.jpg';

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const uniqueName = `${dateStr}-${eventToken}-${uuidv4()}`;

  const outputDir = path.join(__dirname, 'images');
  const fullPath = path.join(outputDir, 'full', `${uniqueName}${ext}`);
  const smallPath = path.join(outputDir, 'small', `${uniqueName}${ext}`);
  const thumbPath = path.join(outputDir, 'thumb', `${uniqueName}${ext}`);

  fs.mkdirSync(path.join(outputDir, 'full'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'small'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'thumb'), { recursive: true });

  console.log('[MAIN] Processing image sizes...');
  await sharp(originalPath)
    .resize({ width: 1600 })
    .toFile(fullPath);
  await sharp(originalPath)
    .resize({ width: 800 })
    .toFile(smallPath);
  await sharp(originalPath)
    .resize(200, 200)
    .toFile(thumbPath);

  console.log('[MAIN] Images saved locally:', { fullPath, smallPath, thumbPath });

  return {
    full: fullPath,
    small: smallPath,
    thumb: thumbPath,
    filename: `${uniqueName}${ext}`
  };
});


function getLast4OfMac() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (!config.internal && config.mac && config.mac !== '00:00:00:00:00:00') {
        return config.mac.replace(/:/g, '').slice(-4).toUpperCase();
      }
    }
  }
  return 'XXXX';
}

ipcMain.handle('get-mac-token-prefix', () => {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  console.log('[MAIN] Providing token prefix:', `${dateStr}-${getLast4OfMac()}`);
  return `${dateStr}-${getLast4OfMac()}`;
});