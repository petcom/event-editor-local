console.log('[DEBUG] renderer.js loaded');
console.log('[DEBUG] window.api:', window.api);

import { loadEvents, saveEvent, deleteEvent, addNewEvent, mergeEventsToServer } from './events.js';
import { clearFormWithId, renderEventList, loadEventToForm, setupMergeButton } from './ui.js';
import { handleImageUpload, syncAllImagesToS3 } from './uploads.js';


let events = [];

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[DEBUG] DOMContentLoaded fired');

  events = await loadEvents();
  console.log('[DEBUG] Initial events loaded:', events);

  renderEventList(events, loadEventToForm);
  console.log('[DEBUG] Event list rendered');

  setupMergeButton(events);

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

    const eventToken = document.getElementById('eventToken').value;
    await handleImageUpload(eventToken, events);

    renderEventList(events, loadEventToForm); // Optional: refresh UI after upload
  });

  document.getElementById('addEventBtn').addEventListener('click', async () => {
    console.log('[DEBUG] Add New Event button clicked');

    const newEvent = await addNewEvent(events);
    console.log('[DEBUG] Generated new event:', newEvent);

    clearFormWithId(newEvent.id);
  });

  document.getElementById('syncImagesBtn').addEventListener('click', async () => {
    console.log('[SYNC] Sync Images button clicked');
    await syncAllImagesToS3(events);

    renderEventList(events, loadEventToForm); // Optional: refresh UI with updated S3 URLs
    });
});
