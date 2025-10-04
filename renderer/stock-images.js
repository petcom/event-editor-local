console.log('[STOCK-IMAGES] stock-images.js loaded');
console.log('[STOCK-IMAGES] Module initialization starting...');

const S3_BASE_URL = 'https://sonar-media.sfo3.cdn.digitaloceanspaces.com/images/';

/**
 * Load stock images manifest from JSON file
 * @returns {Promise<Array>} Array of stock image definitions
 */
async function loadStockImagesManifest() {
  try {
    console.log('[STOCK-IMAGES] Loading manifest file...');
    const manifest = await window.api.loadStockImagesManifest();
    
    console.log(`[STOCK-IMAGES] Manifest loaded: ${manifest.images.length} images defined`);
    console.log(`[STOCK-IMAGES] Base URL from manifest: ${manifest.baseUrl}`);
    
    return manifest.images;
  } catch (error) {
    console.error('[STOCK-IMAGES] Error loading manifest:', error);
    throw error;
  }
}

/**
 * Fetch list of stock images from manifest
 * @returns {Promise<Array>} Array of valid image objects
 */
async function fetchStockImagesList() {
  try {
    console.log('[STOCK-IMAGES] Fetching stock images from manifest...');
    
    // Load manifest file
    const manifestImages = await loadStockImagesManifest();
    
    // Test if images exist by trying to load them (test the -thumb variant)
    const validImages = [];
    const testPromises = manifestImages.map(async (imageData) => {
      try {
        // Test the -thumb variant since all stock images have size suffixes
        const imageUrl = `${S3_BASE_URL}${imageData.id}-thumb.${imageData.format}`;
        const exists = await testImageExists(imageUrl);
        if (exists) {
          validImages.push(imageData);
          console.log(`[STOCK-IMAGES] ✓ Found: ${imageData.id}`);
        } else {
          console.log(`[STOCK-IMAGES] ✗ Missing: ${imageData.id}`);
        }
      } catch (error) {
        console.log(`[STOCK-IMAGES] ✗ Error testing ${imageData.id}:`, error.message);
      }
    });
    
    // Wait for all tests to complete
    await Promise.all(testPromises);
    
    console.log(`[STOCK-IMAGES] Found ${validImages.length} valid stock images out of ${manifestImages.length} in manifest`);
    
    // Sort by name
    return validImages.sort((a, b) => a.name.localeCompare(b.name));
    
  } catch (error) {
    console.error('[STOCK-IMAGES] Error fetching stock images:', error);
    throw error;
  }
}

/**
 * Test if an image URL exists and can be loaded
 * @param {string} url - Image URL to test
 * @returns {Promise<boolean>} True if image exists
 */
function testImageExists(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const img = new Image();
    
    // Enable CORS for cross-origin images
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const loadTime = Date.now() - startTime;
      console.log(`[STOCK-IMAGES] ✓ Image loaded successfully (${loadTime}ms): ${url}`);
      resolve(true);
    };
    
    img.onerror = (error) => {
      console.log(`[STOCK-IMAGES] ✗ Image failed to load: ${url}`);
      console.log(`[STOCK-IMAGES]   Error type: ${error.type || 'Unknown'}`);
      resolve(false);
    };
    
    console.log(`[STOCK-IMAGES] Testing URL: ${url}`);
    img.src = url;
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.log(`[STOCK-IMAGES] ⏱️ Timeout (5s) testing: ${url}`);
      resolve(false);
    }, 5000);
  });
}

/**
 * Generate URLs for the stock image
 * Stock images on CDN have size variants: -full, -small, -thumb
 * @param {Object} imageData - Image data from manifest
 * @returns {Object} URLs for full, small, and thumb versions
 */
function generateImageUrls(imageData) {
  const baseUrl = `${S3_BASE_URL}${imageData.id}`;
  
  return {
    full: `${baseUrl}-full.${imageData.format}`,
    small: `${baseUrl}-small.${imageData.format}`,
    thumb: `${baseUrl}-thumb.${imageData.format}`
  };
}

/**
 * Copy all image URLs to the current event form
 * @param {Object} imageData - Image data from manifest (can be string for backward compatibility)
 */
function copyAllImageUrls(imageData) {
  // Handle both old string format and new object format
  const imageObj = typeof imageData === 'string' 
    ? { id: imageData, format: 'jpg' } 
    : imageData;
    
  console.log('[STOCK-IMAGES] Copying all URLs for:', imageObj.id);
  
  // Check if an event is currently selected
  const currentEventId = document.getElementById('id')?.value;
  if (!currentEventId) {
    showStockImageMessage('⚠️ Please select an event first', 'warning');
    return;
  }
  
  const urls = generateImageUrls(imageObj);
  
  // Populate form fields
  const fullImageField = document.getElementById('full_image_url');
  const smallImageField = document.getElementById('small_image_url');
  const thumbImageField = document.getElementById('thumb_image_url');
  
  if (fullImageField) fullImageField.value = urls.full;
  if (smallImageField) smallImageField.value = urls.small;
  if (thumbImageField) thumbImageField.value = urls.thumb;
  
  // Mark event as updated
  const updateCheckbox = document.getElementById('event_updated_not_submitted');
  if (updateCheckbox && !updateCheckbox.checked) {
    updateCheckbox.checked = true;
    console.log('[STOCK-IMAGES] Automatically marked event as updated');
  }
  
  // Show success message
  const displayName = imageObj.name || imageObj.id.replace('zzz-', '').replace(/-/g, ' ');
  showStockImageMessage(`✅ Applied stock image: ${displayName}`, 'success');
  
  console.log('[STOCK-IMAGES] URLs copied:', urls);
}

/**
 * Show a temporary message in the stock images section
 * @param {string} message - Message to show
 * @param {string} type - Message type: 'success', 'warning', 'error'
 */
function showStockImageMessage(message, type = 'info') {
  // Create or update message element
  let messageEl = document.querySelector('.stock-image-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.className = 'stock-image-message';
    const stockSection = document.querySelector('.stock-images-section');
    if (stockSection) {
      stockSection.appendChild(messageEl);
    }
  }
  
  messageEl.textContent = message;
  messageEl.className = `stock-image-message ${type}`;
  messageEl.style.cssText = `
    padding: 0.5rem 1rem;
    margin-top: 0.5rem;
    border-radius: 4px;
    text-align: center;
    font-size: 0.9rem;
    background: ${type === 'success' ? '#c6f6d5' : type === 'warning' ? '#fef5e7' : '#fed7d7'};
    color: ${type === 'success' ? '#22543d' : type === 'warning' ? '#744210' : '#742a2a'};
    border: 1px solid ${type === 'success' ? '#9ae6b4' : type === 'warning' ? '#f6e05e' : '#fc8181'};
  `;
  
  // Remove message after 3 seconds
  setTimeout(() => {
    if (messageEl && messageEl.parentNode) {
      messageEl.parentNode.removeChild(messageEl);
    }
  }, 3000);
}

/**
 * Render the stock images list
 * @param {Array} imageDataArray - Array of image data objects from manifest
 */
function renderStockImages(imageDataArray) {
  const container = document.getElementById('stockImagesList');
  if (!container) return;
  
  if (imageDataArray.length === 0) {
    container.innerHTML = '<div class="error-message">No stock images found</div>';
    return;
  }
  
  container.innerHTML = imageDataArray.map(imageData => {
    const displayName = imageData.name;
    // Use the -thumb variant for display in the list
    const imageUrl = `${S3_BASE_URL}${imageData.id}-thumb.${imageData.format}`;
    // Pass the entire imageData object as JSON string
    const imageDataJson = JSON.stringify(imageData).replace(/"/g, '&quot;');
    
    return `
      <div class="stock-image-item">
        <img src="${imageUrl}" alt="${displayName}" loading="lazy" />
        <div class="stock-image-name">${displayName}</div>
        <button class="copy-all-btn" onclick='window.stockImages.copyAllImageUrls(${imageDataJson})'>
          📋 Copy All
        </button>
      </div>
    `;
  }).join('');
  
  console.log(`[STOCK-IMAGES] Rendered ${imageDataArray.length} stock images in vertical list`);
}

/**
 * Initialize stock images functionality
 */
export async function initializeStockImages() {
  console.log('[STOCK-IMAGES] Initializing stock images...');
  
  try {
    const imageDataArray = await fetchStockImagesList();
    
    if (imageDataArray.length > 0) {
      renderStockImages(imageDataArray);
    } else {
      // Show demo/placeholder images for testing if no real stock images found
      console.log('[STOCK-IMAGES] No real stock images found, showing demo placeholders');
      const demoImages = [
        { id: 'zzz-demo-sunset', name: 'Demo Sunset', category: 'demo', format: 'jpg' },
        { id: 'zzz-demo-ocean', name: 'Demo Ocean', category: 'demo', format: 'jpg' },
        { id: 'zzz-demo-mountain', name: 'Demo Mountain', category: 'demo', format: 'jpg' }
      ];
      renderDemoStockImages(demoImages);
    }
  } catch (error) {
    console.error('[STOCK-IMAGES] Failed to initialize:', error);
    const container = document.getElementById('stockImagesList');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          Failed to load stock images<br>
          <small>${error.message}</small>
        </div>
      `;
    }
  }
}

/**
 * Render demo stock images for testing when real images aren't available
 * @param {Array} demoData - Array of demo image data
 */
function renderDemoStockImages(demoData) {
  const container = document.getElementById('stockImagesList');
  if (!container) return;
  
  container.innerHTML = demoData.map(imageData => {
    const displayName = imageData.name;
    // Use a placeholder image service for demo
    const placeholderUrl = `https://via.placeholder.com/50x50/667eea/ffffff?text=${displayName.charAt(0)}`;
    const imageDataJson = JSON.stringify(imageData).replace(/"/g, '&quot;');
    
    return `
      <div class="stock-image-item">
        <img src="${placeholderUrl}" alt="${displayName}" loading="lazy" />
        <div class="stock-image-name">${displayName} (Demo)</div>
        <button class="copy-all-btn" onclick='window.stockImages.copyAllImageUrls(${imageDataJson})'>
          📋 Copy All
        </button>
      </div>
    `;
  }).join('');
  
  console.log(`[STOCK-IMAGES] Rendered ${demoData.length} demo stock images in vertical list`);
}

// Export functions for global access
export { copyAllImageUrls, showStockImageMessage };

// Make functions available globally for onclick handlers
window.stockImages = {
  copyAllImageUrls,
  showStockImageMessage
};
