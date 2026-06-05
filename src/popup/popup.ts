/**
 * QORVA - Popup Script
 */

import { MSG_TYPES } from '../shared/constants';

// DOM Elements
const elements = {
  llmStatus: document.getElementById('llm-status') as HTMLSpanElement,
  providerName: document.getElementById('provider-name') as HTMLSpanElement,
  quizToggle: document.getElementById('quiz-toggle') as HTMLInputElement,
  quizStatus: document.getElementById('quiz-status') as HTMLSpanElement,
  audioToggle: document.getElementById('audio-toggle') as HTMLInputElement,
  audioStatus: document.getElementById('audio-status') as HTMLSpanElement,
  questionsAnswered: document.getElementById('questions-answered') as HTMLSpanElement,
  audioQaCount: document.getElementById('audio-qa-count') as HTMLSpanElement,
  cacheSize: document.getElementById('cache-size') as HTMLSpanElement,
  rescanBtn: document.getElementById('rescan-btn') as HTMLButtonElement,
  optionsBtn: document.getElementById('options-btn') as HTMLButtonElement,
  settingsBtn: document.getElementById('settings-btn') as HTMLButtonElement,
};

/**
 * Initialize popup
 */
async function init(): Promise<void> {
  await loadStatus();
  setupEventListeners();
}

/**
 * Load current status
 */
async function loadStatus(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: MSG_TYPES.STATUS_GET });
    
    if (response?.ok && response.data) {
      const { provider, hasApiKey, quizAuto, audioEnabled } = response.data;
      
      // LLM Status
      elements.llmStatus.textContent = hasApiKey ? '🟢' : '🔴';
      elements.providerName.textContent = hasApiKey 
        ? `${provider.charAt(0).toUpperCase() + provider.slice(1)} (Ready)`
        : 'Not configured';
      
      // Quiz toggle
      elements.quizToggle.checked = quizAuto;
      elements.quizStatus.textContent = quizAuto ? 'ON' : 'OFF';
      elements.quizStatus.className = `toggle-status ${quizAuto ? 'on' : ''}`;
      
      // Audio toggle
      elements.audioToggle.checked = audioEnabled;
      elements.audioStatus.textContent = audioEnabled ? 'ON' : 'OFF';
      elements.audioStatus.className = `toggle-status ${audioEnabled ? 'on' : ''}`;
    }
    
    // Load cache stats
    const cacheData = await chrome.storage.local.get('qorva_cache');
    const cacheEntries = Object.keys(cacheData.qorva_cache || {}).length;
    elements.cacheSize.textContent = cacheEntries.toString();
  } catch (error) {
    console.error('Failed to load status:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  // Quiz toggle
  elements.quizToggle.addEventListener('change', async () => {
    const enabled = elements.quizToggle.checked;
    elements.quizStatus.textContent = enabled ? 'ON' : 'OFF';
    elements.quizStatus.className = `toggle-status ${enabled ? 'on' : ''}`;
    
    // Send to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_QUIZ' }).catch(() => {});
    }
    
    // Update config
    const response = await chrome.runtime.sendMessage({ type: MSG_TYPES.CFG_GET });
    if (response?.ok) {
      await chrome.runtime.sendMessage({
        type: MSG_TYPES.CFG_SET,
        payload: { ...response.data, quiz: { ...response.data.quiz, auto: enabled } },
      });
    }
  });
  
  // Audio toggle
  elements.audioToggle.addEventListener('change', async () => {
    const enabled = elements.audioToggle.checked;
    elements.audioStatus.textContent = enabled ? 'ON' : 'OFF';
    elements.audioStatus.className = `toggle-status ${enabled ? 'on' : ''}`;
    
    // Send to content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_AUDIO' }).catch(() => {});
    }
    
    // Update config
    const response = await chrome.runtime.sendMessage({ type: MSG_TYPES.CFG_GET });
    if (response?.ok) {
      await chrome.runtime.sendMessage({
        type: MSG_TYPES.CFG_SET,
        payload: { ...response.data, audio: { ...response.data.audio, enabled } },
      });
    }
  });
  
  // Rescan button
  elements.rescanBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'RESCAN' }).catch(() => {});
    }
    window.close();
  });
  
  // Options button
  elements.optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Settings button
  elements.settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
