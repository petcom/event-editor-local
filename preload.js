const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('api', {
  loadEvents: () => ipcRenderer.invoke('load-events'),
  saveEvents: (updatedEvents) => ipcRenderer.invoke('save-events', updatedEvents),
  selectAndProcessImage: (eventToken) => ipcRenderer.invoke('select-and-process-image', eventToken),
  generateTokenPrefix: () => ipcRenderer.invoke('get-mac-token-prefix')
});
