export function clearFormWithId(newId) {
  console.log('[UI] Clearing form and setting new ID:', newId);

  const fields = [
    'id', 'title', 'description', 'long_description',
    'event_date', 'display_from_date', 'tags',
    'full_image_url', 'small_image_url', 'thumb_url', 'group_id'
  ];

  fields.forEach(field => {
    const el = document.getElementById(field);
    if (el) {
      el.value = '';
      console.log(`[UI] Cleared field: ${field}`);
    } else {
      console.warn(`[UI] Element not found for field: ${field}`);
    }
  });

  const idEl = document.getElementById('id');
  if (idEl) {
    idEl.value = newId;
    console.log('[UI] New ID set to:', newId);
  } else {
    console.warn('[UI] Could not set new ID — #id element not found');
  }
}

export function renderEventList(events, onClick) {
  console.log('[UI] Rendering event list. Count:', events.length);

  const list = document.getElementById('eventList');
  if (!list) {
    console.error('[UI] #eventList element not found');
    return;
  }

  list.innerHTML = '';

  events.forEach((evt, i) => {
    const li = document.createElement('li');
    li.textContent = `${evt.event_date}: ${evt.title}`;
    li.addEventListener('click', () => {
      console.log('[UI] Event clicked:', evt.id, 'at index', i);
      onClick(evt);
    });
    list.appendChild(li);
    console.log('[UI] Appended event to list:', evt.id);
  });
}

export function loadEventToForm(evt) {
  if (!evt) {
    console.warn('[UI] No event provided to loadEventToForm');
    return;
  }

  console.log('[UI] Loading event into form:', evt.id);

  const assign = (id, value) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = value || '';
      console.log(`[UI] Set form field "${id}" to:`, value);
    } else {
      console.warn(`[UI] Form element not found for field: ${id}`);
    }
  };

  assign('id', evt.id);
  assign('title', evt.title);
  assign('description', evt.description);
  assign('long_description', evt.long_description);
  assign('event_date', evt.event_date);
  assign('display_from_date', evt.display_from_date);
  assign('tags', evt.tags.join(', '));
  assign('full_image_url', evt.full_image_url);
  assign('small_image_url', evt.small_image_url);
  assign('thumb_url', evt.thumb_url);
  assign('group_id', evt.group_id);
}

