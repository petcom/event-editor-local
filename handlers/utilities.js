const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

module.exports = function registerUtilityHandlers() {
  ipcMain.handle('check-file-exists', async (event, filePath) => {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('append-to-log-file', async (event, filename, content) => {
    const logPath = path.join(__dirname, filename);
    try {
      await fs.promises.appendFile(logPath, content);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
};
