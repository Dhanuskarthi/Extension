/**
 * QORVA - License Manager
 * Handles PRO license verification and daily usage tracking
 */

import { configManager } from './config-manager';

class LicenseManager {
  private static instance: LicenseManager;

  static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  /**
   * Check if user can make a request (daily limit check)
   */
  async canMakeRequest(): Promise<{ allowed: boolean; reason?: string }> {
    const config = await configManager.get();
    const pro = config.pro;

    // PRO or devMode bypasses limits
    if (pro.isPro || pro.devMode) {
      return { allowed: true };
    }

    // Check if we need to reset daily counter
    const today = new Date().toDateString();
    if (pro.lastResetDate !== today) {
      await this.resetDailyUsage();
      return { allowed: true };
    }

    // Check if under limit
    if (pro.usedToday < pro.dailyLimit) {
      return { allowed: true };
    }

    return { 
      allowed: false, 
      reason: `Daily limit reached (${pro.usedToday}/${pro.dailyLimit})` 
    };
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(): Promise<void> {
    const config = await configManager.get();
    
    // Reset if new day
    const today = new Date().toDateString();
    if (config.pro.lastResetDate !== today) {
      await this.resetDailyUsage();
      return;
    }

    // Increment usage
    config.pro.usedToday++;
    await configManager.set({ pro: config.pro });
  }

  /**
   * Reset daily usage counter
   */
  async resetDailyUsage(): Promise<void> {
    const config = await configManager.get();
    config.pro.usedToday = 0;
    config.pro.lastResetDate = new Date().toDateString();
    await configManager.set({ pro: config.pro });
    console.log('[QORVA] Daily usage reset');
  }

  /**
   * Activate PRO with license key (simple validation)
   */
  async activatePro(licenseKey: string): Promise<{ success: boolean; error?: string }> {
    // Simple validation: key must be 16+ chars, alphanumeric with dashes
    const keyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    
    if (!keyPattern.test(licenseKey.toUpperCase())) {
      return { success: false, error: 'Invalid license key format' };
    }

    // For now, accept any valid format (integration with Gumroad/Paddle later)
    const config = await configManager.get();
    config.pro.isPro = true;
    config.pro.licenseKey = licenseKey.toUpperCase();
    config.pro.dailyLimit = 9999; // Unlimited for PRO
    await configManager.set({ pro: config.pro });

    console.log('[QORVA] PRO activated with key:', licenseKey.substring(0, 8) + '...');
    return { success: true };
  }

  /**
   * Deactivate PRO
   */
  async deactivatePro(): Promise<void> {
    const config = await configManager.get();
    config.pro.isPro = false;
    config.pro.licenseKey = undefined;
    config.pro.dailyLimit = 10; // Back to free limit
    await configManager.set({ pro: config.pro });
    console.log('[QORVA] PRO deactivated');
  }

  /**
   * Get current usage stats
   */
  async getUsageStats(): Promise<{ used: number; limit: number; isPro: boolean }> {
    const config = await configManager.get();
    return {
      used: config.pro.usedToday,
      limit: config.pro.dailyLimit,
      isPro: config.pro.isPro || config.pro.devMode,
    };
  }
}

export const licenseManager = LicenseManager.getInstance();
