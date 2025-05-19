export async function handleImageUpload(eventToken, events) {
  const basename = window.api?.path?.basename || ((p) => {
    console.warn('[UPLOAD] window.api.path.basename not available — using fallback');
    return p.split(/[\\/]/).pop();
  });

  console.log('[UPLOAD] Initiating image selection for token:', eventToken);

  const result = await window.api.selectAndProcessImage(eventToken);
  if (!result) {
    console.warn('[UPLOAD] Image selection canceled or failed');
    return;
  }

  console.log('[UPLOAD] Image processing result:', result);

  // Update form fields with local paths
  document.getElementById('full_image_url').value = `./images/${eventToken}-full.png`;
  document.getElementById('small_image_url').value = `./images/${eventToken}-small.png`;
  document.getElementById('thumb_url').value = `./images/${eventToken}-thumb.png`;

  // Update the matching event in memory
  const matchingEvent = events.find(e => e.id === eventToken);
  if (matchingEvent) {
    matchingEvent.full_image_url = `./images/${eventToken}-full.png`;
    matchingEvent.small_image_url = `./images/${eventToken}-small.png`;
    matchingEvent.thumb_url = `./images/${eventToken}-thumb.png`;
    console.log('[UPLOAD] Updated matching event:', matchingEvent);
  } else {
    console.warn('[UPLOAD] No matching event found for token:', eventToken);
  }

  // Upload to S3 with prefix from .env
  const s3Prefix = window.api.s3?.imagePrefix || 'images/';
  const files = [
    { local: result.full, remote: `${s3Prefix}${eventToken}-full.png` },
    { local: result.small, remote: `${s3Prefix}${eventToken}-small.png` },
    { local: result.thumb, remote: `${s3Prefix}${eventToken}-thumb.png` }
  ];

  for (const f of files) {
    console.log(`[UPLOAD] Uploading ${f.local} to ${f.remote}...`);

    const uploadResult = await window.api.s3.uploadToS3(f.local, f.remote);

    if (uploadResult.success) {
      console.log('[UPLOAD] S3 URL:', uploadResult.url);
    } else {
      console.error('[UPLOAD] Failed to upload', f.local, '→', f.remote, '::', uploadResult.error);
    }
  }
}
