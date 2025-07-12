console.log('[STOCK-IMAGES] stock-images.js loaded');
console.log('[STOCK-IMAGES] Module initialization starting...');

const S3_BASE_URL = 'https://sonar-media.sfo3.digitaloceanspaces.com/images/';

/**
 * Fetch list of stock images from S3 CDN
 * @returns {Promise<string[]>} Array of image URLs
 */
async function fetchStockImagesList() {
  try {
    console.log('[STOCK-IMAGES] Fetching stock images from S3...');
    
    // Comprehensive list of potential stock images
    // This list can be expanded as more stock images are added to S3
    const stockImageBasenames = [
      'zzz-default-sunset',
      'zzz-default-ocean', 
      'zzz-default-mountain',
      'zzz-default-forest',
      'zzz-default-city',
      'zzz-default-abstract',
      'zzz-default-technology',
      'zzz-default-nature',
      'zzz-default-business',
      'zzz-default-event',
      'zzz-default-conference',
      'zzz-default-workshop',
      'zzz-default-seminar',
      'zzz-default-meeting',
      'zzz-default-celebration',
      'zzz-default-education',
      'zzz-default-training',
      'zzz-default-webinar'
    ];
    
    // Test if images exist by trying to load them
    const validImages = [];
    const testPromises = stockImageBasenames.map(async (basename) => {
      try {
        const thumbUrl = `${S3_BASE_URL}${basename}-thumb.png`;
        const exists = await testImageExists(thumbUrl);
        if (exists) {
          validImages.push(basename);
          console.log(`[STOCK-IMAGES] ✓ Found: ${basename}`);
        } else {
          console.log(`[STOCK-IMAGES] ✗ Missing: ${basename}`);
        }
      } catch (error) {
        console.log(`[STOCK-IMAGES] ✗ Error testing ${basename}:`, error.message);
      }
    });
    
    // Wait for all tests to complete
    await Promise.all(testPromises);
    
    console.log(`[STOCK-IMAGES] Found ${validImages.length} valid stock images out of ${stockImageBasenames.length} tested`);
    return validImages.sort(); // Sort alphabetically
    
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
    const img = new Image();
    img.onload = () => {
      console.log(`[STOCK-IMAGES] ✓ Image found: ${url}`);
      resolve(true);
    };
    img.onerror = () => {
      console.log(`[STOCK-IMAGES] ✗ Image not found: ${url}`);
      resolve(false);
    };
    img.src = url;
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.log(`[STOCK-IMAGES] ⏱️ Timeout testing: ${url}`);
      resolve(false);
    }, 5000);
  });
}

/**
 * Generate URLs for all three image sizes
 * @param {string} basename - Base image name (e.g., 'zzz-default-sunset')
 * @returns {Object} URLs for full, small, and thumb versions
 */
function generateImageUrls(basename) {
  return {
    full: `${S3_BASE_URL}${basename}-full.png`,
    small: `${S3_BASE_URL}${basename}-small.png`,
    thumb: `${S3_BASE_URL}${basename}-thumb.png`
  };
}

/**
 * Copy all image URLs to the current event form
 * @param {string} basename - Base image name
 */
function copyAllImageUrls(basename) {
  console.log('[STOCK-IMAGES] Copying all URLs for:', basename);
  
  // Check if an event is currently selected
  const currentEventId = document.getElementById('id')?.value;
  if (!currentEventId) {
    showStockImageMessage('⚠️ Please select an event first', 'warning');
    return;
  }
  
  const urls = generateImageUrls(basename);
  
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
  showStockImageMessage(`✅ Applied stock images: ${basename.replace('zzz-default-', '')}`, 'success');
  
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
 * @param {string[]} imageBasenames - Array of image base names
 */
function renderStockImages(imageBasenames) {
  const container = document.getElementById('stockImagesList');
  if (!container) return;
  
  if (imageBasenames.length === 0) {
    container.innerHTML = '<div class="error-message">No stock images found</div>';
    return;
  }
  
  container.innerHTML = imageBasenames.map(basename => {
    const displayName = basename.replace('zzz-default-', '').replace(/-/g, ' ');
    const thumbUrl = generateImageUrls(basename).thumb;
    
    return `
      <div class="stock-image-item">
        <img src="${thumbUrl}" alt="${displayName}" loading="lazy" />
        <div class="stock-image-name">${displayName}</div>
        <button class="copy-all-btn" onclick="window.stockImages.copyAllImageUrls('${basename}')">
          📋 Copy All
        </button>
      </div>
    `;
  }).join('');
  
  console.log(`[STOCK-IMAGES] Rendered ${imageBasenames.length} stock images in vertical list`);
}

/**
 * Initialize stock images functionality
 */
export async function initializeStockImages() {
  console.log('[STOCK-IMAGES] Initializing stock images...');
  
  try {
    const imageBasenames = await fetchStockImagesList();
    
    if (imageBasenames.length > 0) {
      renderStockImages(imageBasenames);
    } else {
      // Show demo/placeholder images for testing if no real stock images found
      console.log('[STOCK-IMAGES] No real stock images found, showing demo placeholders');
      const demoImages = [
        'zzz-default-demo-sunset',
        'zzz-default-demo-ocean',
        'zzz-default-demo-mountain'
      ];
      renderDemoStockImages(demoImages);
    }
  } catch (error) {
    console.error('[STOCK-IMAGES] Failed to initialize:', error);
    const container = document.getElementById('stockImagesList');
    if (container) {
      container.innerHTML = '<div class="error-message">Failed to load stock images</div>';
    }
  }
}

/**
 * Render demo stock images for testing when real images aren't available
 * @param {string[]} demoNames - Array of demo image names
 */
function renderDemoStockImages(demoNames) {
  const container = document.getElementById('stockImagesList');
  if (!container) return;
  
  container.innerHTML = demoNames.map(basename => {
    const displayName = basename.replace('zzz-default-demo-', '').replace(/-/g, ' ');
    // Use a placeholder image service for demo
    const placeholderUrl = `https://via.placeholder.com/50x50/667eea/ffffff?text=${displayName.charAt(0)}`;
    
    return `
      <div class="stock-image-item">
        <img src="${placeholderUrl}" alt="${displayName}" loading="lazy" />
        <div class="stock-image-name">${displayName} (Demo)</div>
        <button class="copy-all-btn" onclick="window.stockImages.copyAllImageUrls('${basename}')">
          📋 Copy All
        </button>
      </div>
    `;
  }).join('');
  
  console.log(`[STOCK-IMAGES] Rendered ${demoNames.length} demo stock images in vertical list`);
}

// Export functions for global access
export { copyAllImageUrls, showStockImageMessage };

// Make functions available globally for onclick handlers
window.stockImages = {
  copyAllImageUrls,
  showStockImageMessage
};
