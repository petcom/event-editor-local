console.log('[DEBUG] renderer.js loaded');
console.log('[DEBUG] window.api:', window.api);

import { loadEvents, saveEvent, deleteEvent, addNewEvent } from './events.js';
import { clearFormWithId, renderEventList, loadEventToForm } from './ui.js';
import { handleImageUpload } from './uploads.js';

let events = [];

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[DEBUG] DOMContentLoaded fired');

  events = await loadEvents();
  console.log('[DEBUG] Initial events loaded:', events);

  renderEventList(events, loadEventToForm);
  console.log('[DEBUG] Event list rendered');

  // Submit/save changes
  document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[DEBUG] Save button clicked');

    events = await saveEvent(events);
    console.log('[DEBUG] Events after save:', events);

    renderEventList(events, loadEventToForm);
  });

  // Delete selected event
  document.getElementById('deleteEventBtn').addEventListener('click', async () => {
    console.log('[DEBUG] Delete button clicked');

    events = await deleteEvent(events);
    console.log('[DEBUG] Events after delete:', events);

    renderEventList(events, loadEventToForm);
    clearFormWithId('');
  });

  // Upload image for selected event
  document.getElementById('uploadImageBtn').addEventListener('click', async () => {
    console.log('[DEBUG] Upload image button clicked');
    handleImageUpload(events);
  });

  // Add a new event (generate ID, clear form)
  document.getElementById('addEventBtn').addEventListener('click', async () => {
    console.log('[DEBUG] Add New Event button clicked');

    const newEvent = await addNewEvent(events);
    console.log('[DEBUG] Generated new event:', newEvent);

    clearFormWithId(newEvent.id);
  });
});
