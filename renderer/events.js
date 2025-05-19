import { generateTokenPrefix } from './token.js';

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
    thumb_url: document.getElementById('thumb_url').value,
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

export async function addNewEvent(events) {
  const prefix = await generateTokenPrefix();
  console.log('[EVENTS] Token prefix for new event:', prefix);

  const todayEvents = events.filter(e => e.id.startsWith(prefix));
  const newId = `${prefix}-${String(todayEvents.length + 1).padStart(3, '0')}`;

  console.log('[EVENTS] Generated new event ID:', newId);
  return { id: newId };
}
