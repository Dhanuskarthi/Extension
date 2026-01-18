/**
 * QORVA - Background Service Worker Entry
 */

import { configManager } from './config-manager';
import { setupMessageHandler } from './message-handler';
import { cacheManager } from './cache-manager';

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[QORVA] Extension installed:', details.reason);
  
  // Initialize config
  await configManager.init();
  
  // Initialize cache
  await cacheManager.init();
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('[QORVA] Extension started');
  
  // Initialize config
  await configManager.init();
  
  // Initialize cache
  await cacheManager.init();
});

// Setup message handler
setupMessageHandler();

// Handle commands (push-to-talk)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'push-to-talk') {
    // Send message to active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'PUSH_TO_TALK' });
      }
    });
  }
});

// Handle offscreen document for audio capture
async function setupOffscreen(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  
  if (existingContexts.length === 0) {
    try {
      await chrome.offscreen.createDocument({
        url: 'src/offscreen/index.html',
        reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
        justification: 'Audio capture for real-time QA',
      });
    } catch (error) {
      console.error('[QORVA] Failed to create offscreen document:', error);
    }
  }
}

// Export for use by other modules
export { setupOffscreen };

console.log('[QORVA] Background service worker loaded');
