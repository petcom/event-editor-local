const { ipcMain, BrowserWindow } = require('electron');
const { openLoginWindow } = require('../windows/loginWindow');

module.exports = function registerLoginHandlers() {
  console.log('[LOGIN] Registering login handlers');

  //this may break the vars passing
  //ipcMain.on('open-login-window', () => {
  //  openLoginWindow();
  //});

  ipcMain.on('login-success', (event, token) => {
    console.log('[MAIN] Received login token:', token);

    const allWindows = BrowserWindow.getAllWindows();
    const mainWin = allWindows.find(w => w.getTitle() === 'Main') || allWindows[0];

    if (mainWin) {
      mainWin.webContents.send('auth-token', token);
    } else {
      console.warn('[MAIN] No main window found to send token');
    }
  });
};
