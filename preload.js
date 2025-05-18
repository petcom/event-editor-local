const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
loadEvents: () => ipcRenderer.invoke('load-events'),
selectAndProcessImage: (eventToken) => ipcRenderer.invoke('select-and-process-image', eventToken),
saveEvents: (updatedEvents) => ipcRenderer.invoke('save-events', updatedEvents)

});


