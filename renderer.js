console.log('[DEBUG] renderer.js loaded');
console.log('[DEBUG] window.api:', window.api);

let events = [];

window.addEventListener('DOMContentLoaded', async () => {
  try {
    events = await window.api.loadEvents();
    renderEventList();
  } catch (err) {
    console.error('Failed to load events:', err);
  }

  const form = document.getElementById('eventForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveEvent();
  });
});

document.getElementById('uploadImageBtn').addEventListener('click', async () => {
  const eventToken = document.getElementById('id').value || 'untagged';

  const result = await window.api.selectAndProcessImage(eventToken);

  if (result) {
    document.getElementById('full_image_url').value = result.full;
    document.getElementById('small_image_url').value = result.small;
    document.getElementById('thumb_url').value = result.thumb;
  }
});

function renderEventList() {
  const list = document.getElementById('eventList');
  list.innerHTML = '';
  events.forEach((event, index) => {
    const li = document.createElement('li');
    li.textContent = `${event.event_date}: ${event.title}`;
    li.addEventListener('click', () => loadEventToForm(index));
    list.appendChild(li);
  });
}

function loadEventToForm(index) {
  const evt = events[index];
  document.getElementById('id').value = evt.id;
  document.getElementById('title').value = evt.title;
  document.getElementById('description').value = evt.description;
  document.getElementById('long_description').value = evt.long_description;
  document.getElementById('event_date').value = evt.event_date;
  document.getElementById('display_from_date').value = evt.display_from_date;
  document.getElementById('tags').value = evt.tags.join(', ');
  document.getElementById('full_image_url').value = evt.full_image_url;
  document.getElementById('small_image_url').value = evt.small_image_url;
  document.getElementById('thumb_url').value = evt.thumb_url;
  document.getElementById('group_id').value = evt.group_id;
}

async function saveEvent() {
  const id = document.getElementById('id').value;
  const index = events.findIndex(e => e.id === id);

  const newEvent = {
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

  if (index === -1) {
    events.push(newEvent);
  } else {
    events[index] = newEvent;
  }

  try {
    const result = await window.api.saveEvents(events);
    if (result.success) {
      renderEventList();
    } else {
      console.error('[RENDERER] Failed to save events:', result.error);
    }
  } catch (err) {
    console.error('[RENDERER] Unexpected save error:', err);
  }
}


function clearFormWithId(newId) {
  console.log('[DEBUG] Generated new event ID:', newId);
  
  document.getElementById('id').value = newId;
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('long_description').value = '';
  document.getElementById('event_date').value = '';
  document.getElementById('display_from_date').value = '';
  document.getElementById('tags').value = '';
  document.getElementById('full_image_url').value = '';
  document.getElementById('small_image_url').value = '';
  document.getElementById('thumb_url').value = '';
  document.getElementById('group_id').value = '';
}

async function generateSequentialEventId() {
  const prefix = await window.api.generateTokenPrefix();
  const todayEvents = events.filter(e => e.id && e.id.startsWith(prefix));
  const count = todayEvents.length + 1;
  return `${prefix}-${String(count).padStart(3, '0')}`;
}


document.getElementById('addEventBtn').addEventListener('click', async () => {
  const newId = await generateSequentialEventId();   // ✅ await here
  clearFormWithId(newId);
});

