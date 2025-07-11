console.log('[WORKFLOW] workflow.js loaded');

/**
 * Manages the workflow state and UI updates
 */
class WorkflowManager {
  constructor() {
    this.currentEvent = null;
    this.authToken = null;
    this.events = [];
    this.steps = {
      step1: { element: null, completed: false },
      step2: { element: null, completed: false },
      step3: { element: null, completed: false },
      step4: { element: null, completed: false },
      step5: { element: null, completed: false }
    };
    this.init();
  }

  init() {
    // Get step elements
    for (const stepId in this.steps) {
      this.steps[stepId].element = document.getElementById(stepId);
    }
    this.updateWorkflowState();
  }

  setAuthToken(token) {
    this.authToken = token;
    this.updateWorkflowState();
  }

  setEvents(events) {
    this.events = events;
    this.updateWorkflowState();
  }

  setCurrentEvent(event) {
    this.currentEvent = event;
    this.updateWorkflowState();
  }

  updateWorkflowState() {
    this.checkStep1();
    this.checkStep2();
    this.checkStep3();
    this.checkStep4();
    this.checkStep5();
  }

  checkStep1() {
    const step = this.steps.step1;
    const status = document.getElementById('step1Status');
    
    if (this.currentEvent && this.currentEvent.id) {
      step.completed = true;
      step.element.classList.add('completed');
      step.element.classList.remove('active');
      status.textContent = `Event selected: ${this.currentEvent.title || this.currentEvent.id}`;
      status.className = 'step-status success';
    } else {
      step.completed = false;
      step.element.classList.remove('completed');
      step.element.classList.add('active');
      status.textContent = 'Select or create an event to begin';
      status.className = 'step-status';
    }
  }

  checkStep2() {
    const step = this.steps.step2;
    const status = document.getElementById('step2Status');
    
    if (this.currentEvent && this.currentEvent.title && this.currentEvent.event_date) {
      step.completed = true;
      step.element.classList.add('completed');
      step.element.classList.remove('active', 'disabled');
      status.textContent = 'Event details saved';
      status.className = 'step-status success';
    } else if (this.currentEvent && this.currentEvent.id) {
      step.completed = false;
      step.element.classList.remove('completed', 'disabled');
      step.element.classList.add('active');
      status.textContent = 'Fill in event details and save';
      status.className = 'step-status';
    } else {
      step.completed = false;
      step.element.classList.remove('completed', 'active');
      step.element.classList.add('disabled');
      status.textContent = 'Complete step 1 first';
      status.className = 'step-status';
    }
  }

  checkStep3() {
    const step = this.steps.step3;
    const status = document.getElementById('step3Status');
    
    if (this.currentEvent && this.hasLocalImages()) {
      step.completed = true;
      step.element.classList.add('completed');
      step.element.classList.remove('active', 'disabled');
      status.textContent = 'Local images added';
      status.className = 'step-status success';
    } else if (this.steps.step2.completed) {
      step.completed = false;
      step.element.classList.remove('completed', 'disabled');
      step.element.classList.add('active');
      status.textContent = 'Add images to your event';
      status.className = 'step-status';
    } else {
      step.completed = false;
      step.element.classList.remove('completed', 'active');
      step.element.classList.add('disabled');
      status.textContent = 'Complete step 2 first';
      status.className = 'step-status';
    }
  }

  checkStep4() {
    const step = this.steps.step4;
    const status = document.getElementById('step4Status');
    
    if (this.currentEvent && this.currentEvent.images_uploaded_to_s3) {
      step.completed = true;
      step.element.classList.add('completed');
      step.element.classList.remove('active', 'disabled');
      status.textContent = 'Images uploaded to S3';
      status.className = 'step-status success';
    } else if (this.steps.step3.completed) {
      step.completed = false;
      step.element.classList.remove('completed', 'disabled');
      step.element.classList.add('active');
      status.textContent = 'Upload local images to cloud storage';
      status.className = 'step-status';
    } else {
      step.completed = false;
      step.element.classList.remove('completed', 'active');
      step.element.classList.add('disabled');
      status.textContent = 'Complete step 3 first';
      status.className = 'step-status';
    }
  }

  checkStep5() {
    const step = this.steps.step5;
    const status = document.getElementById('step5Status');
    
    if (this.authToken) {
      if (this.steps.step4.completed) {
        step.completed = false;
        step.element.classList.remove('completed', 'disabled');
        step.element.classList.add('active');
        status.textContent = 'Ready to sync with server';
        status.className = 'step-status';
      } else {
        step.completed = false;
        step.element.classList.remove('completed', 'active');
        step.element.classList.add('disabled');
        status.textContent = 'Complete step 4 first';
        status.className = 'step-status';
      }
    } else {
      step.completed = false;
      step.element.classList.remove('completed', 'active');
      step.element.classList.add('disabled');
      status.textContent = 'Login required for server sync';
      status.className = 'step-status warning';
    }
  }

  hasLocalImages() {
    if (!this.currentEvent) return false;
    
    const localPaths = [
      this.currentEvent.full_image_url,
      this.currentEvent.small_image_url,
      this.currentEvent.thumb_image_url
    ];
    
    return localPaths.some(path => path && path.startsWith('./images/'));
  }

  hasS3Images() {
    if (!this.currentEvent) return false;
    
    const s3Paths = [
      this.currentEvent.full_image_url,
      this.currentEvent.small_image_url,
      this.currentEvent.thumb_image_url
    ];
    
    return s3Paths.some(path => path && path.startsWith('https://'));
  }

  canMergeToServer() {
    // Don't allow merge if not authenticated
    if (!this.authToken) {
      return false;
    }
    
    // Only allow merge if there are events that need to be submitted
    const eventsToSubmit = this.events.filter(event => event.event_updated_not_submitted === true);
    
    if (eventsToSubmit.length === 0) {
      return false; // No events to submit
    }
    
    // For events that need to be submitted, check if they have images but images_uploaded_to_s3 is false
    return eventsToSubmit.every(event => {
      const hasImages = event.full_image_url || event.small_image_url || event.thumb_image_url;
      
      if (!hasImages) {
        // No images = always OK to merge
        return true;
      }
      
      // If event has images, they must be marked as uploaded to S3
      return event.images_uploaded_to_s3 === true;
    });
  }

  updateButtonStates() {
    // Step 1 buttons
    document.getElementById('addEventBtn').disabled = false;
    document.getElementById('copyEventBtn').disabled = !this.currentEvent;
    document.getElementById('deleteEventBtn').disabled = !this.currentEvent;

    // Step 2 buttons
    const saveBtn = document.querySelector('button[type="submit"]');
    if (saveBtn) {
      saveBtn.disabled = !this.currentEvent || !this.currentEvent.id;
    }

    // Step 3 buttons
    document.getElementById('uploadImageBtn').disabled = !this.steps.step2.completed;

    // Step 4 buttons
    document.getElementById('syncImagesBtn').disabled = !this.steps.step3.completed;

    // Step 5 buttons
    const mergeBtn = document.getElementById('mergeButton');
    const syncBtn = document.getElementById('syncEventsBtn');
    
    if (mergeBtn) {
      const canMerge = this.canMergeToServer();
      const eventsToSubmit = this.events.filter(event => event.event_updated_not_submitted === true);
      
      mergeBtn.disabled = !canMerge;
      
      if (!this.authToken) {
        mergeBtn.title = 'Please login to push events to server';
      } else if (eventsToSubmit.length === 0) {
        mergeBtn.title = 'No events need to be submitted';
      } else if (!canMerge) {
        mergeBtn.title = 'Cannot merge: some events with "Event Updated (Not Submitted)" checked have images that are not uploaded to S3. Check the "Images Uploaded to S3" checkbox for events with images.';
      } else {
        mergeBtn.title = `Push ${eventsToSubmit.length} updated event(s) to server`;
      }
    }
    
    if (syncBtn) {
      syncBtn.disabled = !this.authToken;
    }
  }

  showValidationMessage(message, type = 'error') {
    const statusArea = document.getElementById('mergeStatus');
    if (statusArea) {
      statusArea.textContent = message;
      statusArea.className = `status-area ${type}`;
      setTimeout(() => {
        statusArea.textContent = '';
        statusArea.className = 'status-area';
      }, 5000);
    }
  }
}

// Create global instance
export const workflowManager = new WorkflowManager();
