/**
 * QORVA - Cache Manager
 * Handles caching of LLM responses in chrome.storage.local
 */

import type { QuizQuestion, QuizAnswer, CacheEntry } from '../shared/types';
import { STORAGE_KEYS } from '../shared/constants';
import { hashString } from '../shared/utils';
import { configManager } from './config-manager';

interface CacheStore {
  [key: string]: CacheEntry<unknown>;
}

class CacheManager {
  private cache: CacheStore = {};
  private initialized = false;

  /**
   * Initialize cache from storage
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.cache);
      this.cache = result[STORAGE_KEYS.cache] || {};
      this.initialized = true;
      
      // Clean expired entries on init
      await this.cleanExpired();
    } catch (error) {
      console.error('[CacheManager] Failed to init:', error);
      this.cache = {};
      this.initialized = true;
    }
  }

  /**
   * Get cached quiz answer
   */
  async getQuizAnswer(question: QuizQuestion): Promise<QuizAnswer | null> {
    await this.init();
    
    const config = await configManager.get();
    if (!config.cache.enabled) return null;
    
    const key = this.generateQuizKey(question);
    const entry = this.cache[key] as CacheEntry<QuizAnswer> | undefined;
    
    if (!entry) return null;
    
    // Check if expired
    if (this.isExpired(entry)) {
      delete this.cache[key];
      await this.save();
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cached quiz answer
   */
  async setQuizAnswer(question: QuizQuestion, answer: QuizAnswer): Promise<void> {
    await this.init();
    
    const config = await configManager.get();
    if (!config.cache.enabled) return;
    
    const key = this.generateQuizKey(question);
    const ttl = config.cache.ttlHours * 60 * 60 * 1000; // Convert hours to ms
    
    this.cache[key] = {
      data: answer,
      timestamp: Date.now(),
      ttl,
    };
    
    await this.save();
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache = {};
    await chrome.storage.local.remove(STORAGE_KEYS.cache);
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<{ entries: number; size: number }> {
    await this.init();
    
    const entries = Object.keys(this.cache).length;
    const size = JSON.stringify(this.cache).length;
    
    return { entries, size };
  }

  /**
   * Generate cache key for quiz question
   */
  private generateQuizKey(question: QuizQuestion): string {
    const content = `${question.text}::${question.choices.join('|')}`;
    return `quiz:${hashString(content)}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Clean expired entries
   */
  private async cleanExpired(): Promise<void> {
    let hasChanges = false;
    
    for (const key of Object.keys(this.cache)) {
      if (this.isExpired(this.cache[key])) {
        delete this.cache[key];
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await this.save();
    }
  }

  /**
   * Save cache to storage
   */
  private async save(): Promise<void> {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.cache]: this.cache });
    } catch (error) {
      console.error('[CacheManager] Failed to save:', error);
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
