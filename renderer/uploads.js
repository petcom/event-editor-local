export async function handleImageUpload(events) {
  const basename = window.api?.path?.basename || ((p) => {
    console.warn('[UPLOAD] window.api.path.basename not available — using fallback');
    return p.split(/[\\/]/).pop();
  });

  const id = document.getElementById('id').value || 'untagged';
  console.log('[UPLOAD] Initiating image selection for event ID:', id);

  const result = await window.api.selectAndProcessImage(id);

  if (!result) {
    console.warn('[UPLOAD] Image selection canceled or failed');
    return;
  }

  console.log('[UPLOAD] Image processing result:', result);

  // Populate form with local image paths
  document.getElementById('full_image_url').value = result.full;
  document.getElementById('small_image_url').value = result.small;
  document.getElementById('thumb_url').value = result.thumb;

  // S3 upload targets
  const files = [
    { local: result.full, remote: `images/full/${basename(result.full)}` },
    { local: result.small, remote: `images/small/${basename(result.small)}` },
    { local: result.thumb, remote: `images/thumb/${basename(result.thumb)}` }
  ];

  for (const f of files) {
    console.log(`[UPLOAD] Uploading ${f.local} to ${f.remote}...`);

    const uploadResult = await window.api.uploadToS3(f.local, f.remote);

    if (uploadResult.success) {
      console.log('[UPLOAD] S3 URL:', uploadResult.url);
    } else {
      console.error('[UPLOAD] Failed to upload', f.local, '→', f.remote, '::', uploadResult.error);
    }
  }
}
