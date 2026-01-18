/**
 * QORVA - Options Page Script with Theme Support
 */

import type { Config, LLMProvider } from '../shared/types';
import { MSG_TYPES, DEFAULT_CONFIG } from '../shared/constants';

// Theme storage key
const THEME_KEY = 'qorva_theme';

// DOM Elements
const $ = (id: string) => document.getElementById(id);

const elements = {
  // Provider
  provider: $('provider') as HTMLSelectElement,
  geminiSettings: $('gemini-settings') as HTMLDivElement,
  openaiSettings: $('openai-settings') as HTMLDivElement,
  claudeSettings: $('claude-settings') as HTMLDivElement,
  geminiKey: $('gemini-key') as HTMLInputElement,
  geminiModel: $('gemini-model') as HTMLSelectElement,
  openaiKey: $('openai-key') as HTMLInputElement,
  openaiModel: $('openai-model') as HTMLSelectElement,
  claudeKey: $('claude-key') as HTMLInputElement,
  claudeModel: $('claude-model') as HTMLSelectElement,
  
  // Quiz
  quizAuto: $('quiz-auto') as HTMLInputElement,
  quizSubmit: $('quiz-submit') as HTMLInputElement,
  delayMin: $('delay-min') as HTMLInputElement,
  delayMax: $('delay-max') as HTMLInputElement,
  
  // Audio
  audioEnabled: $('audio-enabled') as HTMLInputElement,
  audioTts: $('audio-tts') as HTMLInputElement,
  audioCopy: $('audio-copy') as HTMLInputElement,
  
  // Cache
  cacheEnabled: $('cache-enabled') as HTMLInputElement,
  cacheTtl: $('cache-ttl') as HTMLInputElement,
  clearCache: $('clear-cache') as HTMLButtonElement,
  
  // Blacklist
  blacklist: $('blacklist') as HTMLTextAreaElement,
  
  // Actions
  save: $('save') as HTMLButtonElement,
  reset: $('reset') as HTMLButtonElement,
  status: $('status') as HTMLDivElement,
};

let currentConfig: Config = { ...DEFAULT_CONFIG };

/**
 * Initialize options page
 */
async function init(): Promise<void> {
  initTheme();
  await loadConfig();
  setupEventListeners();
  populateForm();
}

/**
 * Initialize theme
 */
function initTheme(): void {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
  
  // Theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    const theme = (btn as HTMLElement).dataset.theme;
    if (theme === saved) btn.classList.add('active');
    
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyTheme(theme || 'dark');
      localStorage.setItem(THEME_KEY, theme || 'dark');
    });
  });
}

/**
 * Apply theme
 */
function applyTheme(theme: string): void {
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

/**
 * Load configuration from background
 */
async function loadConfig(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: MSG_TYPES.CFG_GET });
    if (response?.ok && response.data) {
      currentConfig = response.data;
    }
  } catch (error) {
    console.error('Failed to load config:', error);
    showStatus('Failed to load configuration', 'error');
  }
}

/**
 * Populate form with current config
 */
function populateForm(): void {
  // Provider
  elements.provider.value = currentConfig.llm.provider;
  showProviderSettings(currentConfig.llm.provider);
  
  // Gemini
  elements.geminiKey.value = currentConfig.llm.gemini.apiKey;
  elements.geminiModel.value = currentConfig.llm.gemini.model;
  
  // OpenAI
  elements.openaiKey.value = currentConfig.llm.openai.apiKey;
  elements.openaiModel.value = currentConfig.llm.openai.model;
  
  // Claude
  elements.claudeKey.value = currentConfig.llm.claude.apiKey;
  elements.claudeModel.value = currentConfig.llm.claude.model;
  
  // Quiz
  elements.quizAuto.checked = currentConfig.quiz.auto;
  elements.quizSubmit.checked = currentConfig.quiz.autoSubmit;
  elements.delayMin.value = currentConfig.quiz.delayMin.toString();
  elements.delayMax.value = currentConfig.quiz.delayMax.toString();
  
  // Audio
  elements.audioEnabled.checked = currentConfig.audio.enabled;
  elements.audioTts.checked = currentConfig.audio.tts;
  elements.audioCopy.checked = currentConfig.audio.autoCopy;
  
  // Cache
  elements.cacheEnabled.checked = currentConfig.cache.enabled;
  elements.cacheTtl.value = currentConfig.cache.ttlHours.toString();
  
  // Blacklist
  elements.blacklist.value = currentConfig.blacklistDomains.join('\n');
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  elements.provider.addEventListener('change', () => {
    showProviderSettings(elements.provider.value as LLMProvider);
  });
  
  elements.save.addEventListener('click', saveConfig);
  elements.reset.addEventListener('click', resetConfig);
  elements.clearCache.addEventListener('click', clearCache);
}

/**
 * Show provider-specific settings
 */
function showProviderSettings(provider: LLMProvider): void {
  elements.geminiSettings.classList.toggle('hidden', provider !== 'gemini');
  elements.openaiSettings.classList.toggle('hidden', provider !== 'openai');
  elements.claudeSettings.classList.toggle('hidden', provider !== 'claude');
}

/**
 * Save configuration
 */
async function saveConfig(): Promise<void> {
  try {
    const config: Config = {
      llm: {
        provider: elements.provider.value as LLMProvider,
        gemini: {
          apiKey: elements.geminiKey.value.trim(),
          model: elements.geminiModel.value,
        },
        openai: {
          apiKey: elements.openaiKey.value.trim(),
          model: elements.openaiModel.value,
          baseURL: DEFAULT_CONFIG.llm.openai.baseURL,
        },
        claude: {
          apiKey: elements.claudeKey.value.trim(),
          model: elements.claudeModel.value,
        },
      },
      quiz: {
        auto: elements.quizAuto.checked,
        autoSubmit: elements.quizSubmit.checked,
        delayMin: parseInt(elements.delayMin.value) || 50,
        delayMax: parseInt(elements.delayMax.value) || 200,
      },
      audio: {
        enabled: elements.audioEnabled.checked,
        source: currentConfig.audio.source,
        tts: elements.audioTts.checked,
        ttsVoice: currentConfig.audio.ttsVoice,
        volume: currentConfig.audio.volume,
        pushToTalk: currentConfig.audio.pushToTalk,
        autoCopy: elements.audioCopy.checked,
        autoSend: currentConfig.audio.autoSend,
      },
      cache: {
        enabled: elements.cacheEnabled.checked,
        ttlHours: parseInt(elements.cacheTtl.value) || 24,
      },
      blacklistDomains: elements.blacklist.value
        .split('\n')
        .map(d => d.trim())
        .filter(d => d.length > 0),
    };
    
    // Validate required API key
    const selectedProvider = config.llm.provider;
    if (!config.llm[selectedProvider].apiKey) {
      showStatus(`Enter ${selectedProvider} API key`, 'error');
      return;
    }
    
    // Save to background
    const response = await chrome.runtime.sendMessage({
      type: MSG_TYPES.CFG_SET,
      payload: config,
    });
    
    if (response?.ok) {
      currentConfig = config;
      showStatus('Saved ✓', 'success');
      
      // Notify content scripts
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'CONFIG_UPDATED' }).catch(() => {});
          }
        });
      });
    } else {
      showStatus('Save failed', 'error');
    }
  } catch (error) {
    console.error('Save error:', error);
    showStatus('Save failed', 'error');
  }
}

/**
 * Reset configuration to defaults
 */
async function resetConfig(): Promise<void> {
  if (!confirm('Reset all settings?')) return;
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: MSG_TYPES.CFG_SET,
      payload: DEFAULT_CONFIG,
    });
    
    if (response?.ok) {
      currentConfig = { ...DEFAULT_CONFIG };
      populateForm();
      showStatus('Reset ✓', 'success');
    }
  } catch {
    showStatus('Reset failed', 'error');
  }
}

/**
 * Clear cache
 */
async function clearCache(): Promise<void> {
  try {
    await chrome.storage.local.remove('qorva_cache');
    showStatus('Cache cleared ✓', 'success');
  } catch {
    showStatus('Clear failed', 'error');
  }
}

/**
 * Show status message
 */
function showStatus(message: string, type: 'success' | 'error'): void {
  elements.status.textContent = message;
  elements.status.className = `status ${type}`;
  
  setTimeout(() => {
    elements.status.textContent = '';
  }, 2000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
