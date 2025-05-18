console.log('[DEBUG] renderer.js loaded');
console.log('[DEBUG] window.api:', window.api);

let events = [];

// View state variables
let currentView = 'list';
let currentSize = 40;

// Modal state
let isEditingEvent = false;

window.addEventListener('DOMContentLoaded', async () => {
  try {
    events = await window.api.loadEvents();
    renderAllViews();
    setActiveView('list'); // Default view
  } catch (err) {
    console.error('Failed to load events:', err);
  }

  // Submit handler
  const form = document.getElementById('eventForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveEvent();
    closeModal();
  });

  // Delete event button
  document.getElementById('deleteEventBtn').addEventListener('click', () => {
    console.log('[DEBUG] Delete button clicked');
    deleteEvent();
    closeModal();
  });

  // Upload image button
  document.getElementById('uploadImageBtn').addEventListener('click', async () => {
    const eventToken = document.getElementById('id').value || 'untagged';
    const result = await window.api.selectAndProcessImage(eventToken);

    if (result) {
      document.getElementById('full_image_url').value = result.full;
      document.getElementById('small_image_url').value = result.small;
      document.getElementById('thumb_url').value = result.thumb;
    }
  });

  // Add new event button (inside modal)
  document.getElementById('addEventBtn').addEventListener('click', async () => {
    const newId = await generateSequentialEventId();
    clearFormWithId(newId);
  });

  // Create new event button (outside modal)
  document.getElementById('createEventBtn').addEventListener('click', async () => {
    const newId = await generateSequentialEventId();
    clearFormWithId(newId);
    openModal('Create New Event');
  });

  // Close modal button
  document.getElementById('closeModal').addEventListener('click', () => {
    closeModal();
  });

  // Close modal when clicking outside
  document.getElementById('eventModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('eventModal')) {
      closeModal();
    }
  });

  // View toggle buttons
  document.getElementById('listViewBtn').addEventListener('click', () => {
    setActiveView('list');
  });

  document.getElementById('thumbnailViewBtn').addEventListener('click', () => {
    setActiveView('thumbnail');
  });

  document.getElementById('detailsViewBtn').addEventListener('click', () => {
    setActiveView('details');
  });

  // Size slider
  const sizeSlider = document.getElementById('sizeSlider');
  sizeSlider.addEventListener('input', (e) => {
    currentSize = parseInt(e.target.value);
    updateViewSizes();
  });

  // Add keyboard event listener for Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

// Render all views
function renderAllViews() {
  renderListView();
  renderThumbnailView();
  renderDetailsView();
}

// Render list view (original view)
function renderListView() {
  const list = document.getElementById('eventList');
  list.innerHTML = '';
  events.forEach((event, index) => {
    const li = document.createElement('li');

    // Create thumbnail image element
    const img = document.createElement('img');
    img.className = 'event-thumbnail';

    // Set image source or placeholder
    if (event.thumb_url && event.thumb_url !== 'none' && event.thumb_url !== '') {
      img.src = event.thumb_url;
      img.alt = event.title;
    } else {
      img.src = 'images/default-thumb.png';
      img.alt = 'Default thumbnail';
    }

    // Create event info container
    const eventInfo = document.createElement('div');
    eventInfo.className = 'event-info';
    eventInfo.textContent = `${event.event_date}: ${event.title}`;

    // Add elements to list item
    li.appendChild(img);
    li.appendChild(eventInfo);

    li.addEventListener('click', () => {
      loadEventToForm(index);
      openModal('Edit Event');
    });
    list.appendChild(li);
  });
}

// Render thumbnail grid view
function renderThumbnailView() {
  const grid = document.getElementById('eventGrid');
  grid.innerHTML = '';

  events.forEach((event, index) => {
    const item = document.createElement('div');
    item.className = 'thumbnail-item';

    // Create thumbnail image
    const img = document.createElement('img');
    img.className = 'thumbnail-img';

    // Set image source or placeholder
    if (event.thumb_url && event.thumb_url !== 'none' && event.thumb_url !== '') {
      img.src = event.thumb_url;
      img.alt = event.title;
    } else {
      img.src = 'images/default-thumb.png';
      img.alt = 'Default thumbnail';
    }

    // Create title element
    const title = document.createElement('div');
    title.className = 'thumbnail-title';
    title.textContent = event.title;

    // Add elements to thumbnail item
    item.appendChild(img);
    item.appendChild(title);

    item.addEventListener('click', () => {
      loadEventToForm(index);
      openModal('Edit Event');
    });
    grid.appendChild(item);
  });
}

// Render details panel view
function renderDetailsView() {
  const detailsContainer = document.getElementById('eventDetails');
  detailsContainer.innerHTML = '';

  events.forEach((event, index) => {
    const panel = document.createElement('div');
    panel.className = 'detail-panel';

    // Create panel header
    const header = document.createElement('div');
    header.className = 'detail-header';

    // Create thumbnail image
    const img = document.createElement('img');

    // Set image source or placeholder
    if (event.thumb_url && event.thumb_url !== 'none' && event.thumb_url !== '') {
      img.src = event.thumb_url;
      img.alt = event.title;
    } else {
      img.src = 'images/default-thumb.png';
      img.alt = 'Default thumbnail';
    }

    // Create title element
    const title = document.createElement('div');
    title.className = 'detail-title';
    title.textContent = event.title;

    // Add elements to header
    header.appendChild(img);
    header.appendChild(title);

    // Create panel content
    const content = document.createElement('div');
    content.className = 'detail-content';

    // Create date element
    const date = document.createElement('div');
    date.className = 'detail-date';
    date.textContent = `Event Date: ${event.event_date}`;

    // Create description element
    const description = document.createElement('div');
    description.className = 'detail-description';
    description.textContent = event.description;

    // Add elements to content
    content.appendChild(date);
    content.appendChild(description);

    // Add header and content to panel
    panel.appendChild(header);
    panel.appendChild(content);

    panel.addEventListener('click', () => {
      loadEventToForm(index);
      openModal('Edit Event');
    });
    detailsContainer.appendChild(panel);
  });
}

// Set active view
function setActiveView(view) {
  currentView = view;

  // Update body class
  document.body.classList.remove('list-view-active', 'thumbnail-view-active', 'details-view-active');
  document.body.classList.add(`${view}-view-active`);

  // Update button states
  document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`${view}ViewBtn`).classList.add('active');

  // Update view sizes
  updateViewSizes();
}

// Update view sizes based on slider
function updateViewSizes() {
  const size = currentSize;

  // Update list view
  if (currentView === 'list') {
    document.querySelectorAll('.event-thumbnail').forEach(img => {
      img.style.width = `${size}px`;
      img.style.height = `${size}px`;
    });
  }

  // Update thumbnail view
  if (currentView === 'thumbnail') {
    const grid = document.getElementById('eventGrid');
    const minWidth = Math.max(size, 80); // Minimum width to accommodate title
    grid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${minWidth}px, 1fr))`;

    // Show/hide titles based on size
    const showTitles = size >= 32;
    document.querySelectorAll('.thumbnail-title').forEach(title => {
      title.style.display = showTitles ? 'block' : 'none';
    });
  }

  // Update details view
  if (currentView === 'details') {
    const detailsContainer = document.getElementById('eventDetails');
    const minWidth = Math.max(size * 3, 150); // Panels are wider than thumbnails
    detailsContainer.style.gridTemplateColumns = `repeat(auto-fill, minmax(${minWidth}px, 1fr))`;

    // Adjust panel header size
    document.querySelectorAll('.detail-header img').forEach(img => {
      img.style.width = `${size}px`;
      img.style.height = `${size}px`;
    });
  }
}

// Legacy function name for compatibility
function renderEventList() {
  renderAllViews();
}

// Modal functions
function openModal(title) {
  const modal = document.getElementById('eventModal');
  const modalTitle = document.querySelector('.modal-title');

  // Set modal title
  modalTitle.textContent = title;

  // Show modal
  modal.classList.add('active');

  // Set focus to first input field
  setTimeout(() => {
    document.getElementById('title').focus();
  }, 100);
}

function closeModal() {
  const modal = document.getElementById('eventModal');
  modal.classList.remove('active');
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
      renderAllViews();
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

async function deleteEvent() {
  const id = document.getElementById('id').value;
  console.log('[DEBUG] Deleting event with ID:', id);

  const index = events.findIndex(e => e.id === id);
  if (index === -1) {
    console.warn('No matching event to delete');
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete event "${events[index].title}"?`);
  if (!confirmed) return;

  events.splice(index, 1); // remove from array

  try {
    const result = await window.api.saveEvents(events);
    if (result.success) {
      renderAllViews();
      clearFormWithId('');
      console.log('[RENDERER] Event deleted');
    } else {
      console.error('[RENDERER] Failed to delete event:', result.error);
    }
  } catch (err) {
    console.error('[RENDERER] Unexpected delete error:', err);
  }
}
});
