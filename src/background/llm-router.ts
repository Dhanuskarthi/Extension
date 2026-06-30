/**
 * QORVA - LLM Router
 * Multi-provider support: Gemini, OpenAI, Claude
 */

import type {
  QuizQuestion,
  QuizAnswer,
  AudioQAResponse,
  LLMResponse,
  Config,
} from '../shared/types';
import { LLM_ENDPOINTS, PROMPTS, RATE_LIMIT, SUPPORTED_LANGUAGES } from '../shared/constants';
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
    const config = await configManager.get();
    const prompt = this.buildQuizPrompt(question, config);
    
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
        const errData = await this.safeParseJSON(response);
        throw new Error(errData?.error?.message || `Gemini Vision error: ${response.status}`);
      }
      
      const data = await this.safeParseJSON(response);
      if (!data) {
        throw new Error('Failed to parse Gemini Vision response');
      }
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
  private buildQuizPrompt(question: QuizQuestion, config: Config): string {
    const choicesStr = question.choices
      .map((choice, i) => `(${i}) ${choice}`)
      .join('\n');
    
    let prompt = PROMPTS.quiz;
    const showExp = config.ui?.showExplanation;
    
    if (!showExp) {
      prompt = `You are a quiz AI. Return ONLY valid JSON:
{"answer_index": <INTEGER>, "explanation": ""{{#translate}}, "translation": {"answer": "<translated answer>", "explanation": ""}{{/translate}}}

Question: {{question_text}}

Choices:
{{choices}}

IMPORTANT RULES:
- answer_index MUST be the NUMBER in parentheses before the correct choice
- Return the NUMBER, not a letter
- Leave explanation empty
- DO NOT return text outside of JSON
{{#translate}}- Also translate the answer to {{language}}{{/translate}}`;
    }
    
    const translation = config.ui?.translation;
    if (translation?.enabled) {
      const langObj = SUPPORTED_LANGUAGES.find(l => l.code === translation.language);
      const languageName = langObj ? langObj.name : translation.language;
      
      prompt = prompt
        .replace(/\{\{#translate\}\}/g, '')
        .replace(/\{\{\/translate\}\}/g, '')
        .replace(/\{\{language\}\}/g, languageName);
    } else {
      prompt = prompt.replace(/\{\{#translate\}\}[\s\S]*?\{\{\/translate\}\}/g, '');
    }
    
    return prompt
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
    
    if (provider === 'chrome-ai') {
      return await this.callChromeAI(prompt);
    }
    
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
          case 'groq':
            return await this.callGroq(prompt, apiKey, providerConfig.model);
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
      const errData = await this.safeParseJSON(response);
      throw new Error(errData?.error?.message || `Gemini API error: ${response.status}`);
    }
    
    const data = await this.safeParseJSON(response);
    if (!data) {
      throw new Error('Failed to parse Gemini API response');
    }
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
      const errData = await this.safeParseJSON(response);
      throw new Error(errData?.error?.message || `OpenAI API error: ${response.status}`);
    }
    
    const data = await this.safeParseJSON(response);
    if (!data) {
      throw new Error('Failed to parse OpenAI API response');
    }
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
      const errData = await this.safeParseJSON(response);
      throw new Error(errData?.error?.message || `Claude API error: ${response.status}`);
    }
    
    const data = await this.safeParseJSON(response);
    if (!data) {
      throw new Error('Failed to parse Claude API response');
    }
    return data.content?.[0]?.text || '';
  }

  /**
   * Call Groq API
   */
  private async callGroq(
    prompt: string,
    apiKey: string,
    model: string
  ): Promise<string> {
    const response = await fetch(LLM_ENDPOINTS.groq, {
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
      const errData = await this.safeParseJSON(response);
      throw new Error(errData?.error?.message || `Groq API error: ${response.status}`);
    }
    
    const data = await this.safeParseJSON(response);
    if (!data) {
      throw new Error('Failed to parse Groq API response');
    }
    return data.choices?.[0]?.message?.content || '';
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

  /**
   * Safely parse JSON from a response, avoiding "Unexpected end of JSON input" SyntaxErrors
   */
  private async safeParseJSON(response: Response): Promise<any> {
    try {
      const text = await response.text();
      if (!text || text.trim() === '') {
        return null;
      }
      return JSON.parse(text);
    } catch (e) {
      console.warn('[LLMRouter] safeParseJSON failed:', e);
      return null;
    }
  }

  /**
   * Call Free AI (Hybrid DuckDuckGo + Pollinations)
   */
  private async callChromeAI(prompt: string): Promise<string> {
    try {
      console.log('[QORVA] Trying DuckDuckGo Chat (Instant)...');
      return await this.callDuckDuckGo(prompt);
    } catch (e) {
      console.warn('[QORVA] DuckDuckGo Chat failed, falling back to Pollinations...', e);
      return await this.callPollinations(prompt);
    }
  }

  /**
   * Call DuckDuckGo Chat API (GPT-4o-mini, instant response)
   */
  private async callDuckDuckGo(prompt: string): Promise<string> {
    const statusUrl = 'https://duckduckgo.com/duckchat/v1/status';
    const statusRes = await fetch(statusUrl, {
      headers: {
        'x-vqd-accept': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!statusRes.ok) {
      throw new Error(`DuckDuckGo Auth failed: ${statusRes.status}`);
    }
    
    const vqdToken = statusRes.headers.get('x-vqd-4');
    if (!vqdToken) {
      throw new Error('Failed to retrieve DuckDuckGo VQD token');
    }
    
    const chatUrl = 'https://duckduckgo.com/duckchat/v1/chat';
    const chatRes = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'x-vqd-4': vqdToken,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!chatRes.ok) {
      throw new Error(`DuckDuckGo request failed: ${chatRes.status}`);
    }
    
    const reader = chatRes.body?.getReader();
    if (!reader) {
      throw new Error('DuckDuckGo response body is empty');
    }
    
    const decoder = new TextDecoder();
    let textBuffer = '';
    let aiResponse = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });
      const lines = textBuffer.split('\n');
      textBuffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.substring(5).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const data = JSON.parse(jsonStr);
            if (data.chunk) {
              aiResponse += data.chunk;
            }
          } catch {
            // Ignore parse errors on control frames
          }
        }
      }
    }
    
    return aiResponse.trim();
  }

  /**
   * Call Pollinations.ai proxy as fallback
   */
  private async callPollinations(prompt: string): Promise<string> {
    const models = ['openai', 'mistral', 'llama'];
    let lastError: Error | null = null;
    
    for (const model of models) {
      try {
        console.log(`[QORVA] Trying Pollinations with model: ${model}...`);
        const url = 'https://text.pollinations.ai/';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            model: model
          })
        });
        
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim() !== '') {
            console.log(`[QORVA] Pollinations succeeded with model: ${model}`);
            return text.trim();
          }
        }
        
        console.warn(`[QORVA] Pollinations model ${model} failed with status: ${res.status}`);
        lastError = new Error(`Pollinations request failed with status: ${res.status}`);
      } catch (e) {
        console.warn(`[QORVA] Pollinations model ${model} threw error:`, e);
        lastError = e as Error;
      }
    }
    
    throw lastError || new Error('Pollinations failed to return a response');
  }
}

// Export singleton instance
export const llmRouter = new LLMRouter();
