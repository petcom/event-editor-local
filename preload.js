const { contextBridge, ipcRenderer } = require('electron');
//const path = require('path');

contextBridge.exposeInMainWorld('api', {
  // Event operations
  loadEvents: () => ipcRenderer.invoke('load-events'),
  saveEvents: (updatedEvents) => ipcRenderer.invoke('save-events', updatedEvents),
  selectAndProcessImage: (eventToken) => ipcRenderer.invoke('select-and-process-image', eventToken),
  generateTokenPrefix: () => ipcRenderer.invoke('get-mac-token-prefix'),
  mergeEventsToServer: (token) => ipcRenderer.invoke('merge-events-to-server', token),
    //login window
  openLoginWindow: () => ipcRenderer.send('open-login-window'),
  // login callback
  ipc: {
    onAuthToken: (callback) => ipcRenderer.on('auth-token', (_event, token) => callback(token))
    },
  // Path utils
  path: {
    basename: (p) => path.basename(p),
  },

   // ✅ Fallback for path.basename
  basename: (p) => p.split(/[\\/]/).pop(),

  // S3 operations
  s3: {
    getImagePrefix: () => ipcRenderer.invoke('get-s3-prefix'),
    uploadToS3: (localPath, destKey) => ipcRenderer.invoke('upload-to-s3', localPath, destKey),
  },

  // File operations
  checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),

  // Logging
  appendToLogFile: (filename, content) => ipcRenderer.invoke('append-to-log-file', filename, content),
});

contextBridge.exposeInMainWorld('env', {
  mergeServerURL: process.env.MERGE_SERVER_URL,
  loginAPIEndpoint: process.env.LOGIN_API_ENDPOINT,
});
