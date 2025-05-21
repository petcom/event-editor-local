const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const eventsPath = path.join(__dirname, '..', 'events.json');
const MERGE_SERVER_URL = process.env.MERGE_SERVER_URL;

console.log('[EVENTS] Registering event handlers');
console.log('[EVENTS] Event file path:', eventsPath);

module.exports = function registerEventHandlers() {
  console.log('[EVENTS] Registering event handlers');

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

  ipcMain.handle('merge-events-to-server', async (_event, tokenArg) => {
    console.log('[EVENTS] merge-events-to-server handler triggered');
    console.log('[EVENTS] Token received:', tokenArg);

    const MAX_RETRIES = 6; // 6 x 10s = 60 seconds
    const RETRY_INTERVAL_MS = 10000;
    const token = tokenArg;

    try {
      if (!fs.existsSync(eventsPath)) {
        console.warn('[EVENTS] No events.json file to merge');
        return { success: false, message: 'No local events file found' };
      }

      const data = fs.readFileSync(eventsPath, 'utf-8');
      const localEvents = JSON.parse(data);

      let retries = 0;
      let response, result;

      while (retries < MAX_RETRIES) {
        response = await fetch(`${MERGE_SERVER_URL}/api/events/merge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ events: localEvents })
        });

        result = await response.json();

        if (response.status !== 423) break;

        console.warn(`[EVENTS] Server locked. Retry ${retries + 1}/${MAX_RETRIES} in ${RETRY_INTERVAL_MS / 1000}s...`);
        await new Promise(res => setTimeout(res, RETRY_INTERVAL_MS));
        retries++;
      }

      if (response.status === 423) {
        console.warn('[EVENTS] Server still locked after max retries.');
        return { success: false, error: 'Merge still locked after retries', status: 423 };
      }

      if (!response.ok) {
        console.error('[EVENTS] Merge failed:', result.message);
        return { success: false, error: result.message, status: response.status };
      }

      console.log(`[EVENTS] Merge successful. ${result.total} events on server.`);
      return { success: true, total: result.total };
    } catch (err) {
      console.error('[EVENTS] Failed to merge:', err);
      return { success: false, error: err.message };
    }
  });
};
