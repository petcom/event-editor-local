const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

function getLast4OfMac() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (!config.internal && config.mac && config.mac !== '00:00:00:00:00:00') {
        return config.mac.replace(/:/g, '').slice(-4).toUpperCase();
      }
    }
  }
  return 'XXXX'; // fallback if no MAC address found
}

contextBridge.exposeInMainWorld('api', {
  loadEvents: () => ipcRenderer.invoke('load-events'),
  selectAndProcessImage: (eventToken) => ipcRenderer.invoke('select-and-process-image', eventToken),
  saveEvents: (updatedEvents) => ipcRenderer.invoke('save-events', updatedEvents),
  generateTokenPrefix: () => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const macSuffix = getLast4OfMac();
    return `${dateStr}-${macSuffix}`;
  }
});
