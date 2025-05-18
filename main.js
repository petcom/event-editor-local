const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
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
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
});

ipcMain.handle('select-and-process-image', async (event, eventToken) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }]
  });

  if (canceled || filePaths.length === 0) return null;

  const originalPath = filePaths[0];
  const ext = path.extname(originalPath).toLowerCase() || '.jpg';

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const uniqueName = `${dateStr}-${eventToken}-${uuidv4()}`;

  const outputDir = path.join(__dirname, 'images');
  const fullPath = path.join(outputDir, 'full', `${uniqueName}${ext}`);
  const smallPath = path.join(outputDir, 'small', `${uniqueName}${ext}`);
  const thumbPath = path.join(outputDir, 'thumb', `${uniqueName}${ext}`);

  fs.mkdirSync(path.join(outputDir, 'full'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'small'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'thumb'), { recursive: true });

  await sharp(originalPath)
    .resize({ width: 1600 })
    .toFile(fullPath);

  await sharp(originalPath)
    .resize({ width: 800 })
    .toFile(smallPath);

  await sharp(originalPath)
    .resize(200, 200)
    .toFile(thumbPath);

  return {
    full: fullPath,
    small: smallPath,
    thumb: thumbPath,
    filename: `${uniqueName}${ext}`
  };
});

ipcMain.handle('save-events', async (event, updatedEvents) => {
  const filePath = path.join(__dirname, 'events.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(updatedEvents, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    console.error('[MAIN] Failed to save events:', err);
    return { success: false, error: err.message };
  }
});

