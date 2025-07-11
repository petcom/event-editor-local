export function lockUIForSync() {
  console.log('[UI] Locking UI for sync operation');
  
  const eventList = document.getElementById('eventList');
  const form = document.getElementById('eventForm');
  const buttons = document.querySelectorAll('button');
  
  if (eventList) eventList.classList.add('locked');
  if (form) form.classList.add('locked');
  
  buttons.forEach(btn => {
    btn.disabled = true;
  });
}

export function unlockUIAfterSync() {
  console.log('[UI] Unlocking UI after sync operation');
  
  const eventList = document.getElementById('eventList');
  const form = document.getElementById('eventForm');
  const buttons = document.querySelectorAll('button');
  
  if (eventList) eventList.classList.remove('locked');
  if (form) form.classList.remove('locked');
  
  buttons.forEach(btn => {
    btn.disabled = false;
  });
}

export function enableFormInputs() {
  const form = document.getElementById('eventForm');
  if (form) form.classList.remove('locked');
}

export function clearFormWithId(newId) {
  console.log('[UI] Clearing form and setting new ID:', newId);

  const fields = [
    'id', 'title', 'description', 'long_description',
    'event_date', 'display_from_date', 'tags', 'ticket_url',
    'full_image_url', 'small_image_url', 'thumb_image_url', 'group_id'
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

  // Clear checkboxes
  const checkbox = document.getElementById('images_uploaded_to_s3');
  if (checkbox) {
    checkbox.checked = false;
    console.log('[UI] Cleared checkbox: images_uploaded_to_s3');
  }

  const eventUpdatedCheckbox = document.getElementById('event_updated_not_submitted');
  if (eventUpdatedCheckbox) {
    eventUpdatedCheckbox.checked = false;
    console.log('[UI] Cleared checkbox: event_updated_not_submitted');
  }

  const idEl = document.getElementById('id');
  if (idEl) {
    idEl.value = newId;
    console.log('[UI] New ID set to:', newId);
  } else {
    console.warn('[UI] Could not set new ID — #id element not found');
  }

  // Clear image preview
  clearImagePreview();
}

export function renderEventList(events, onClickCallback) {
  console.log('[UI] Rendering event list. Count:', events.length);

  const list = document.getElementById('eventList');
  if (!list) {
    console.error('[UI] #eventList element not found');
    return;
  }

  list.innerHTML = '';

  events.forEach((evt, i) => {
    const li = document.createElement('li');
    let displayText = `${evt.event_date}: ${evt.title}`;
    
    // Add indicator for events that need to be submitted
    if (evt.event_updated_not_submitted) {
      displayText += ' 🔄';
      li.classList.add('event-updated');
    }
    
    li.textContent = displayText;
    li.addEventListener('click', (event) => {
      if (!list.classList.contains('locked')) {
        console.log('[UI] Event clicked:', evt.id, 'at index', i);
        onClickCallback(evt);
      }
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
  assign('ticket_url', evt.ticket_url);
  assign('full_image_url', evt.full_image_url);
  assign('small_image_url', evt.small_image_url);
  assign('thumb_image_url', evt.thumb_image_url);
  assign('group_id', evt.group_id);

  // Handle checkboxes
  const checkbox = document.getElementById('images_uploaded_to_s3');
  if (checkbox) {
    checkbox.checked = evt.images_uploaded_to_s3 || false;
    console.log('[UI] Set checkbox images_uploaded_to_s3 to:', evt.images_uploaded_to_s3);
  }

  const eventUpdatedCheckbox = document.getElementById('event_updated_not_submitted');
  if (eventUpdatedCheckbox) {
    eventUpdatedCheckbox.checked = evt.event_updated_not_submitted || false;
    console.log('[UI] Set checkbox event_updated_not_submitted to:', evt.event_updated_not_submitted);
  }

  // Update image preview
  updateImagePreview(evt);
}

export function updateImagePreview(evt) {
  const preview = document.getElementById('eventImagePreview');
  if (!preview) return;

  // Try to get the best image URL available - prioritize small_image_url
  let imageUrl = null;
  
  // Prioritize small_image_url first
  if (evt.small_image_url) {
    imageUrl = evt.small_image_url;
  } else if (evt.thumb_image_url) {
    imageUrl = evt.thumb_image_url;
  } else if (evt.full_image_url) {
    imageUrl = evt.full_image_url;
  }

  if (imageUrl) {
    preview.src = imageUrl;
    preview.classList.add('visible');
    preview.title = `Image: ${imageUrl}`;
    console.log('[UI] Set image preview to:', imageUrl);
    
    // Handle image load errors
    preview.onerror = () => {
      console.warn('[UI] Failed to load image:', imageUrl);
      preview.classList.remove('visible');
    };
  } else {
    preview.classList.remove('visible');
    preview.title = '';
    console.log('[UI] No image URL available for preview');
  }
}

export function clearImagePreview() {
  const preview = document.getElementById('eventImagePreview');
  if (preview) {
    preview.src = '';
    preview.classList.remove('visible');
    console.log('[UI] Cleared image preview');
  }
}
