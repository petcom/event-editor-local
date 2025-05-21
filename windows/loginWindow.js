// windows/loginWindow.js
const { BrowserWindow } = require('electron');
const path = require('path');

function openLoginWindow() {
  const loginWin = new BrowserWindow({
    width: 400,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload-login.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  loginWin.loadFile('login.html');
}

module.exports = { openLoginWindow };
