const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');

const path = require('path');
const registerAllHandlers = require('./handlers');
const { openLoginWindow } = require('./windows/loginWindow');

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

  win.setTitle('Main');
  win.loadFile('index.html');
}



app.whenReady().then(() => {
  registerAllHandlers(); // ✅ load all ipc handlers
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('open-login-window', () => {
  openLoginWindow();
});

ipcMain.on('login-success', (event, token) => {
  console.log('[MAIN] Login token received:', token);

  // Send the token to the first main window (or refine with a title filter if needed)
  const mainWin = BrowserWindow.getAllWindows().find(win => win.title !== 'Login');

  if (mainWin) {
    mainWin.webContents.send('auth-token', token);
  } else {
    console.warn('[MAIN] No main window found to send auth token');
  }
});
