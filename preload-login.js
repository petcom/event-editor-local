// preload-login.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('loginAPI', {
  sendLoginToken: (token) => ipcRenderer.send('login-success', token)
});

contextBridge.exposeInMainWorld('env', {
  mergeServerURL: process.env.MERGE_SERVER_URL,
  loginAPIEndpoint: process.env.LOGIN_API_ENDPOINT,
});