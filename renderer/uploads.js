export async function handleImageUpload(eventToken, events) {
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
  document.getElementById('thumb_url').value = `./images/${eventToken}-thumb.png`;

  const matchingEvent = events.find(e => e.id === eventToken);
  if (matchingEvent) {
    matchingEvent.full_image_url = `./images/${eventToken}-full.png`;
    matchingEvent.small_image_url = `./images/${eventToken}-small.png`;
    matchingEvent.thumb_url = `./images/${eventToken}-thumb.png`;
    console.log('[UPLOAD] Updated matching event:', matchingEvent);
  } else {
    console.warn('[UPLOAD] No matching event found for token:', eventToken);
  }
}

export async function syncAllImagesToS3(events) {
  const s3Prefix = await window.api.s3.getImagePrefix();
  const failed = [];

  for (const evt of events) {
    const token = evt.id;
    const localPaths = {
      full: `./images/${token}-full.png`,
      small: `./images/${token}-small.png`,
      thumb: `./images/${token}-thumb.png`
    };

for (const [type, localPath] of Object.entries(localPaths)) {
  const s3Key = `${s3Prefix}${token}-${type}.png`;

  try {
    // 🔍 Check that file exists before uploading
    const exists = await window.api.checkFileExists(localPath);
    if (!exists) {
      const msg = `[SKIP] File does not exist: ${localPath}`;
      console.warn(msg);
      failed.push(msg);
      continue;
    }

    // 🚀 Proceed with upload
    const uploadResult = await window.api.s3.uploadToS3(localPath, s3Key);

    if (uploadResult.success) {
      evt[`${type}_image_url`] = uploadResult.url;
      console.log(`[SYNC] Uploaded ${type} image for ${token}: ${uploadResult.url}`);
    } else {
      throw new Error(uploadResult.error || 'Unknown upload error');
    }
  } catch (err) {
    const msg = `[ERROR] Failed to upload ${type} image for ${token}: ${err.message}`;
    console.error(msg);
    failed.push(msg);
  }
}

  }

  try {
    await window.api.saveEvents(events);
    console.log('[SYNC] Updated events.json saved');
  } catch (err) {
    const msg = `[ERROR] Failed to write events.json: ${err.message}`;
    console.error(msg);
    failed.push(msg);
  }

  if (failed.length === 0) {
    alert('✅ Image sync to S3 complete!');
  } else {
    alert(`❌ Image sync completed with ${failed.length} error(s). See log for details.`);
    await logSyncErrors(failed);
  }
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
