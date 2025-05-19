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

  // Save event button handler
  document.getElementById('saveEventBtn').addEventListener('click', () => {
    saveEvent();
    closeModal();
  });

  // Create event button handler
  document.getElementById('createBtn').addEventListener('click', () => {
    saveEvent();
    closeModal();
  });

  // Cancel button handler
  document.getElementById('cancelBtn').addEventListener('click', () => {
    closeModal();
  });

  // Delete event button
  document.getElementById('deleteEventBtn').addEventListener('click', () => {
    console.log('[DEBUG] Delete button clicked');
    deleteEvent();
    closeModal();
  });

  // Tab switching functionality
  document.querySelectorAll('.image-tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all tabs
      document.querySelectorAll('.image-tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });

      // Add active class to clicked tab
      button.classList.add('active');

      // Show corresponding tab content
      const tabId = button.id.replace('Btn', '');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Image upload functionality
  const uploadArea = document.getElementById('imageUploadArea');
  const fileInput = document.getElementById('imageFileInput');

  // Click on upload area to trigger file input
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Handle file selection
  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      const eventToken = document.getElementById('id').value || 'untagged';
      const result = await window.api.selectAndProcessImage(eventToken);

      if (result) {
        document.getElementById('full_image_url').value = result.full;
        document.getElementById('small_image_url').value = result.small;
        document.getElementById('thumb_url').value = result.thumb;

        // Update the image preview
        updateImagePreview(result.full);

        // Update image paths display
        updateImagePaths(result.full, result.small, result.thumb);

        // Switch to preview tab
        document.getElementById('previewTabBtn').click();
      }
    }
  });

  // Drag and drop functionality
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    if (e.dataTransfer.files.length > 0) {
      const eventToken = document.getElementById('id').value || 'untagged';
      const result = await window.api.selectAndProcessImage(eventToken);

      if (result) {
        document.getElementById('full_image_url').value = result.full;
        document.getElementById('small_image_url').value = result.small;
        document.getElementById('thumb_url').value = result.thumb;

        // Update the image preview
        updateImagePreview(result.full);

        // Update image paths display
        updateImagePaths(result.full, result.small, result.thumb);

        // Switch to preview tab
        document.getElementById('previewTabBtn').click();
      }
    }
  });

  // No longer needed - removed toggle fields button

  // We've removed the "New Event" button from the modal

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

  // Track if mousedown started on the overlay
  let mouseDownOnOverlay = false;

  // Prevent clicks on the modal container from propagating to the overlay
  document.querySelector('.modal-container').addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  // Set flag when mousedown occurs on overlay
  document.getElementById('eventModal').addEventListener('mousedown', (e) => {
    // Only set the flag if the click is directly on the overlay, not on any of its children
    mouseDownOnOverlay = (e.target === document.getElementById('eventModal'));
  });

  // Close modal only if both mousedown and mouseup occurred on the overlay
  document.getElementById('eventModal').addEventListener('mouseup', (e) => {
    if (mouseDownOnOverlay && e.target === document.getElementById('eventModal')) {
      closeModal();
    }
    // Reset the flag
    mouseDownOnOverlay = false;
  });

  // Reset the flag if mouse leaves the window
  window.addEventListener('mouseleave', () => {
    mouseDownOnOverlay = false;
  });

  // Also reset the flag on any mouse movement over modal content
  document.querySelector('.modal-container').addEventListener('mousemove', () => {
    mouseDownOnOverlay = false;
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

  // Update modal title when title field changes (for editing mode)
  document.getElementById('title').addEventListener('input', (e) => {
    const modalTitle = document.querySelector('.modal-title');
    const isCreating = modalTitle.textContent === 'Create New Event';

    if (!isCreating && document.getElementById('eventModal').classList.contains('active')) {
      modalTitle.textContent = `Editing ${e.target.value}`;
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
  const isCreating = title === 'Create New Event';

  // Set up buttons based on mode
  document.getElementById('deleteEventBtn').style.display = isCreating ? 'none' : 'inline-flex';
  document.getElementById('cancelBtn').style.display = isCreating ? 'inline-flex' : 'none';
  document.getElementById('saveEventBtn').style.display = isCreating ? 'none' : 'inline-flex';
  document.getElementById('createBtn').style.display = isCreating ? 'inline-flex' : 'none';

  // Set modal title
  if (isCreating) {
    modalTitle.textContent = 'Create New Event';
  } else {
    const eventTitle = document.getElementById('title').value;
    modalTitle.textContent = `Editing ${eventTitle}`;
  }

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

  // Update image preview - use full image for preview
  updateImagePreview(evt.full_image_url);

  // Update image paths display
  updateImagePaths(evt.full_image_url, evt.small_image_url, evt.thumb_url);

  // Update modal title if modal is open
  if (document.getElementById('eventModal').classList.contains('active')) {
    document.querySelector('.modal-title').textContent = `Editing ${evt.title}`;
  }

  // No longer needed - removed additional fields toggle

  // Switch to preview tab by default
  document.getElementById('previewTabBtn').click();

  // Reset image preview element
  const previewImg = document.getElementById('eventImagePreview');
  previewImg.style.display = 'block';
}

// Function to update the image preview
function updateImagePreview(imageUrl) {
  const previewImg = document.getElementById('eventImagePreview');
  const errorMessage = document.getElementById('imageErrorMessage');

  // Hide error message initially
  errorMessage.style.display = 'none';

  if (imageUrl && imageUrl !== 'none' && imageUrl !== '') {
    previewImg.src = imageUrl;
    previewImg.alt = 'Event image';
  } else {
    previewImg.src = 'images/default.png';
    previewImg.alt = 'Default image';
  }
}

// Function to handle image load errors
function handleImageError(img) {
  // Show error message
  const errorMessage = document.getElementById('imageErrorMessage');
  errorMessage.style.display = 'flex';

  // Set default image
  img.style.display = 'none';
}

// Function to update image paths display
function updateImagePaths(fullUrl, smallUrl, thumbUrl) {
  document.getElementById('fullImagePath').textContent = fullUrl || 'None';
  document.getElementById('smallImagePath').textContent = smallUrl || 'None';
  document.getElementById('thumbImagePath').textContent = thumbUrl || 'None';
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

  // Clear all form fields
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

  // Reset textarea heights to their default
  document.getElementById('description').style.height = '';
  document.getElementById('long_description').style.height = '';

  // Reset image preview to default
  updateImagePreview('');

  // Reset image paths display
  updateImagePaths('', '', '');

  // No longer needed - removed additional fields toggle

  // Switch to preview tab by default
  document.getElementById('previewTabBtn').click();

  // Reset image preview element
  const previewImg = document.getElementById('eventImagePreview');
  previewImg.style.display = 'block';
  document.getElementById('imageErrorMessage').style.display = 'none';
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
