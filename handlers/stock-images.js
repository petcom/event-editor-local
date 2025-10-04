const { ipcMain } = require('electron');
const fs = require('fs').promises;
const path = require('path');

module.exports = function registerStockImagesHandlers() {
  console.log('[HANDLERS] Registering stock images handlers...');

  /**
   * Load stock images manifest
   */
  ipcMain.handle('load-stock-images-manifest', async () => {
    try {
      const manifestPath = path.join(__dirname, '..', 'stock-images-manifest.json');
      console.log('[STOCK-IMAGES-HANDLER] Loading manifest from:', manifestPath);
      
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      console.log(`[STOCK-IMAGES-HANDLER] Loaded ${manifest.images.length} images from manifest`);
      return manifest;
    } catch (error) {
      console.error('[STOCK-IMAGES-HANDLER] Error loading manifest:', error);
      throw error;
    }
  });

  console.log('[HANDLERS] Stock images handlers registered successfully');
};
