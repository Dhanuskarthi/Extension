/**
 * QORVA - LLM Router
 * Multi-provider support: Gemini, OpenAI, Claude
 */

import type {
  QuizQuestion,
  QuizAnswer,
  AudioQAResponse,
  LLMResponse,
} from '../shared/types';
import { LLM_ENDPOINTS, PROMPTS, RATE_LIMIT } from '../shared/constants';
import { extractJSON, formatError } from '../shared/utils';
import { configManager } from './config-manager';

// Request queue for rate limiting
interface QueuedRequest {
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

class LLMRouter {
  private activeRequests = 0;
  private requestQueue: QueuedRequest[] = [];
  private retryCount = 0;

  /**
   * Answer a quiz question
   */
  async answerQuiz(question: QuizQuestion): Promise<LLMResponse<QuizAnswer>> {
    const prompt = this.buildQuizPrompt(question);
    
    try {
      const response = await this.executeWithRateLimit(() => 
        this.callLLM(prompt)
      );
      
      const answer = extractJSON<QuizAnswer>(response);
      
      if (!answer) {
        // Retry once if JSON parsing fails
        if (this.retryCount < RATE_LIMIT.maxRetries) {
          this.retryCount++;
          return this.answerQuiz(question);
        }
        
        return {
          success: false,
          error: 'Failed to parse LLM response',
          retryable: true,
        };
      }
      
      this.retryCount = 0;
      return { success: true, data: answer };
    } catch (error) {
      return {
        success: false,
        error: formatError(error),
        retryable: this.isRetryableError(error),
      };
    }
  }

  /**
   * Answer an audio question
   */
  async answerAudio(transcript: string): Promise<LLMResponse<AudioQAResponse>> {
    const prompt = PROMPTS.audio.replace('{{transcript}}', transcript);
    
    try {
      const response = await this.executeWithRateLimit(() => 
        this.callLLM(prompt)
      );
      
      const answer = extractJSON<AudioQAResponse>(response);
      
      if (!answer) {
        return {
          success: false,
          error: 'Failed to parse LLM response',
          retryable: true,
        };
      }
      
      return { success: true, data: answer };
    } catch (error) {
      return {
        success: false,
        error: formatError(error),
        retryable: this.isRetryableError(error),
      };
    }
  }

  /**
   * Analyze image using Gemini Vision API to extract text/info
   */
  async analyzeImage(imageUrl: string): Promise<LLMResponse<string>> {
    try {
      const config = await configManager.get();
      const geminiConfig = config.llm.gemini;
      
      if (!geminiConfig?.apiKey) {
        return { success: false, error: 'Gemini API key not configured', retryable: false };
      }
      
      // Fetch image and convert to base64
      const imageData = await this.fetchImageAsBase64(imageUrl);
      if (!imageData) {
        return { success: false, error: 'Failed to fetch image', retryable: true };
      }
      
      // Use Gemini Vision model
      const visionModel = 'gemini-1.5-flash';
      const url = `${LLM_ENDPOINTS.gemini}/${visionModel}:generateContent?key=${geminiConfig.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Extract all text and important information from this image. If it contains a table, schedule, or graphic, describe the key data. Be concise but complete.' },
              { inline_data: { mime_type: imageData.mimeType, data: imageData.base64 } }
            ],
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Gemini Vision error: ${response.status}`);
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log('[QORVA] Image analysis result:', text.substring(0, 100) + '...');
      return { success: true, data: text };
    } catch (error) {
      return { success: false, error: formatError(error), retryable: true };
    }
  }

  /**
   * Fetch image and convert to base64
   */
  private async fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string } | null> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      
      const blob = await response.blob();
      const mimeType = blob.type || 'image/png';
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({ base64, mimeType });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  /**
   * Build quiz prompt from question
   */
  private buildQuizPrompt(question: QuizQuestion): string {
    const choicesStr = question.choices
      .map((choice, i) => `(${i}) ${choice}`)
      .join('\n');
    
    return PROMPTS.quiz
      .replace('{{question_text}}', question.text)
      .replace('{{choices}}', choicesStr);
  }

  /**
   * Execute request with rate limiting
   */
  private async executeWithRateLimit<T>(
    execute: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        execute: execute as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      };
      
      if (this.activeRequests < RATE_LIMIT.maxConcurrent) {
        this.processRequest(request);
      } else {
        this.requestQueue.push(request);
      }
    });
  }

  /**
   * Process a request
   */
  private async processRequest(request: QueuedRequest): Promise<void> {
    this.activeRequests++;
    
    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error as Error);
    } finally {
      this.activeRequests--;
      this.processNextInQueue();
    }
  }

  /**
   * Process next request in queue
   */
  private processNextInQueue(): void {
    if (this.requestQueue.length > 0 && this.activeRequests < RATE_LIMIT.maxConcurrent) {
      const next = this.requestQueue.shift();
      if (next) {
        this.processRequest(next);
      }
    }
  }

  /**
   * Call LLM API based on configured provider (with multi-key rotation)
   */
  private async callLLM(prompt: string): Promise<string> {
    const config = await configManager.get();
    const provider = config.llm.provider;
    const providerConfig = config.llm[provider];
    
    // Build keys array: primary key + additional keys
    const keys: string[] = [];
    if (providerConfig?.apiKey) keys.push(providerConfig.apiKey);
    if (providerConfig?.apiKeys?.length) {
      providerConfig.apiKeys.forEach(k => {
        if (k && !keys.includes(k)) keys.push(k);
      });
    }
    
    if (keys.length === 0) {
      throw new Error(`API key not configured for ${provider}`);
    }
    
    // Try each key until one works
    let lastError: Error | null = null;
    
    for (const apiKey of keys) {
      try {
        switch (provider) {
          case 'gemini':
            return await this.callGemini(prompt, apiKey, providerConfig.model);
          case 'openai':
            return await this.callOpenAI(
              prompt,
              apiKey,
              providerConfig.model,
              providerConfig.baseURL
            );
          case 'claude':
            return await this.callClaude(prompt, apiKey, providerConfig.model);
          default:
            throw new Error(`Unsupported provider: ${provider}`);
        }
      } catch (error) {
        lastError = error as Error;
        
        // Only rotate on quota/rate limit errors (429)
        if (this.isQuotaError(error)) {
          console.log(`[QORVA] API key exhausted, trying next key...`);
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }
    
    // All keys exhausted
    throw new Error(`All API keys exhausted: ${lastError?.message || 'quota limit'}`);
  }

  /**
   * Check if error is a quota/rate limit error
   */
  private isQuotaError(error: unknown): boolean {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return msg.includes('429') ||
             msg.includes('quota') ||
             msg.includes('rate limit') ||
             msg.includes('exhausted');
    }
    return false;
  }

  /**
   * Call Gemini API
   */
  private async callGemini(
    prompt: string,
    apiKey: string,
    model: string
  ): Promise<string> {
    const url = `${LLM_ENDPOINTS.gemini}/${model}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    prompt: string,
    apiKey: string,
    model: string,
    baseURL?: string
  ): Promise<string> {
    const url = baseURL || LLM_ENDPOINTS.openai;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Call Claude API
   */
  private async callClaude(
    prompt: string,
    apiKey: string,
    model: string
  ): Promise<string> {
    const response = await fetch(LLM_ENDPOINTS.claude, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Claude API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('timeout') ||
        message.includes('network') ||
        message.includes('503') ||
        message.includes('529')
      );
    }
    return false;
  }

  /**
   * Get current queue status
   */
  getStatus(): { active: number; queued: number } {
    return {
      active: this.activeRequests,
      queued: this.requestQueue.length,
    };
  }
}

// Export singleton instance
export const llmRouter = new LLMRouter();
