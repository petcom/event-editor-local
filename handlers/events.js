const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const eventsPath = path.join(__dirname, '..', 'events.json');

console.log('[EVENTS] Registering event handlers');
console.log('[EVENTS] Event file path:', eventsPath);

module.exports = function registerEventHandlers() {
  ipcMain.handle('load-events', async () => {
    console.log('[EVENTS] load-events handler triggered');

    try {
      if (!fs.existsSync(eventsPath)) {
        console.warn('[EVENTS] events.json not found, returning empty array');
        return [];
      }

      const data = fs.readFileSync(eventsPath, 'utf-8');
      const parsed = JSON.parse(data);
      console.log(`[EVENTS] Loaded ${parsed.length} events`);
      return parsed;
    } catch (err) {
      console.error('[EVENTS] Failed to load:', err);
      return [];
    }
  });

  ipcMain.handle('save-events', async (_event, updatedEvents) => {
    console.log('[EVENTS] save-events handler triggered');
    console.log(`[EVENTS] Saving ${updatedEvents.length} events`);

    try {
      fs.writeFileSync(eventsPath, JSON.stringify(updatedEvents, null, 2), 'utf-8');
      console.log('[EVENTS] Save successful');
      return { success: true };
    } catch (err) {
      console.error('[EVENTS] Failed to save:', err);
      return { success: false, error: err.message };
    }
  });
};
