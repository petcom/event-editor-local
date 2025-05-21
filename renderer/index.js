console.log('[DEBUG] renderer.js loaded');
console.log('[DEBUG] window.api:', window.api);

import { loadEvents, saveEvent, deleteEvent, addNewEvent, mergeEventsToServer } from './events.js';
import { clearFormWithId, renderEventList, loadEventToForm, setupMergeButton, lockUIForSync, unlockUIAfterSync, enableFormInputs } from './ui.js';
import { handleImageUpload, syncAllImagesToS3 } from './uploads.js';
import { getAuthToken, setAuthToken, clearAuthToken } from './auth.js';

let events = [];

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[DEBUG] DOMContentLoaded fired');

  // Require Login on each Load

const statusSpan = document.getElementById('serverStatus');

window.api?.ipc?.onAuthToken?.((token) => {
  console.log('[MAIN WINDOW] Token received from main process:', token);
  setAuthToken(token);
  if (statusSpan) statusSpan.textContent = 'Logged in';
});


  // Setup login button
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    console.log('[UI] Requesting login window...');
    window.api.openLoginWindow();
  });
}


  events = await loadEvents();
  console.log('[DEBUG] Initial events loaded:', events);

  renderEventList(events, loadEventToForm);
  console.log('[DEBUG] Event list rendered');

  setupMergeButton(events, getAuthToken);

  document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[DEBUG] Save button clicked');

    events = await saveEvent(events);
    console.log('[DEBUG] Events after save:', events);

    renderEventList(events, loadEventToForm);
  });

  document.getElementById('deleteEventBtn').addEventListener('click', async () => {
    console.log('[DEBUG] Delete button clicked');

    events = await deleteEvent(events);
    console.log('[DEBUG] Events after delete:', events);

    renderEventList(events, loadEventToForm);
    clearFormWithId('');
  });

  document.getElementById('uploadImageBtn').addEventListener('click', async () => {
    console.log('[DEBUG] Upload image button clicked');

    const input = document.getElementById('eventToken') || document.getElementById('id');
    if (!input) {
      console.error('[UPLOAD] Cannot find eventToken or id field in form');
      return;
    }

    const eventToken = input.value;
    console.log('[UPLOAD] Using token for image upload:', eventToken);

    await handleImageUpload(eventToken, events);
    renderEventList(events, loadEventToForm);
  });

  document.getElementById('addEventBtn').addEventListener('click', async () => {
    console.log('[DEBUG] Add New Event button clicked');

    const newEvent = await addNewEvent(events);
    console.log('[DEBUG] Generated new event:', newEvent);

    clearFormWithId(newEvent.id);
    enableFormInputs();
  });

  document.getElementById('syncImagesBtn').addEventListener('click', async () => {
    console.log('[SYNC] Sync Images button clicked');
    lockUIForSync();
    await syncAllImagesToS3(events);
    unlockUIAfterSync();

    renderEventList(events, loadEventToForm);
  });
});
