const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadEvents: () => ipcRenderer.invoke('load-events')
});
