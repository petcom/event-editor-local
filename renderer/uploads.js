export async function handleImageUpload(eventToken, events) {
  const { updateImagePreview } = await import('./ui.js');
  const basename = window.api?.basename || ((p) => p.split(/[\\/]/).pop());

  console.log('[UPLOAD] Basename function:', basename);

  console.log('[UPLOAD] Initiating image selection for token:', eventToken);

  const result = await window.api.selectAndProcessImage(eventToken);
  if (!result) {
    console.warn('[UPLOAD] Image selection canceled or failed');
    return;
  }

  console.log('[UPLOAD] Image processing result:', result);

  document.getElementById('full_image_url').value = `./images/${eventToken}-full.png`;
  document.getElementById('small_image_url').value = `./images/${eventToken}-small.png`;
  document.getElementById('thumb_image_url').value = `./images/${eventToken}-thumb.png`;

  // Uncheck the S3 upload checkbox since we now have new local images
  const checkbox = document.getElementById('images_uploaded_to_s3');
  if (checkbox) {
    checkbox.checked = false;
  }

  const matchingEvent = events.find(e => e.id === eventToken);
  if (matchingEvent) {
    matchingEvent.full_image_url = `./images/${eventToken}-full.png`;
    matchingEvent.small_image_url = `./images/${eventToken}-small.png`;
    matchingEvent.thumb_image_url = `./images/${eventToken}-thumb.png`;
    matchingEvent.images_uploaded_to_s3 = false; // Reset since we have new local images
    matchingEvent.event_updated_not_submitted = true; // Mark as updated
    console.log('[UPLOAD] Updated matching event:', matchingEvent);
    
    // Update image preview
    updateImagePreview(matchingEvent);
  } else {
    console.warn('[UPLOAD] No matching event found for token:', eventToken);
  }
}

export async function syncAllImagesToS3(events) {
  const s3Prefix = await window.api.s3.getImagePrefix();
  const failed = [];
  const succeeded = [];
  let totalProcessed = 0;

  for (const evt of events) {
    const token = evt.id;
    
    // Skip events that are already marked as uploaded to S3
    if (evt.images_uploaded_to_s3) {
      console.log(`[SKIP] Event ${token} is already marked as uploaded to S3`);
      continue;
    }
    
    const localPaths = {
      full: evt.full_image_url,
      small: evt.small_image_url,
      thumb: evt.thumb_image_url
    };

    // Skip events that don't have local image paths
    const hasLocalImages = Object.values(localPaths).some(path => 
      path && path.startsWith('./images/'));
    
    if (!hasLocalImages) {
      console.log(`[SKIP] Event ${token} has no local images to sync`);
      continue;
    }

    for (const [type, localPath] of Object.entries(localPaths)) {
      if (!localPath || !localPath.startsWith('./images/')) {
        console.log(`[SKIP] ${type} image for ${token} is not a local path: ${localPath}`);
        continue;
      }

      totalProcessed++;
      const s3Key = `${s3Prefix}${token}-${type}.png`;

      try {
        // Check that file exists before uploading
        const exists = await window.api.checkFileExists(localPath);
        if (!exists) {
          const msg = `File does not exist: ${localPath}`;
          console.warn(`[SKIP] ${msg}`);
          failed.push(msg);
          continue;
        }

        // Proceed with upload
        const uploadResult = await window.api.s3.uploadToS3(localPath, s3Key);

        if (uploadResult.success) {
          evt[`${type}_image_url`] = uploadResult.url;
          succeeded.push(`${type} image for ${token}`);
          console.log(`[SUCCESS] Uploaded ${type} image for ${token}: ${uploadResult.url}`);
        } else {
          throw new Error(uploadResult.error || 'Unknown upload error');
        }
      } catch (err) {
        const msg = `Failed to upload ${type} image for ${token}: ${err.message}`;
        console.error(`[ERROR] ${msg}`);
        failed.push(msg);
      }
    }

    // Mark event as uploaded to S3 if at least one image was processed successfully for this event
    const eventSuccesses = succeeded.filter(s => s.includes(token));
    if (eventSuccesses.length > 0) {
      evt.images_uploaded_to_s3 = true;
      console.log(`[SUCCESS] Marked event ${token} as uploaded to S3 (${eventSuccesses.length} images)`);
    }
  }

  // Save updated events
  if (succeeded.length > 0) {
    try {
      const saveResult = await window.api.saveEvents(events);
      if (saveResult.success) {
        console.log('[SYNC] Updated events.json saved successfully');
      } else {
        console.error('[SYNC] Failed to save events.json:', saveResult.error);
        failed.push(`Failed to save events.json: ${saveResult.error}`);
      }
    } catch (err) {
      const msg = `Failed to save events.json: ${err.message}`;
      console.error(`[ERROR] ${msg}`);
      failed.push(msg);
    }
  }

  // Show appropriate message
  if (totalProcessed === 0) {
    alert('ℹ️ No local images found to sync to S3');
  } else if (failed.length === 0) {
    alert(`✅ Image sync complete! Successfully uploaded ${succeeded.length} image(s) to S3`);
  } else if (succeeded.length > 0) {
    alert(`⚠️ Partial sync: ${succeeded.length} succeeded, ${failed.length} failed. Check console for details.`);
    await logSyncErrors(failed);
  } else {
    alert(`❌ Sync failed: ${failed.length} error(s). Check console for details.`);
    await logSyncErrors(failed);
  }

  return { succeeded: succeeded.length, failed: failed.length, totalProcessed };
}

async function logSyncErrors(errors) {
  const logContent = errors.join('\n') + '\n';
  try {
    await window.api.appendToLogFile('image-sync-errors.log', logContent);
    console.log('[SYNC] Errors logged to image-sync-errors.log');
  } catch (err) {
    console.error('[SYNC] Failed to write error log:', err.message);
  }
}
