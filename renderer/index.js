console.log('[DEBUG] window.api:', window.api);

import { loadEvents, saveEvent, deleteEvent, addNewEvent, mergeEventsToServer, syncEventsWithServer, setServerUrl } from './events.js';
import { clearFormWithId, renderEventList, loadEventToForm, lockUIForSync, unlockUIAfterSync, enableFormInputs, updateImagePreview } from './ui.js';
import { handleImageUpload, syncAllImagesToS3 } from './uploads.js';
import { getAuthToken, setAuthToken, clearAuthToken } from './auth.js';
import { workflowManager } from './workflow.js';

let events = [];

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[DEBUG] DOMContentLoaded fired');

  // Setup auth token handling
  const statusSpan = document.getElementById('serverStatus');
  const currentServerSpan = document.getElementById('currentServer');

  // Initialize server display
  function updateServerDisplay(serverUrl) {
    if (currentServerSpan) {
      // Parse server name from available servers list
      const availableServers = window.env.availableServers;
      let serverName = serverUrl;
      
      if (availableServers) {
        const serverPairs = availableServers.split('|');
        for (let i = 0; i < serverPairs.length; i += 2) {
          if (i + 1 < serverPairs.length && serverPairs[i + 1] === serverUrl) {
            serverName = serverPairs[i];
            break;
          }
        }
      }
      
      currentServerSpan.textContent = serverName;
    }
  }

  // Set initial server display
  updateServerDisplay(window.env.mergeServerURL);

  window.api?.ipc?.onAuthToken?.((token, serverUrl) => {
    console.log('[MAIN WINDOW] Token received from main process:', token);
    console.log('[MAIN WINDOW] Server URL:', serverUrl);
    setAuthToken(token);
    workflowManager.setAuthToken(token);
    if (statusSpan) statusSpan.textContent = 'Logged in';
    
    // Update server display with selected server
    if (serverUrl) {
      updateServerDisplay(serverUrl);
      setServerUrl(serverUrl); // Update the events module with new server URL
    }
    
    workflowManager.updateButtonStates();
  });

  // Setup login button
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      console.log('[UI] Requesting login window...');
      window.api.openLoginWindow();
    });
  }

  // Load initial events
  events = await loadEvents();
  console.log('[DEBUG] Initial events loaded:', events);
  workflowManager.setEvents(events);

  // Create event list callback function
  const eventListCallback = (selectedEvent) => {
    loadEventToForm(selectedEvent);
    workflowManager.setCurrentEvent(selectedEvent);
    workflowManager.updateButtonStates();
    
    // Update visual selection
    document.querySelectorAll('#eventList li').forEach(li => li.classList.remove('active'));
    const clickedElement = document.querySelector(`#eventList li:nth-child(${events.indexOf(selectedEvent) + 1})`);
    if (clickedElement) clickedElement.classList.add('active');
  };

  renderEventList(events, eventListCallback);

  // Setup event form submission
  document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('[DEBUG] Save button clicked');

    events = await saveEvent(events);
    console.log('[DEBUG] Events after save:', events);
    
    // Update current event with saved data
    const currentId = document.getElementById('id').value;
    const updatedEvent = events.find(e => e.id === currentId);
    workflowManager.setCurrentEvent(updatedEvent);
    workflowManager.setEvents(events);
    workflowManager.updateButtonStates();

    renderEventList(events, eventListCallback);
  });

  // Setup automatic marking of events as updated when form fields change
  function setupFormChangeTracking() {
    const formFields = [
      'title', 'description', 'long_description', 'event_date', 
      'display_from_date', 'tags', 'ticket_url', 'group_id'
    ];
    
    const updateCheckbox = document.getElementById('event_updated_not_submitted');
    
    formFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', () => {
          if (updateCheckbox && !updateCheckbox.checked) {
            updateCheckbox.checked = true;
            console.log('[FORM] Automatically marked event as updated due to field change:', fieldId);
          }
        });
        
        field.addEventListener('change', () => {
          if (updateCheckbox && !updateCheckbox.checked) {
            updateCheckbox.checked = true;
            console.log('[FORM] Automatically marked event as updated due to field change:', fieldId);
          }
        });
      }
    });
  }

  // Initialize form change tracking
  setupFormChangeTracking();

  // Setup delete event
  document.getElementById('deleteEventBtn').addEventListener('click', async () => {
    console.log('[DEBUG] Delete button clicked');

    events = await deleteEvent(events);
    console.log('[DEBUG] Events after delete:', events);
    
    workflowManager.setEvents(events);
    workflowManager.setCurrentEvent(null);
    workflowManager.updateButtonStates();

    renderEventList(events, eventListCallback);
    clearFormWithId('');
  });

  // Setup image upload
  document.getElementById('uploadImageBtn').addEventListener('click', async () => {
    console.log('[DEBUG] Upload image button clicked');

    const input = document.getElementById('id');
    if (!input || !input.value) {
      workflowManager.showValidationMessage('Please select an event first');
      return;
    }

    const eventToken = input.value;
    console.log('[UPLOAD] Using token for image upload:', eventToken);

    await handleImageUpload(eventToken, events);
    
    // Update current event
    const updatedEvent = events.find(e => e.id === eventToken);
    workflowManager.setCurrentEvent(updatedEvent);
    workflowManager.updateButtonStates();
    
    renderEventList(events, eventListCallback);
  });

  // Setup add new event
  document.getElementById('addEventBtn').addEventListener('click', async () => {
    console.log('[DEBUG] Add New Event button clicked');

    const newEvent = await addNewEvent(events);
    console.log('[DEBUG] Generated new event:', newEvent);

    clearFormWithId(newEvent.id);
    workflowManager.setCurrentEvent(newEvent);
    workflowManager.updateButtonStates();
    enableFormInputs();
  });

  // Setup image sync to S3
  document.getElementById('syncImagesBtn').addEventListener('click', async () => {
    console.log('[SYNC] Sync Images button clicked');
    
    lockUIForSync();
    const result = await syncAllImagesToS3(events);
    unlockUIAfterSync();
    
    // Update workflow state and refresh UI
    workflowManager.setEvents(events);
    const currentId = document.getElementById('id').value;
    if (currentId) {
      const updatedEvent = events.find(e => e.id === currentId);
      if (updatedEvent) {
        workflowManager.setCurrentEvent(updatedEvent);
        // Reload the form to show updated values
        loadEventToForm(updatedEvent);
        // Update image preview with new S3 URLs
        updateImagePreview(updatedEvent);
      }
    }
    workflowManager.updateButtonStates();

    renderEventList(events, eventListCallback);
  });

  // Setup server sync
  document.getElementById('syncEventsBtn').addEventListener('click', async () => {
    console.log('[SYNC] Sync Events with Server button clicked');

    lockUIForSync();

    const result = await syncEventsWithServer();
    if (result.success) {
      events = result.updated;
      workflowManager.setEvents(events);
      workflowManager.showValidationMessage(`Sync complete: ${events.length} events retained.`, 'success');
      renderEventList(events, eventListCallback);
    } else {
      workflowManager.showValidationMessage('Sync failed: ' + result.error, 'error');
    }

    unlockUIAfterSync();
  });

  // Setup copy event
  document.getElementById('copyEventBtn').addEventListener('click', async () => {
    console.log('[DEBUG] Copy Event button clicked');

    const currentId = document.getElementById('id').value;
    const currentEvent = events.find(e => e.id === currentId);

    if (!currentEvent) {
      workflowManager.showValidationMessage('No event selected to copy');
      return;
    }

    const { id: newId } = await addNewEvent(events);
    const copiedEvent = {
      ...currentEvent,
      id: newId,
      event_updated_not_submitted: true // Mark copied event as updated
    };

    console.log('[DEBUG] Created copied event:', copiedEvent);

    events.push(copiedEvent);
    await window.api.saveEvents(events);
    workflowManager.setEvents(events);
    workflowManager.setCurrentEvent(copiedEvent);
    workflowManager.updateButtonStates();
    
    renderEventList(events, eventListCallback);
    loadEventToForm(copiedEvent);

    workflowManager.showValidationMessage(`Event copied successfully as "${copiedEvent.title}" with ID ${copiedEvent.id}`, 'success');
  });

  // Setup merge to server
  document.getElementById('mergeButton').addEventListener('click', async () => {
    console.log('[DEBUG] Merge to Server button clicked');

    const token = getAuthToken();
    if (!token) {
      workflowManager.showValidationMessage('Please login first', 'error');
      return;
    }

    lockUIForSync();
    const statusArea = document.getElementById('mergeStatus');
    statusArea.textContent = '🔄 Merging events to server...';

    try {
      const result = await mergeEventsToServer();
      if (result.success) {
        // Mark all events as submitted
        events.forEach(event => {
          if (event.event_updated_not_submitted === true) {
            event.event_updated_not_submitted = false;
          }
        });
        
        // Save the updated events
        await window.api.saveEvents(events);
        
        // Update workflow state
        workflowManager.setEvents(events);
        workflowManager.updateButtonStates();
        
        // If current event is loaded, update the form
        const currentId = document.getElementById('id').value;
        if (currentId) {
          const updatedEvent = events.find(e => e.id === currentId);
          if (updatedEvent) {
            loadEventToForm(updatedEvent);
            workflowManager.setCurrentEvent(updatedEvent);
          }
        }
        
        // Re-render the event list
        renderEventList(events, eventListCallback);
        
        workflowManager.showValidationMessage(`✅ Merge successful! ${result.total} events on server.`, 'success');
      } else {
        workflowManager.showValidationMessage(`❌ Merge failed: ${result.error}`, 'error');
      }
    } catch (error) {
      workflowManager.showValidationMessage(`❌ Unexpected error: ${error.message}`, 'error');
    } finally {
      unlockUIAfterSync();
    }
  });

  // Initial workflow state update
  workflowManager.updateButtonStates();
});
