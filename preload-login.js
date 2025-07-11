// preload-login.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('loginAPI', {
  sendLoginToken: (token, serverUrl) => ipcRenderer.send('login-success', token, serverUrl)
});

contextBridge.exposeInMainWorld('env', {
  mergeServerURL: process.env.MERGE_SERVER_URL,
  loginAPIEndpoint: process.env.LOGIN_API_ENDPOINT,
  availableServers: process.env.AVAILABLE_SERVERS,
});