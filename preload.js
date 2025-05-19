const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('api', {
  loadEvents: () => ipcRenderer.invoke('load-events'),
  saveEvents: (updatedEvents) => ipcRenderer.invoke('save-events', updatedEvents),
  selectAndProcessImage: (eventToken) => ipcRenderer.invoke('select-and-process-image', eventToken),
  generateTokenPrefix: () => ipcRenderer.invoke('get-mac-token-prefix'),
  uploadToS3: (localPath, destKey) => ipcRenderer.invoke('upload-to-s3', localPath, destKey),
    path: {
        basename: (p) => path.basename(p)
    },
  mergeEventsToServer: (token) => ipcRenderer.invoke('merge-events-to-server', token)


});
