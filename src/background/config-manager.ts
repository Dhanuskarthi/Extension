/**
 * QORVA - Configuration Manager
 * Handles chrome.storage.sync operations
 */

import type { Config } from '../shared/types';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '../shared/constants';

class ConfigManager {
  private config: Config | null = null;
  private listeners: Set<(config: Config) => void> = new Set();

  /**
   * Get storage area (sync with local fallback)
   */
  private getStorage(): chrome.storage.StorageArea {
    return chrome.storage.sync || chrome.storage.local;
  }

  /**
   * Initialize config from storage
   */
  async init(): Promise<Config> {
    try {
      const storage = this.getStorage();
      const result = await storage.get(STORAGE_KEYS.config);
      this.config = this.mergeWithDefaults(result[STORAGE_KEYS.config]);
      
      // Listen for storage changes
      chrome.storage.onChanged.addListener((changes) => {
        if (changes[STORAGE_KEYS.config]) {
          this.config = this.mergeWithDefaults(changes[STORAGE_KEYS.config].newValue);
          this.notifyListeners();
        }
      });
      
      return this.config;
    } catch (error) {
      console.error('[ConfigManager] Failed to init config, trying local fallback:', error);
      try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.config);
        this.config = this.mergeWithDefaults(result[STORAGE_KEYS.config]);
        return this.config;
      } catch (localError) {
        console.error('[ConfigManager] Local fallback also failed:', localError);
        this.config = { ...DEFAULT_CONFIG };
        return this.config;
      }
    }
  }

  /**
   * Get current config
   */
  async get(): Promise<Config> {
    if (!this.config) {
      return this.init();
    }
    return this.config;
  }

  /**
   * Get a specific config section
   */
  async getSection<K extends keyof Config>(section: K): Promise<Config[K]> {
    const config = await this.get();
    return config[section];
  }

  /**
   * Update config
   */
  async set(updates: Partial<Config>): Promise<void> {
    const current = await this.get();
    const newConfig = { ...current, ...updates };
    
    // Deep merge for nested properties
    if (updates.llm) {
      newConfig.llm = { ...current.llm, ...updates.llm };
    }
    if (updates.quiz) {
      newConfig.quiz = { ...current.quiz, ...updates.quiz };
    }
    if (updates.audio) {
      newConfig.audio = { ...current.audio, ...updates.audio };
    }
    if (updates.cache) {
      newConfig.cache = { ...current.cache, ...updates.cache };
    }
    
    const storage = this.getStorage();
    await storage.set({ [STORAGE_KEYS.config]: newConfig });
    this.config = newConfig;
    this.notifyListeners();
  }

  /**
   * Update a specific section
   */
  async setSection<K extends keyof Config>(
    section: K,
    value: Partial<Config[K]>
  ): Promise<void> {
    const current = await this.get();
    const currentSection = current[section];
    
    let newSection: Config[K];
    if (typeof currentSection === 'object' && !Array.isArray(currentSection)) {
      newSection = { ...currentSection, ...value } as Config[K];
    } else {
      newSection = value as Config[K];
    }
    
    const newConfig = {
      ...current,
      [section]: newSection,
    };
    
    const storage = this.getStorage();
    await storage.set({ [STORAGE_KEYS.config]: newConfig });
    this.config = newConfig;
    this.notifyListeners();
  }

  /**
   * Reset config to defaults
   */
  async reset(): Promise<void> {
    const storage = this.getStorage();
    await storage.set({ [STORAGE_KEYS.config]: DEFAULT_CONFIG });
    this.config = { ...DEFAULT_CONFIG };
    this.notifyListeners();
  }

  /**
   * Subscribe to config changes
   */
  subscribe(listener: (config: Config) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Check if API key is configured for current provider
   */
  async isApiKeyConfigured(): Promise<boolean> {
    const config = await this.get();
    const provider = config.llm.provider;
    if (provider === 'chrome-ai') {
      return true;
    }
    const providerConfig = config.llm[provider];
    return !!providerConfig?.apiKey;
  }

  /**
   * Validate API key format (basic validation)
   */
  validateApiKey(provider: string, key: string): boolean {
    if (!key || key.trim().length === 0) {
      return false;
    }

    switch (provider) {
      case 'gemini':
        // Gemini keys typically start with 'AI'
        return key.length >= 20;
      case 'openai':
        // OpenAI keys start with 'sk-'
        return key.startsWith('sk-') && key.length >= 40;
      case 'claude':
        // Anthropic keys start with 'sk-ant-'
        return key.startsWith('sk-ant-') && key.length >= 40;
      case 'groq':
        // Groq keys start with 'gsk_'
        return key.startsWith('gsk_') && key.length >= 40;
      default:
        return key.length >= 10;
    }
  }

  /**
   * Merge config with defaults (handle missing fields)
   */
  private mergeWithDefaults(stored: Partial<Config> | undefined): Config {
    if (!stored) {
      return { ...DEFAULT_CONFIG };
    }
    
    return {
      llm: { ...DEFAULT_CONFIG.llm, ...stored.llm },
      quiz: { ...DEFAULT_CONFIG.quiz, ...stored.quiz },
      audio: { ...DEFAULT_CONFIG.audio, ...stored.audio },
      cache: { ...DEFAULT_CONFIG.cache, ...stored.cache },
      ui: { ...DEFAULT_CONFIG.ui, ...stored.ui },
      pro: { ...DEFAULT_CONFIG.pro, ...stored.pro },
      blacklistDomains: stored.blacklistDomains || DEFAULT_CONFIG.blacklistDomains,
    };
  }

  /**
   * Notify all listeners of config change
   */
  private notifyListeners(): void {
    if (this.config) {
      this.listeners.forEach(listener => listener(this.config!));
    }
  }
}

// Export singleton instance
export const configManager = new ConfigManager();
