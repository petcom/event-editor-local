console.log('[EVENTS] events.js loaded');

import { generateTokenPrefix } from './token.js';
import { getAuthToken } from './auth.js';

const BASE_URL = window.env?.mergeServerURL || 'http://localhost:3000';

/**
 * Load events from the local events.json file.
 * @returns {Promise<Object[]>} The array of event objects.
 */
export async function loadEvents() {
  try {
    const loaded = await window.api.loadEvents();
    console.log('[EVENTS] Loaded events:', loaded);
    return loaded;
  } catch (err) {
    console.error('[EVENTS] Failed to load:', err);
    return [];
  }
}

/**
 * Save the current form event to the event list and persist to file.
 * @param {Object[]} events - The current array of events.
 * @returns {Promise<Object[]>} The updated array of events.
 */
export async function saveEvent(events) {
  const id = document.getElementById('id').value;
  const index = events.findIndex(e => e.id === id);

  const updatedEvent = {
    id,
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    long_description: document.getElementById('long_description').value,
    event_date: document.getElementById('event_date').value,
    display_from_date: document.getElementById('display_from_date').value,
    tags: document.getElementById('tags').value.split(',').map(t => t.trim()),
    full_image_url: document.getElementById('full_image_url').value,
    small_image_url: document.getElementById('small_image_url').value,
    thumb_image_url: document.getElementById('thumb_image_url').value,
    group_id: document.getElementById('group_id').value
  };

  console.log('[EVENTS] Saving event:', updatedEvent);

  if (index === -1) {
    console.log('[EVENTS] Adding new event');
    events.push(updatedEvent);
  } else {
    console.log('[EVENTS] Updating existing event at index', index);
    events[index] = updatedEvent;
  }

  const result = await window.api.saveEvents(events);
  if (!result.success) {
    console.error('[EVENTS] Save failed:', result.error);
  } else {
    console.log('[EVENTS] Save successful');
  }

  return events;
}

/**
 * Delete the currently selected event from the local list and file.
 * @param {Object[]} events - The current array of events.
 * @returns {Promise<Object[]>} The updated array of events.
 */
export async function deleteEvent(events) {
  const id = document.getElementById('id').value;
  const index = events.findIndex(e => e.id === id);

  console.log('[EVENTS] Attempting to delete event with ID:', id);

  if (index === -1) {
    console.warn('[EVENTS] No matching event found to delete');
    return events;
  }

  const confirmed = confirm(`Delete event "${events[index].title}"?`);
  if (!confirmed) {
    console.log('[EVENTS] Delete cancelled by user');
    return events;
  }

  console.log('[EVENTS] Deleting event at index', index);
  events.splice(index, 1);

  const result = await window.api.saveEvents(events);
  if (!result.success) {
    console.error('[EVENTS] Delete failed:', result.error);
  } else {
    console.log('[EVENTS] Delete successful');
  }

  return events;
}

/**
 * Generate a new event ID and return a blank event template with that ID.
 * @param {Object[]} events - The current array of events.
 * @returns {Promise<{id: string}>} A new event object with a unique ID.
 */
export async function addNewEvent(events) {
  const prefix = await window.api.generateTokenPrefix();
  console.log('[EVENTS] Token prefix for new event:', prefix);

  const todayEvents = events.filter(e => e.id.startsWith(prefix));
  const newId = `${prefix}-${String(todayEvents.length + 1).padStart(3, '0')}`;

  console.log('[EVENTS] Generated new event ID:', newId);
  return { id: newId };
}

/**
 * Send local events to the server using a merge API.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function mergeEventsToServer() {
  const token = getAuthToken();
  if (!token) {
    alert('You must log in before merging.');
    return { success: false, error: 'Not logged in' };
  }

  try {
    const result = await window.api.mergeEventsToServer(token);
    return result;
  } catch (err) {
    console.error('[EVENTS] Merge failed from renderer:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sync events with the server:
 * - Remove local events that no longer exist on the server.
 * - Add server events that are not present locally.
 * @returns {Promise<{success: boolean, updated?: Object[], error?: string}>}
 */
export async function syncEventsWithServer() {
  const token = getAuthToken();
  if (!token) {
    alert('You must log in before syncing.');
    return { success: false, error: 'Not logged in' };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/events`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const serverEvents = await response.json();
    const serverIds = new Set(serverEvents.map(e => e.id));

    const localEvents = await window.api.loadEvents();
    const localIds = new Set(localEvents.map(e => e.id));

    let mergedEvents = localEvents.filter(e => serverIds.has(e.id));
    const newServerEvents = serverEvents.filter(e => !localIds.has(e.id));
    mergedEvents = mergedEvents.concat(newServerEvents);

    await window.api.saveEvents(mergedEvents);
    console.log(`[EVENTS] Sync complete. ${newServerEvents.length} new events added, ${localEvents.length - mergedEvents.length} removed.`);

    return { success: true, updated: mergedEvents };
  } catch (err) {
    console.error('[EVENTS] Sync failed:', err);
    return { success: false, error: err.message };
  }
}
