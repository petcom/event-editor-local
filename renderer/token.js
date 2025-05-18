export async function generateTokenPrefix() {
  try {
    const prefix = await window.api.generateTokenPrefix();
    console.log('[TOKEN] Generated prefix:', prefix);
    return prefix;
  } catch (err) {
    console.error('[TOKEN] Failed to generate token prefix:', err);
    return 'UNKNOWN-XXXX'; // fallback prefix
  }
}
